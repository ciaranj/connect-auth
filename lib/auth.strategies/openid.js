/*!
 * Copyright(c) 2011 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var  openid = require('openid')
   , url = require('url');

module.exports= function(options) {
  options= options || {};
  var that= {};
  var my= {};

  that.name       = options.name || "openid";
  that.callback   = options.callback;
  that.realm      = options.realm || null;
  that.stateless  = options.statelessVerification || false;
  that.strictMode = options.strictMode || false;
  that.extensions = options.extensions || [];
  
  that.verifyPath = url.parse(that.callback, false).pathname;

  // Build the authentication routes required
  that.setupRoutes = function( app ) {
    app.use( that.verifyPath, function(req, res){
      req.authenticate([that.name], function(error, authenticated) {
        res.writeHead(303, { 'Location': req.session.openid_redirect_url });
        res.end('');
        delete req.session['openid_redirect_url']
      });
    });
  };

   var relyingParty = new openid.RelyingParty(
        that.callback, // Verification URL (yours)
        that.realm, // Realm (optional, specifies realm for OpenID authentication)
        that.stateless, // Use stateless verification
        that.strictMode, // Strict mode
        that.extensions); // List of extensions to enable and include


  that.authenticate= function(request, response, callback) {

    var self= this;
    var parsedUrl= url.parse(request.originalUrl, true);
    if( request.getAuthDetails()['openid_login_attempt_failed'] === true ) {
      // Because we bounce through authentication calls across multiple requests
      // we use this to keep track of the fact we *Really* have failed to authenticate
      // so that we don't keep re-trying to authenticate forever.
      delete request.getAuthDetails()['openid_login_attempt_failed'];
      self.fail( callback );
    } 
    else if( parsedUrl.pathname == that.verifyPath ) {
      self.trace( 'Phase 2/2 - Verifying OpenId' )
      var result = relyingParty.verifyAssertion(request.originalUrl, function( error, result ) {
        console.log(  error)
        if( result && result.authenticated ) {
          var user= {user_id: result.claimedIdentifier };
          self.success( user, callback );
        }
        else {
          if( error ) self.trace( 'Error Verifying OpenId - ' + JSON.stringify(error) )
          else self.trace( 'Verifying OpenId Failed - ' + JSON.stringify(result) )  
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
            self.trace( 'error - ' + JSON.stringify(error) );
            self.fail( callback );
          }
          else if (!authUrl) {
            self.fail( callback );
          }
          else {
            delete request.getAuthDetails()['openid_login_attempt_failed'];
            request.session['openid_redirect_url']= request.originalUrl;
            self.redirect(response, authUrl, callback);
          }
      });
    }
  };
  return that;
};