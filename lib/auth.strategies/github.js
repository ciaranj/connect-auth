/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth= require("oauth").OAuth2,
    url = require("url"),
    connect = require("connect"),
    http = require('http');
    
Github= module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};
  
  // Give the strategy a name
  that.name  = options.name || "github";
  
  // Build the authentication routes required 
  that.setupRoutes= function(server) {
    server.use('/', connect.router(function routes(app){
      app.get('/auth/github_callback', function(req, res){
        req.authenticate([that.name], function(error, authenticated) {
          res.writeHead(303, { 'Location': req.session.github_redirect_url });
          res.end('');
        });
      });
    }));
  }

  // Construct the internal OAuth client
  my._oAuth= new OAuth(options.appId,  
                        options.appSecret,  
                        "https://github.com/", 
                        "login/oauth/authorize", 
                        "login/oauth/access_token");
  my._redirectUri= options.callback;
  my.scope= options.scope || "";

  // Declare the method that actually does the authentication
  that.authenticate= function(request, response, callback) {
    //todo: makw the call timeout ....
    var parsedUrl= url.parse(request.url, true);
    var self= this; 
    if(  parsedUrl.query && parsedUrl.query.code ) {
      my._oAuth.getOAuthAccessToken(parsedUrl.query.code, 
                                     {redirect_uri: my._redirectUri}, function( error, access_token, refresh_token ){
                                       if( error ) callback(error)
                                       else {
                                         request.session["access_token"]= access_token;
                                         if( refresh_token ) request.session["refresh_token"]= refresh_token;
                                           my._oAuth.getProtectedResource("https://github.com/api/v2/json/user/show", request.session["access_token"], function (error, data, response) {
                                           if( error ) {
                                             self.fail(callback);
                                           }else {
                                             self.success(JSON.parse(data).user, callback)
                                           }
                                         })
                                       }
                                     });
    }
    else { 
       request.session['github_redirect_url']= request.url;
       var redirectUrl= my._oAuth.getAuthorizeUrl({redirect_uri : my._redirectUri, scope: my.scope })
       self.redirect(response, redirectUrl, callback);
     }
  }  
  return that;
};  