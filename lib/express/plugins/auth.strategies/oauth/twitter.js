var OAuth= require("./oauth").OAuth
var sys = require('sys'),
   http = require('http');
   
exports.Twitter= OAuth.extend({
   constructor: function(options){
     options.requestUrl= "http://twitter.com/oauth/request_token";
     options.accessUrl= "http://twitter.com/oauth/access_token";
     options.authorizeUrl= "http://twitter.com/oauth/authorize?oauth_token=";
     options.oauthVersion= "1.0";
     options.signatureMethod= "HMAC-SHA1";
     
     OAuth.prototype.constructor.call(this, options)
   },
   
   authenticate: function(request, callback) {     
     //todo: makw the call timeout ....
     var self= this;
      this.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, additionalParameters ) {
        if(error) {
          sys.puts("Error: " + error);
          callback(null); // Ignore the error upstream, treat as validation failure.
        } else {
          request.redirect( self._authorizeUrl+ oauth_token );
        }
      });
    // request.redirect(this._getUrl())
//     this.fail(callback);
   }
   
});