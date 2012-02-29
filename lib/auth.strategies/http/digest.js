/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var  Base= require("./base")
    ,crypto= require('crypto')
    ,authutils= require('../_authutils');

var md5= function(str) {
  return crypto.createHash('md5').update(str).digest('hex');
};

module.exports= function (options) {
  options= options || {};
  var that= Base(options);
  var my= {};
  my._realm= options.realm || "secure";
  my._getSharedSecretForUser= options.getSharedSecretForUser;

  that.name = options.name || "digest";
  
  that.authenticate= function(req, res, callback) {
    var self= this;
    var authHeader= req.headers.authorization;
    if( authHeader ) this.trace( 'Authorization Header Received: ' + authHeader );

    var isDigest=  /^[D]igest\s.+"/.exec(authHeader);
    if(isDigest) {
      var credentials= authutils.splitAuthorizationHeader(authHeader);   
      var method= req.method;
      var href= req.originalUrl;
      my._getSharedSecretForUser(credentials.username, function(error, password){
        if(error) callback(error);
        else {
          var HA1= md5( credentials.username+":"+ my._realm + ":"+ password) ;
          var HA2= md5( method+ ":" + href );
          var myResponse= md5(HA1 + ":"+ credentials.nonce + ":"+ HA2 );

          if( myResponse == credentials.response ) {
            self.success({ username : credentials.username}, callback);
          }
          else {
            that._unAuthenticated(self, req, res, callback);
          }
        }
      });
    } else {
      that._unAuthenticated(self, req, res, callback);
    }
  }; 
  
  that.getAuthenticateResponseHeader= function( executionScope ) {
    return "Digest realm=\"" + my._realm.replace("\"","\\\"") + "\", nonce=\""+ authutils.getNonce(32)+"\"";
  };
  
  return that;
};