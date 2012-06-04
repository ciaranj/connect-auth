/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * Copyright(c) 2012 Kamil Kaminski <kamil.kaminski@nasza-klasa.pl>
 * MIT Licensed
 */
var OAuth2= require("oauth").OAuth2,
    OAuth1= require("oauth").OAuth,
    url = require("url"),
    http = require('http'),

    querystring = require('querystring');

module.exports= function(options, server) {
  options= options || {};
  var that= {};
  var my= {};

  // Construct the internal OAuth client
  my._oAuth= new OAuth2(options.appId,  options.appSecret,  "https://nk.pl", "/oauth2/login", "/oauth2/token");
  my._oAuth.setAccessTokenName('nk_token');
  my._rest_oAuth= new OAuth1('http://opensocial.nk-net.pl/v09/rest/', 'http://opensocial.nk-net.pl/v09/token/get/', options.appId, options.appSecret, '1.0', null, 'HMAC-SHA1', null, {"Accept" : "*/*",
                                   "Connection" : "close",
                                   "User-Agent" : "Node authentication",
				   "Content-Type" : "application/json"});
  my._redirectUri= options.callback;
  my.scope= options.scope || "BASIC_PROFILE_ROLE,EMAIL_PROFILE_ROLE";
  my.display =options.display || "page";

  // Give the strategy a name
  that.name  = options.name || "nk";

  // Build the authentication routes required
  that.setupRoutes= function(app) {
    app.use('/auth/nk_callback', function(req, res){
      req.authenticate([that.name], function(error, authenticated) {
//FIXME: Handle server timeouts or other exceptions
        res.writeHead(303, { 'Location': req.session.nk_redirect_url });
        res.end('');
      });
    });
  };

  // Declare the method that actually does the authentication
  that.authenticate= function(request, response, callback) {
    //todo: makw the call timeout ....
    var parsedUrl= url.parse(request.originalUrl, true);
    var self= this;
    this._nk_fail= function(callback) {
         request.getAuthDetails()['nk_login_attempt_failed'] = true;
         this.fail(callback);
    };

    if( request.getAuthDetails()['nk_login_attempt_failed'] === true ) {
      // Because we bounce through authentication calls across multiple requests
      // we use this to keep track of the fact we *Really* have failed to authenticate
      // so that we don't keep re-trying to authenticate forever.
      delete request.getAuthDetails()['nk_login_attempt_failed'];
      self.fail( callback );
    }
    else {
      if( parsedUrl.query && ( parsedUrl.query.code || parsedUrl.query.error_reason === 'user_denied' ) ) {
        if( parsedUrl.query.error_reason == 'user_denied' ) {
          self._nk_fail(callback);
        } else {
          my._oAuth.getOAuthAccessToken(parsedUrl.query && parsedUrl.query.code ,
                                       {redirect_uri: my._redirectUri,grant_type: 'authorization_code'}, function( error, access_token, refresh_token ){
                                         if( error ) callback(error);
                                         else {
                                           request.session["access_token"]= access_token;
                                           if( refresh_token ) request.session["refresh_token"]= refresh_token;

					my._rest_oAuth._performSecureRequest(null, '', 'GET', "http://opensocial.nk-net.pl/v09/social/rest/people/@me?fields=id,displayName,thumbnailUrl,emails&nk_token="+request.session['access_token'], {}, '', 'application/json', function(error, data, response) {
                                             if( error ) {
                                               self._nk_fail(callback);
                                             }else {
                                               self.success(JSON.parse(data).entry, callback);
                                             }
                                           });
                                         }
                                       });
        }
      }
      else {
         request.session['nk_redirect_url']= request.originalUrl;
         var redirectUrl= my._oAuth.getAuthorizeUrl({redirect_uri : my._redirectUri, scope: my.scope, display:my.display, response_type: 'code'});
         self.redirect(response, redirectUrl, callback);
       }
     }
  };
  return that;
};
