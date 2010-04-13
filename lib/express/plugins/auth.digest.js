var md5= require('support/ext/lib/ext/md5'),
    utils = require('express/utils');

var sys= require('sys');    
exports.DigestAuth= Auth.extend({
   constructor: function(options){
     var options= options || {}
     Auth.prototype.constructor.call(this, options)
     this._realm= options.realm || "test"
   },
   
   _authenticate: function(request, callback) {
     var self= this;
     self._getPasswordForUser(request.auth.username, function(error, password){
       if(error) callback(error);
       else {
         var HA1= md5.hash( request.auth.username+":"+ self._realm + ":"+ password)
         var HA2= md5.hash( request.method+ ":" + request.url.href )
         var myResponse= md5.hash(HA1 + ":"+ request.auth.nonce + ":"+ HA2 )
         callback(null, myResponse == request.auth.response )
       }
     })
     
   },

   _getAuthenticateResponseHeader: function( request ) {
     return "Digest realm=" + this._realm + ", nonce="+ utils.uid();
   },
            
   _isRecognisedAuthenticationType: function( request ) {
     return request.auth.digest;
   },
   
   _parseAuthorizationHeader: function( authHeader, auth ) {
//      Digest username="foo", realm="test", nonce="b343d03296358b5d7f985500568b", uri="/", response="52bc08c966a3b16bedb62f1b4a5b40f8"
      //TODO: parse this properly, temporary regex hack.
      var isDigest=  /^[D]igest\s.+"/.exec(authHeader)
      var username=  /^[D]igest\susername="(.+?)"/.exec(authHeader)
      var response=  /^[D]igest.+?response="(.+?)"/.exec(authHeader)
      var nonce=  /^[D]igest.+?nonce="(.+?)"/.exec(authHeader)
      if( isDigest && username && username[1]  && response && response[1] && nonce && nonce[1]) {
        auth.nonce= nonce[1];
        auth.username= username[1];
        auth.response= response[1];
        auth.digest= true;
      } 
   }
});