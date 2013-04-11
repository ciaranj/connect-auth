/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth= require("oauth").OAuth2,
    url = require("url"),
    http = require('http');

module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};
  
  // Construct the internal OAuth client
  my._oAuth= new OAuth(options.appId,  options.appSecret,  "", "https://accounts.google.com/o/oauth2/auth", "https://accounts.google.com/o/oauth2/token");
  my._redirectUri= options.callback;
  my.scope= options.scope || "https://www.googleapis.com/auth/userinfo.profile";
  my.accessType = options.accessType || null;

  // Ensure we have the correct scopes to match what the consumer really wants.
  if( options.requestEmailPermission === true && my.scope.indexOf("auth/userinfo.email") == -1 ) {
      my.scope+= " https://www.googleapis.com/auth/userinfo.email";
  }
  if( my.scope.indexOf("auth/userinfo.profile") == -1 ) {
      my.scope+= " https://www.googleapis.com/auth/userinfo.profile";
  }

  // Give the strategy a name
  that.name  = options.name || "google2";
  
  // Build the authentication routes required 
  that.setupRoutes= function( app ) {
    app.use('/oauth2callback', function(req, res){
      req.authenticate([that.name], function(error, authenticated) {
        res.writeHead(303, { 'Location': req.session.google2_redirect_url });
        res.end('');
      });
    });
  }

  // Declare the method that actually does the authentication
  that.authenticate= function(request, response, callback) {
    //todo: makw the call timeout ....
    var parsedUrl= url.parse(request.originalUrl, true);
    var self= this; 
    this._google2_fail= function(callback) {
         request.getAuthDetails()['google2_login_attempt_failed'] = true;
         this.fail(callback);
    }

    if( request.getAuthDetails()['google2_login_attempt_failed'] === true ) {
      // Because we bounce through authentication calls across multiple requests
      // we use this to keep track of the fact we *Really* have failed to authenticate
      // so that we don't keep re-trying to authenticate forever.
      delete request.getAuthDetails()['google2_login_attempt_failed'];
      self.fail( callback );
    }
    else {
      if( parsedUrl.query && ( parsedUrl.query.code || parsedUrl.query.error === 'access_denied' ) ) {
        if( parsedUrl.query.error == 'access_denied' ) {
          self.trace( 'User denied OAuth Access' );
          self._google2_fail(callback);
        } else {
          self.trace( 'Phase 2/2 : Requesting an OAuth access token.' );
          my._oAuth.getOAuthAccessToken(parsedUrl.query.code ,
                                       {redirect_uri: my._redirectUri, grant_type: 'authorization_code'}, function( error, access_token, refresh_token, results ){
                                         if( error ) {
                                           self.trace( 'Error retrieving the OAuth Access Token: ' + error );
                                           callback(error)
                                         }
                                         else {
                                           request.session["access_token"]= access_token;
                                           if( refresh_token ) request.session["refresh_token"]= refresh_token;
                                           if(!!results.expires_in) {
                                               // save the access token's expiration date.
                                               // useful for offline access, where we need to regenerate the access token
                                               // before it expires (using refresh_token).
                                               var now = +new Date();
                                               request.session["access_token_expiry"] = now + (parseInt(results.expires_in, 10) * 1000);
                                           }
                                           my._oAuth.get("https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
                                             access_token,
                                             function(error, profileData){
                                               if( error ) {
                                                 self.trace( 'Error retrieving the profile data =>' + JSON.stringify(error) );
                                                 self._google2_fail(callback);
                                               } else {
                                                   var profile= JSON.parse(profileData);
                                                   self.success(profile, callback);
                                               }
                                             });
                                         }
                                       });
        }
      }
      else {
        self.trace( 'Phase 1/2 - Redirecting to Google Authorizing url' )
         request.session['google2_redirect_url']= request.originalUrl;
         var urlParams = {
           redirect_uri : my._redirectUri,
           scope: my.scope,
           response_type: 'code' 
         };
         // support offline access as per https://developers.google.com/accounts/docs/OAuth2WebServer#offline
         if(my.accessType !== null)
             urlParams.access_type = my.accessType; // access_type=offline
         var redirectUrl= my._oAuth.getAuthorizeUrl(urlParams);
         self.redirect(response, redirectUrl, callback);
       }
     }
  }
  return that;
};
