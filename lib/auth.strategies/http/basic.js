var Base64= require('support/ext/lib/ext/base64'),
    basicMatchRegex = /^[Bb]asic\s([a-zA-z0-9=]+)/;
    
exports.Basic= BaseHttpStrategy.extend({
   constructor: function(options){
     var options= options || {}
     BaseHttpStrategy.prototype.constructor.call(this, options)
     this._realm= options.realm || "test"
     this._getPasswordForUser= options.getPasswordForUser;
   },
   
   authenticate: function(request, callback) {
     var self= this;
     var username,password;
     var authHeader= request.header('Authorization');
     var credentials= basicMatchRegex.exec(authHeader)
     
     if( credentials && credentials[1] ) {
       var providedCredentials= Base64.decode(credentials[1]);
       var splitCredentials= providedCredentials.split(":");
       username= splitCredentials[0];
       password= splitCredentials[1];
       self._getPasswordForUser(username, function(error, pswd) {
          if(error) callback(error); 
          else {
            if( pswd == password) {
             self.success({"username":username}, callback);
            }
            else { 
             self._unAuthenticated(request, callback)
            }
          }
       });
     } 
     else {
       self._unAuthenticated(request, callback)
     }
   },

   getAuthenticateResponseHeader: function( request ) {
     return "Basic realm=" + this._realm;
   }
});