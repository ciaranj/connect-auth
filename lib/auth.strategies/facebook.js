/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth= require("oauth").OAuth2,
    url = require("url"),
    connect = require("connect"),
    http = require('http');

Facebook= module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};
  
  // Construct the internal OAuth client
  my._oAuth= new OAuth(options.appId,  options.appSecret,  "https://graph.facebook.com");
  my._redirectUri= options.callback;
  my.scope= options.scope || "";
  my._failedUri = options.failedUri;
  my._ready = false;

  // Give the strategy a name
  that.name  = options.name || "facebook";
  
  // Build the authentication routes required 
  that.setupRoutes= function(server) {
    server.use('/', connect.router(function routes(app){
      app.get('/auth/facebook_callback', function(req, res){
        req.authenticate([that.name], function(error, authenticated) {
          if( my._ready ) { 
            if( authenticated ) {
              res.writeHead(303, { 'Location': req.session.facebook_redirect_url });
              res.end('');
            } else {
              if( typeof my._failedUri === 'undefined' ) {
                res.end('Authentication failed');
              } 
              else {
                var parsedUrl= url.parse( req.url, false );
                var failedUri= my._failedUri;
                //TODO: naieve approach, doesn't allow for when a configured failure
                // url has its own query parameters already.
                // Since we're relying on session presence anyway, might be better to store
                // the failure reasons in the session anyway?s
                if( parsedUrl.search !== undefined && parsedUrl.search != "" ){
                  failedUri= failedUri + parsedUrl.search;
                }
                res.writeHead(303, { 'Location': failedUri });
                res.end('');
              }
            }
          }
        });
      });
    }));
  }

  // Declare the method that actually does the authentication
  that.authenticate= function(request, response, callback) {
    //todo: makw the call timeout ....
    var parsedUrl= url.parse(request.url, true);
    var self= this;
    if( parsedUrl.query && ( parsedUrl.query.code || parsedUrl.query.error_reason === 'user_denied' ) ) {
      if( parsedUrl.query.error_reason == 'user_denied' ) {
        my._ready = true;
        self.fail(callback);
      } else {
        my._oAuth.getOAuthAccessToken(parsedUrl.query && parsedUrl.query.code , 
                                     {redirect_uri: my._redirectUri}, function( error, access_token, refresh_token ){
                                       my._ready = true;
                                       if( error ) callback(error)
                                       else {
                                         request.session["access_token"]= access_token;
                                         if( refresh_token ) request.session["refresh_token"]= refresh_token;
                                           my._oAuth.getProtectedResource("https://graph.facebook.com/me", request.session["access_token"], function (error, data, response) {
                                           if( error ) {
                                             self.fail(callback);
                                           }else {
                                             self.success(JSON.parse(data), callback)
                                           }
                                         })
                                       }
                                     });
      }
    }
    else {
       request.session['facebook_redirect_url']= request.url;
       var redirectUrl= my._oAuth.getAuthorizeUrl({redirect_uri : my._redirectUri, scope: my.scope })
       self.redirect(response, redirectUrl, callback);
     }
  }
  return that;
};