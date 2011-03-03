/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth= require("oauth").OAuth,
    url = require("url"),
    connect = require("connect"),
    http = require('http');

Twitter= module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};

  // Construct the internal OAuth client
  my._oAuth= new OAuth("http://twitter.com/oauth/request_token",
                         "http://twitter.com/oauth/access_token", 
                         options.consumerKey,  options.consumerSecret, 
                         "1.0", options.callback || null, "HMAC-SHA1");

  // Give the strategy a name
  that.name  = options.name || "twitter";
  
  // Build the authentication routes required 
  that.setupRoutes= function(server) {
    server.use('/', connect.router(function routes(app){
      app.get('/auth/twitter_callback', function(req, res){
        req.authenticate([that.name], function(error, authenticated) {
          res.writeHead(303, { 'Location': req.session.twitter_redirect_url });
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
    if( parsedUrl.query && parsedUrl.query.oauth_token && request.session.auth["twitter_oauth_token_secret"] ) {
      my._oAuth.getOAuthAccessToken(parsedUrl.query.oauth_token, request.session.auth["twitter_oauth_token_secret"],
                              function( error, oauth_token, oauth_token_secret, additionalParameters ) {
                                if( error ) callback(null);
                                else {
                                  request.session.auth["twitter_oauth_token_secret"]= oauth_token_secret;
                                  request.session.auth["twitter_oauth_token"]= oauth_token;
                                  var user= { user_id: additionalParameters.user_id,
                                             username: additionalParameters.screen_name }
                                  self.executionResult.user= user; 
                                  self.success(user, callback)
                                }
                              });
    }
    else {
      my._oAuth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, oauth_authorize_url, additionalParameters ) {
        if(error) {
          callback(null); // Ignore the error upstream, treat as validation failure.
        } else {
          request.session['twitter_redirect_url']= request.url;
          request.session.auth["twitter_oauth_token_secret"]= oauth_token_secret;
          request.session.auth["twitter_oauth_token"]= oauth_token;
          self.redirect(response, "http://twitter.com/oauth/authenticate?oauth_token=" + oauth_token, callback);
        }
      });
    }
  }  
  return that;
};
