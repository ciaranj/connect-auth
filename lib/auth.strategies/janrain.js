/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth= require("oauth").OAuth2,
    https = require('https');

/*
 * Provides basic support for Janrain / RPX SSO
 * Would work best when using a dedicated authentication-app page
 *
 * Please note this strategy requires there to be a bodyDecoder module
 * in the connect stack prior to it.
 */
module.exports= function(options, server) {
  options= options || {}
  var that= {};
  var my= {};
  that.name     = options.name || "janrain";

  // Todo: connect-auth should really have a global auth failure app associated with it.
  my.failedLoginPath= options.failedLoginPath || '/';
  my.appDomain= options.appDomain;
  my.callback= options.callback;
  my.signInUrl= "https://"+ my.appDomain+".rpxnow.com/openid/v2/signin?token_url="+ escape(my.callback)
  my.apiKey= options.apiKey;

  // Build the authentication routes required
  that.setupRoutes= function( app ) {
    app.use( '/auth/janrain_callback', function(req,res) {
      if( req.method == 'GET' ) req.getAuthDetails().janrain_came_back_with_get= true; // If we get a GET to this url it suggests a login failure.
      req.authenticate([that.name], function(error, authenticated) {
          res.writeHead(303, { 'Location': req.getAuthDetails().janrain_redirect_url });
          res.end('');
      })
    });
  }
  // Declare the method that actually does the authentication
  that.authenticate= function(req, res, callback) {
    var self= this;
    
    this._janrain_fail= function() {
      req.getAuthDetails().janrain_login_attempt_failed= true;
      this.fail(callback);
    }
    if( req.getAuthDetails().janrain_login_attempt_failed === true ) { // Phase 3 [Fail scenario where an immediaet re-test occurs in the consumer code]
      delete req.getAuthDetails().janrain_login_attempt_failed;
      self.fail( callback );
    }
    else if( req.getAuthDetails().janrain_came_back_with_get === true ) {  // Phase 2 (Fail)
      delete req.getAuthDetails().janrain_came_back_with_get;
      self._janrain_fail( callback );
    }
    else if( req.body && req.body.token ) { // Phase 2 (Succeed)
      var options = {
        host: 'rpxnow.com',
        port: 443,
        path:'/api/v2/auth_info?apiKey=' + my.apiKey + '&token=' + req.body.token,
        method: 'GET',
        headers: {'host' : 'rpxnow.com'}
      };

      var request = https.request(options, function (response) {
        var result= "";
        response.setEncoding('utf8');
        response.addListener('data', function (chunk) {
          result += chunk;
        });
        response.addListener('end', function () {
          if( response.statusCode != 200 ) {
              self._janrain_fail( callback );
          } else {
            var data= JSON.parse(result);
            self.success(data.profile, callback)
          }
        });
      });
      request.end();
    }
    else {  // Phase 1
      req.getAuthDetails()['janrain_redirect_url']= req.originalUrl;
      self.redirect(res, my.signInUrl, callback);
    }
  }
  return that;
};