/*!
 * Copyright(c) 2011 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth= require("oauth").OAuth,
    url = require("url"),
    http = require('http'),
    querystring= require('querystring');

module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};
  
  // Give the strategy a name
  that.name  = options.name || "getglue";
  
  // Build the authentication routes required 
  that.setupRoutes= function( app ) {
    app.use('/auth/getglue_callback', function(req, res){
      req.authenticate([that.name], function(error, authenticated) {
        res.writeHead(303, { 'Location': req.session.getglue_redirect_url });
        res.end('');
        delete req.session['getglue_redirect_url'];
      });
    });
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
    var parsedUrl = url.parse(request.originalUrl, true);
    //todo: make the call timeout ....
    var self = this;

    if( request.getAuthDetails()['getglue_login_attempt_failed'] === true ) {
      self.trace( 'GetGlue login attempt failed.' );
      // Because we bounce through authentication calls across multiple requests
      // we use this to keep track of the fact we *Really* have failed to authenticate
      // so that we don't keep re-trying to authenticate forever.
      delete request.session.auth["getglue_oauth_token"];
      delete request.session.auth["getglue_oauth_token_secret"];
      delete request.getAuthDetails()['getglue_login_attempt_failed'];
      self.fail( callback );
    }
    else {

      // SCope broken here (not using one)
      if ( request.session.auth["getglue_oauth_token_secret"] ) {
        self.trace( 'Phase 2/2 : Requesting an OAuth access token.' );
        // Convert a request token to an access token.
        my._oAuth.getOAuthAccessToken(request.session.auth["getglue_oauth_token"],
                                      request.session.auth["getglue_oauth_token_secret"],
                                      function(error, oauth_token, oauth_token_secret, additionalParameters) {
                                        if (error) {
                                          self.trace( 'Error retrieving the OAuth Access Token: ' + JSON.stringify(error) );
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
        self.trace( 'Phase 1/2 - Requesting an OAuth Request Token' )
        my._oAuth.getOAuthRequestToken( function(error, oauth_token, oauth_token_secret, results) {
          if (error) {
            self.trace( 'Error retrieving the OAuth Request Token: ' + JSON.stringify(error) );
            callback(null); // Ignore the error upstream, treat as validation failure.
          } else {
            request.session.auth["getglue_oauth_token"] = oauth_token;
            request.session.auth["getglue_oauth_token_secret"] = oauth_token_secret;
            request.session['getglue_redirect_url'] = request.originalUrl;
            self.redirect(response,  my._oAuth.signUrl(my._authorizeUrl, oauth_token, oauth_token_secret, "GET"), callback);
          }
        });
      }
    }
  };
  return that;
};