/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */

var OAuth= require("node-oauth").OAuth,
    url = require("url"),
    connect = require("connect"),
    http = require('http');

Yahoo= module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};

  // Construct the internal OAuth client
  my._oAuth= new OAuth( "https://api.login.yahoo.com/oauth/v2/get_request_token",
                          "https://api.login.yahoo.com/oauth/v2/get_token", 
                          options.consumerKey,  options.consumerSecret, 
                          "1.0", options.callback, "HMAC-SHA1");
                          
  // Give the strategy a name
  that.name  = options.name || "yahoo";

  // Build the authentication routes required 
  that.setupRoutes= function(server) {
    server.use('/', connect.router(function routes(app){
      app.get('/auth/yahoo_callback', function(req, res){
        req.authenticate(['yahoo'], function(error, authenticated) {
          res.writeHead(303, { 'Location': req.session.yahoo_redirect_url });
          res.end('');
        });
      });
    }));
  }                          

  // Declare the method that actually does the authentication
  that.authenticate= function(request, response, callback) {
    //todo: if multiple connect middlewares were doing this, it would be more efficient to do it in the stack??
    var parsedUrl= url.parse(request.url, true);
    //todo: makw the call timeout ....
    var self= this; 
    if(    parsedUrl.query && parsedUrl.query.oauth_token
        && parsedUrl.query.oauth_verifier 
        && request.session.auth["yahoo_oauth_token_secret"]
        && parsedUrl.query.oauth_token == request.session.auth["yahoo_oauth_token"] ) {
      
      my._oAuth.getOAuthAccessToken(parsedUrl.query.oauth_token, request.session.auth["yahoo_oauth_token_secret"], parsedUrl.query.oauth_verifier,
                               function( error, oauth_token, oauth_token_secret, additionalParameters ) {
                                 if( error ) callback(null);
                                 else {  
                                   my._oAuth.getProtectedResource("http://social.yahooapis.com/v1/user/" + additionalParameters.xoauth_yahoo_guid + "/profile?format=json", "GET", 
                                     oauth_token, oauth_token_secret, 
                                     function(error, data){
                                       if( error ) callback(null);
                                       var profile= JSON.parse(data).profile;
                                       request.session.auth["yahoo_oauth_token_secret"]= oauth_token_secret;
                                       request.session.auth["yahoo_oauth_token"]= oauth_token;
                                       self.success(profile, callback)
                                   });
                                 }
                               });
    }
    else { 
       my._oAuth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, oauth_authorize_url, additionalParameters ) {
         if(error) { 
           callback(null); // Ignore the error upstream, treat as validation failure.
         } else {
           request.session['yahoo_redirect_url']= request.url;
           request.session.auth["yahoo_oauth_token_secret"]= oauth_token_secret;
           request.session.auth["yahoo_oauth_token"]= oauth_token;
           self.redirect(response, "https://api.login.yahoo.com/oauth/v2/request_auth?oauth_token=" + oauth_token, callback);
         }
       });
     }

  }  
  return that;
};