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

  // Give the strategy a name
  that.name  = options.name || "github";

  // Build the authentication routes required
  that.setupRoutes= function( app ) {
    app.use('/auth/github_callback', function(req, res){
      req.authenticate([that.name], function(error, authenticated) {
        res.writeHead(303, { 'Location': req.session.github_redirect_url });
        res.end('');
      });
    });
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
    var parsedUrl= url.parse(request.originalUrl, true);
    var self= this;
    if( request.getAuthDetails()['github_login_attempt_failed'] === true ) {
      // Because we bounce through authentication calls across multiple requests
      // we use this to keep track of the fact we *Really* have failed to authenticate
      // so that we don't keep re-trying to authenticate forever.
      // (To clarify this infinite retry that we're stopping here would only
      //  occur when the attempt has failed, not when it has succeeded!!!)
      delete request.getAuthDetails()['github_login_attempt_failed'];
      self.fail( callback );
    }
    else {
      if(  parsedUrl.query && parsedUrl.query.code ) {
        my._oAuth.getOAuthAccessToken(parsedUrl.query.code,
                                       {redirect_uri: my._redirectUri}, function( error, access_token, refresh_token ){
                                         if( error ) callback(error)
                                         else {
                                           request.session["access_token"]= access_token;
                                           if( refresh_token ) request.session["refresh_token"]= refresh_token;
                                             my._oAuth.getProtectedResource("https://github.com/api/v2/json/user/show", request.session["access_token"], function (error, data, response) {
                                             if( error ) {
                                               request.getAuthDetails()['github_login_attempt_failed'] = true;
                                               self.fail(callback);
                                             }else {
                                               self.success(JSON.parse(data).user, callback)
                                             }
                                           })
                                         }
                                       });
      }
      else if( parsedUrl.query && parsedUrl.query.error ) {
        request.getAuthDetails()['github_login_attempt_failed'] = true;
        self.fail(callback);
      }     
      else {
         request.session['github_redirect_url']= request.originalUrl;
         var redirectUrl= my._oAuth.getAuthorizeUrl({redirect_uri : my._redirectUri, scope: my.scope })
         self.redirect(response, redirectUrl, callback);
       }
    }
  }
  return that;
};