/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>  
 * Derived from work by 'Stunti'
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
  my._oAuth= new OAuth(options.appId,  options.appSecret, "https://foursquare.com", "/oauth2/authenticate", "/oauth2/access_token");
  my._oAuth.setAccessTokenName("oauth_token");
  my._redirectUri= options.callback;

  // Give the strategy a name
  that.name  = options.name || "foursquare";
  
  // Build the authentication routes required 
  that.setupRoutes= function( app ) {
    app.use('/auth/foursquare_callback', function(req, res){        
      req.authenticate([that.name], function(error, authenticated) {
        res.writeHead(303, { 'Location': req.session.foursquare_redirect_url });
        res.end('');
      });
    });
  }

  // Declare the method that actually does the authentication
  that.authenticate= function(request, response, callback) {
    //todo: makw the call timeout ....
    var parsedUrl= url.parse(request.originalUrl, true);
    var self= this; 
    this._foursquare_fail= function(callback) {
         request.getAuthDetails()['foursquare_login_attempt_failed']= true;
         this.fail(callback);
    }
    if( request.getAuthDetails()['foursquare_login_attempt_failed'] === true ) {
      // Because we bounce through authentication calls across multiple requests
      // we use this to keep track of the fact we *Really* have failed to authenticate
      // so that we don't keep re-trying to authenticate forever.
      delete request.getAuthDetails()['foursquare_login_attempt_failed'];
      self.fail( callback );
    }
    else {
      if( parsedUrl.query && ( parsedUrl.query.code || parsedUrl.query.error === 'access_denied' ) ) {
        if( parsedUrl.query.error == 'access_denied' ) {
          self._foursquare_fail(callback);
        } else {
          my._oAuth.getOAuthAccessToken(parsedUrl.query && parsedUrl.query.code ,
                                       {redirect_uri: my._redirectUri,grant_type : "authorization_code"},
                                       function( error, access_token, refresh_token ){
                                         if( error ) callback(error)
                                         else {
                                           request.session["access_token"]= access_token;
                                           if( refresh_token ) request.session["refresh_token"]= refresh_token;
                                           my._oAuth.getProtectedResource("https://api.foursquare.com/v2/users/self", request.session["access_token"], function (error, data, response) {
                                             if( error ) {
                                               self._foursquare_fail(callback);
                                             }else {
                                               self.success(JSON.parse(data), callback)
                                             }
                                           })
                                         }
                                       });
        }
      }
      else {
         request.session['foursquare_redirect_url']= request.originalUrl;
         var redirectUrl= my._oAuth.getAuthorizeUrl({redirect_uri : my._redirectUri, response_type: "code" })
         self.redirect(response, redirectUrl, callback);
       }
     }
  }
  return that;
};