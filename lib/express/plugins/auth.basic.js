var Base64= require('support/ext/lib/ext/base64'),
    basicMatchRegex = /^[Bb]asic\s([a-zA-z0-9=]+)/;
    
exports.BasicAuth= Auth.extend({
   constructor: function(options){
     var options= options || {}
     Auth.prototype.constructor.call(this, options)
     this._realm= options.realm || "test"
   },

   _getAuthenticateResponseHeader: function( request ) {
     return "Basic realm=" + this._realm;
   },
            
   _isValidAuthorizationRequestType: function( request ) {
     return request.auth.basic;
   },
   
   _parseAuthorizationHeader: function( authHeader, auth ) {
     var credentials= basicMatchRegex.exec(authHeader)
     if( credentials && credentials[1] ) {
       var providedCredentials= Base64.decode(credentials[1]);
       var splitCredentials= providedCredentials.split(":");
       auth.username= splitCredentials[0];
       auth.password= splitCredentials[1];
       auth.basic= true;
     } 
   }
});