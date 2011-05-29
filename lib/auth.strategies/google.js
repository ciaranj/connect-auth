/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth= require("oauth").OAuth2,
    url = require("url"),
    connect = require("connect"),
    http = require('http');

Google= module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};
  
  // Construct the internal OAuth client
  my._oAuth= new OAuth(options.appId,  options.appSecret,  "https://accounts.google.com", "/o/oauth2/auth", "/o/oauth2/token");
  my._redirectUri= options.callback;
  my.scope= options.scope || "https://www.google.com/m8/feeds/";
  my.response_type= options.response_type || "code";

  // Give the strategy a name
  that.name  = options.name || "google";
  
  // Build the authentication routes required 
  that.setupRoutes= function(server) {
    server.use('/', connect.router(function routes(app){
      app.get('/auth/google_callback', function(req, res){
        req.authenticate([that.name], function(error, authenticated) {
          res.writeHead(303, { 'Location': req.session.google_redirect_url });
          res.end('');
        });
      });
    }));
  }

  // Declare the method that actually does the authentication
  that.authenticate= function(request, response, callback) {
    //todo: makw the call timeout ....
    var parsedUrl= url.parse(request.url, true);
    var self= this; 
    if( parsedUrl.query && parsedUrl.query.code  ) {
      my._oAuth.getOAuthAccessToken(parsedUrl.query && parsedUrl.query.code , 
                                     {redirect_uri: my._redirectUri}, function( error, access_token, refresh_token ){
                                       if( error ) callback(error)
                                       else {
                                         request.session["access_token"]= access_token;
                                         if( refresh_token ) request.session["refresh_token"]= refresh_token;
                                           my._oAuth.getProtectedResource("https://www.google.com/m8/feeds/", request.session["access_token"], function (error, data, response) {
                                           if( error ) {
                                             self.fail(callback);
                                           }else {
                                             self.success(JSON.parse(data), callback)
                                           }
                                         })
                                       }
                                     });
    }
    else { 
       request.session['google_redirect_url']= request.url;
       var redirectUrl= my._oAuth.getAuthorizeUrl({redirect_uri : my._redirectUri, scope: my.scope, response_type: my.response_type })
       self.redirect(response, redirectUrl, callback);
     }
  }  
  return that;
};







/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 *
var OAuth= require("oauth").OAuth,
    url = require("url"),
    connect = require("connect"),
    http = require('http'),

Google = module.exports = function(options, server) {
  options = options || {};
  var that = {};
  var my = {};

  // Construct the internal OAuth client
  my._oAuth = new OAuth("https://www.google.com/accounts/OAuthGetRequestToken",
                        "https://www.google.com/accounts/OAuthGetAccessToken",
                        options.consumerKey, options.consumerSecret,
                        "1.0", options.callback, "HMAC-SHA1");
  
  // Give the strategy a name
  that.name = options.name || "google";

  // Build the authentication routes required 
  that.setupRoutes = function(server) {
    server.use('/', connect.router(function routes(app){
      app.get('/auth/google_callback', function(req, res){
        req.authenticate([that.name], function(error, authenticated) {
          res.writeHead(303, { 'Location': req.session.google_redirect_url });
          res.end('');
        });
      });
    }));
  };

  // Declare the method that actually does the authentication
  that.authenticate = function(request, response, callback) {
    //todo: if multiple connect middlewares were doing this, it would be more efficient to do it in the stack??
    var parsedUrl = url.parse(request.url, true);
    //todo: makw the call timeout ....
    var self= this;

    // get oauth access token
    if( parsedUrl.query &&
        parsedUrl.query.oauth_token &&
        parsedUrl.query.oauth_verifier &&
        request.session.auth["google_oauth_token_secret"] &&
        parsedUrl.query.oauth_token == request.session.auth['google_oauth_token'] ) {

      my._oAuth.getOAuthAccessToken(
        parsedUrl.query.oauth_token,
        request.session.auth["google_oauth_token_secret"],
        parsedUrl.query.oauth_verifier,
        function(error, oauth_token, oauth_token_secret, additionalParameters) {
          if( error ) callback(null);
          else {
            my._oAuth.getProtectedResource(
              "https://www.google.com/m8/feeds/contacts/default/full?alt=json",
              "GET", oauth_token, oauth_token_secret,
              function(error, data){
                if( error ) callback(null);
                var profile = { 'username': JSON.parse(data).feed.id.$t };
                request.session.auth["google_oauth_token_secret"] = oauth_token_secret;
                request.session.auth["google_oauth_token"] = oauth_token;
                self.success(profile, callback);
              });
          }
        });
    }
    // get oauth request token
    else {
      var scope = "https://www.google.com/m8/feeds/ " + options.scope;
      my._oAuth.getOAuthRequestToken(
        { "scope": scope },
        function(error, oauth_token, oauth_token_secret, oauth_authorize_url, additionalParameters ) {
          if(error) {
            callback(null); // Ignore the error upstream, treat as validation failure.
          } else {
            request.session['google_redirect_url'] = request.url;
            request.session.auth["google_oauth_token_secret"] = oauth_token_secret;
            request.session.auth["google_oauth_token"] = oauth_token;
            var authTokenURL = "https://www.google.com/accounts/OAuthAuthorizeToken?oauth_token=" + oauth_token;
            if (options.hd) authTokenURL += '&hd=' + options.hd;
            self.redirect(response, authTokenURL, callback);
          }
        });
    }

  };
  return that;
};*/
