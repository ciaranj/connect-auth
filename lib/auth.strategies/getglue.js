/*!
 * Copyright(c) 2011 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth= require("oauth").OAuth,
    url = require("url"),
    connect = require("connect"),
    http = require('http'),
    querystring= require('querystring');

module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};
  
  // Give the strategy a name
  that.name  = options.name || "getglue";
  
  // Build the authentication routes required 
  that.setupRoutes= function(server) {
    server.use('/', connect.router(function routes(app){
      app.get('/auth/getglue_callback', function(req, res){
        req.authenticate([that.name], function(error, authenticated) {
          res.writeHead(303, { 'Location': req.session.getglue_redirect_url });
          res.end('');
          delete req.session['getglue_redirect_url'];
        });
      });
    }));
  }
  my._authorizeUrl= "http://getglue.com/oauth/authorize"
  if( options.callback ) {
    my._authorizeUrl=  my._authorizeUrl+ "?" + querystring.stringify({oauth_callback: options.callback})
  }

  // Construct the internal OAuth client
  my._oAuth= new OAuth(    
    "http://api.getglue.com/oauth/request_token",
    "http://api.getglue.com/oauth/access_token",
    options.appId,
    options.appSecret,
    "1.0",
    undefined,
    'HMAC-SHA1'
  );

  // Declare the method that actually does the authentication
  that.authenticate = function(request, response, callback) {
    //todo: if multiple connect middlewares were doing this, it would be more efficient to do it in the stack??
    var parsedUrl = url.parse(request.url, true);
    //todo: make the call timeout ....
    var self = this;

    if( request.getAuthDetails()['getglue_login_attempt_failed'] === true ) {
      // Because we bounce through authentication calls across multiple requests
      // we use this to keep track of the fact we *Really* have failed to authenticate
      // so that we don't keep re-trying to authenticate forever.
      delete request.getAuthDetails()['getglue_login_attempt_failed'];
      self.fail( callback );
    }
    else {

      // SCope broken here (not using one)
      if ( request.session.auth["getglue_oauth_token_secret"] ) {
        // Convert a request token to an access token.
        my._oAuth.getOAuthAccessToken(request.session.auth["getglue_oauth_token"],
                                      request.session.auth["getglue_oauth_token_secret"],
                                      function(error, oauth_token, oauth_token_secret, additionalParameters) {
                                        if (error) {
                                          delete request.session.auth["getglue_oauth_token"];
                                          delete request.session.auth["getglue_oauth_token_secret"];
                                          request.getAuthDetails()['getglue_login_attempt_failed'] = true;
                                          self.fail(callback)
                                        }
                                        else {
                                          request.session.auth["getglue_oauth_token"] = oauth_token;
                                          request.session.auth["getglue_oauth_token_secret"] = oauth_token_secret;
                                          self.success({glue_userId: additionalParameters.glue_userId}, callback);
                                        }
                                      });
      }
      else {
        my._oAuth.getOAuthRequestToken( function(error, oauth_token, oauth_token_secret, results) {
          if (error) {
            callback(null); // Ignore the error upstream, treat as validation failure.
          } else {
            request.session.auth["getglue_oauth_token"] = oauth_token;
            request.session.auth["getglue_oauth_token_secret"] = oauth_token_secret;
            request.session['getglue_redirect_url'] = request.url;
            self.redirect(response,  my._oAuth.signUrl(my._authorizeUrl, oauth_token, oauth_token_secret, "GET"), callback);
          }
        });
      }
    }
  };
  return that;
};