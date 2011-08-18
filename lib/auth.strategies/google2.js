/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth= require("oauth").OAuth2,
    url = require("url"),
    connect = require("connect"),
    http = require('http');

module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};
  
  // Construct the internal OAuth client
  my._oAuth= new OAuth(options.appId,  options.appSecret,  "", "https://accounts.google.com/o/oauth2/auth", "https://accounts.google.com/o/oauth2/token");
  my._redirectUri= options.callback;
  my.scope= options.scope || "https://www.google.com/m8/feeds/";

  // Give the strategy a name
  that.name  = options.name || "google2";
  
  // Build the authentication routes required 
  that.setupRoutes= function(server) {
    server.use('/', connect.router(function routes(app){
      app.get('/oauth2callback', function(req, res){
        req.authenticate([that.name], function(error, authenticated) {
          res.writeHead(303, { 'Location': req.session.facebook_redirect_url });
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
    this._facebook_fail= function(callback) {
         request.getAuthDetails()['facebook_login_attempt_failed'] = true;
         this.fail(callback);
    }

    if( request.getAuthDetails()['facebook_login_attempt_failed'] === true ) {
      // Because we bounce through authentication calls across multiple requests
      // we use this to keep track of the fact we *Really* have failed to authenticate
      // so that we don't keep re-trying to authenticate forever.
      delete request.getAuthDetails()['facebook_login_attempt_failed'];
      self.fail( callback );
    }
    else {
      if( parsedUrl.query && ( parsedUrl.query.code || parsedUrl.query.error === 'access_denied' ) ) {
        if( parsedUrl.query.error == 'access_denied' ) {
          self._facebook_fail(callback);
        } else {
          my._oAuth.getOAuthAccessToken(parsedUrl.query.code ,
                                       {redirect_uri: my._redirectUri, grant_type: 'authorization_code'}, function( error, access_token, refresh_token ){
                                         if( error ) callback(error)
                                         else {
                                           request.session["access_token"]= access_token;
                                           if( refresh_token ) request.session["refresh_token"]= refresh_token;
                                           my._oAuth.get(
                                             "https://www.google.com/m8/feeds/contacts/default/full/0?alt=json",
                                             access_token,
                                             function(error, data){
                                               if( error ) {
                                                 self._facebook_fail(callback);
                                               } else {
                                                 var profile = { 'username': JSON.parse(data).entry.id.$t };
                                                 self.success(profile, callback);
                                               }
                                             });
                                         }
                                       });
        }
      }
      else {
         request.session['facebook_redirect_url']= request.url;
         var redirectUrl= my._oAuth.getAuthorizeUrl({redirect_uri : my._redirectUri, scope: my.scope, response_type: 'code' })
         self.redirect(response, redirectUrl, callback);
       }
     }
  }
  return that;
};