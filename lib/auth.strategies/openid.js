/*!
 * Copyright(c) 2011 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var  connect = require("connect")
   , openid = require('openid')
   , url = require('url');

module.exports= function(options) {
  options= options || {};
  var that= {};
  var my= {};

  that.name     = options.name || "openid";

  // Build the authentication routes required
  that.setupRoutes = function(server) {
    server.use('/', connect.router(function routes(app){
      app.get('/verify', function(req, res){
        req.authenticate([that.name], function(error, authenticated) {
          res.writeHead(303, { 'Location': req.session.openid_redirect_url });
          res.end('');
        });
      });
    }));
  };

   var relyingParty = new openid.RelyingParty(
        'http://testhost.com/verify', // Verification URL (yours)
        null, // Realm (optional, specifies realm for OpenID authentication)
        false, // Use stateless verification
        false, // Strict mode
        []); // List of extensions to enable and include


  that.authenticate= function(request, response, callback) {

    var self= this;
    var parsedUrl= url.parse(request.url, true);
    if( request.getAuthDetails()['openid_login_attempt_failed'] === true ) {
      // Because we bounce through authentication calls across multiple requests
      // we use this to keep track of the fact we *Really* have failed to authenticate
      // so that we don't keep re-trying to authenticate forever.
      delete request.getAuthDetails()['openid_login_attempt_failed'];
      self.fail( callback );
    } 
    else if( parsedUrl.pathname == '/verify' ) {
      self.trace( 'Phase 2/2 - Verifying OpenId' )
      var result = relyingParty.verifyAssertion(request, function( error, result ) {
        if( result.authenticated ) {
          var user= {user_id: result.claimedIdentifier };
          self.success( user, callback );
        }
        else {
          request.getAuthDetails()['openid_login_attempt_failed'] = true;
          self.fail( callback );
        }
      });
    } 
    else {
      // User supplied identifier
      var identifier = parsedUrl.query.openid_identifier;

      self.trace( 'Phase 1/2 - Authenticating for OpenId identifier: '+ identifier );
      // Resolve identifier, associate, and build authentication URL
      relyingParty.authenticate(identifier, false, function(error, authUrl) {
          if (error) {
            self.trace( 'error - ' + error );
            request.getAuthDetails()['openid_login_attempt_failed'] = true;
            self.fail( callback );
          }
          else if (!authUrl) {
            request.getAuthDetails()['openid_login_attempt_failed'] = true;
            self.fail( callback );
          }
          else {
            request.session['openid_redirect_url']= request.url;
            self.redirect(response, authUrl, callback);
          }
      });
    }
  };
  return that;
};