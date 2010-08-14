/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth= require("oauth").OAuth2,
    connect = require("connect"),
    http = require('http');

/*
 * Provides basic support for Janrain / RPX SSO
 * Would work best when using a dedicated authentication-app page
 * 
 * Please note this strategy requires there to be a bodyDecoder module
 * in the connect stack prior to it.
 */
Janrain= module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};
  that.name     = options.name || "janrain";
  
  // Todo: connect-auth should really have a global auth failure app associated with it.
  my.failedLoginPath= options.failedLoginPath || '/';
  my.appDomain= options.appDomain;
  my.callback= options.callback;
  my.signInUrl= "https://"+ my.appDomain+".rpxnow.com/openid/v2/signin?token_url="+ escape(my.callback)
  my.apiKey= options.apiKey;
  
  // Build the authentication routes required 
  that.setupRoutes= function(server) {
    server.use('/', connect.router(function routes(app){
      app.post('/auth/janrain_callback', function(req, res){
        if( req.body && req.body.token ) {
          req.authenticate([that.name], function(error, authenticated) {
            if( error ) { console.log(error) }
            else {
              if( authenticated ) {
                //todo: support an optional passed argument, when using embedded urls.  
                var redirectTo= req.session.auth.janrain_redirect_url || '/';
                res.writeHead(303, { 'Location': redirectTo });
                res.end('');
              }
              else { 
                //TODO: connect-auth should have a notion of failed apps.
                res.writeHead(303, { 'Location': my.failedLoginPath });
                res.end('');
              }
            }
          });
        }
        else {
          res.writeHead(303, { 'Location': my.failedLoginPath });
          res.end('');
        }
      });
    })); 
  }
  // Declare the method that actually does the authentication
  that.authenticate= function(req, res, callback) {
    var self= this; 
    if( req.body && req.body.token ) { // Phase 2 
      var google = http.createClient(443, 'rpxnow.com', true);
      var request = google.request('GET', '/api/v2/auth_info?apiKey=' + my.apiKey + '&token=' + req.body.token, {'host': 'rpxnow.com'});
      var result= "";
      request.addListener('response', function (response) {
        response.setEncoding('utf8');
        response.addListener('data', function (chunk) {
          result += chunk;
        });
        response.addListener('end', function () {
          if( response.statusCode != 200 ) {
              self.fail(callback);
          } else {
            var data= JSON.parse(result);
            self.success(data.profile, callback)
          }          
        });
      });
      request.end();
    }
    else {  // Phase 1
      req.session.auth['janrain_redirect_url']= req.url;
      self.redirect(res, my.signInUrl, callback);
    }
  }  
  return that;
};