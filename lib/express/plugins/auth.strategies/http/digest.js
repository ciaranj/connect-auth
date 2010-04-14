var md5= require('support/ext/lib/ext/md5'),
    utils = require('express/utils');

var sys= require('sys');    

exports.Digest= BaseHttpStrategy.extend({
   constructor: function(options){
     var options= options || {}
     BaseHttpStrategy.prototype.constructor.call(this, options)
     this._realm= options.realm || "test" 
     this._getPasswordForUser= options.getPasswordForUser;
   },
   
   authenticate: function(request, callback) {
     var self= this;
     var authHeader= request.header('Authorization');
     //      Digest username="foo", realm="test", nonce="b343d03296358b5d7f985500568b", uri="/", response="52bc08c966a3b16bedb62f1b4a5b40f8"
     //TODO: parse this properly, temporary regex hack.
     var isDigest=  /^[D]igest\s.+"/.exec(authHeader)
     var username=  /^[D]igest\susername="(.+?)"/.exec(authHeader)
     var response=  /^[D]igest.+?response="(.+?)"/.exec(authHeader)
     var nonce=  /^[D]igest.+?nonce="(.+?)"/.exec(authHeader)
     if( isDigest && username && username[1]  && response && response[1] && nonce && nonce[1]) {
       nonce= nonce[1];
       username= username[1];
       response= response[1];
     } 
     var method= request.method
     var href= request.url.href
     
     
     this._getPasswordForUser(username, function(error, password){
       if(error) callback(error);
       else {
         var HA1= md5.hash( username+":"+ self._realm + ":"+ password)
         var HA2= md5.hash( method+ ":" + href )
         var myResponse= md5.hash(HA1 + ":"+ nonce + ":"+ HA2 )
         if( myResponse == response ) {
           self.success({"username":username}, callback);
         }
         else {
           self._unAuthenticated(request, callback)
         }
       }
     })
     
   },

   getAuthenticateResponseHeader: function( request ) {
     return "Digest realm=" + this._realm + ", nonce="+ utils.uid();
   }
});