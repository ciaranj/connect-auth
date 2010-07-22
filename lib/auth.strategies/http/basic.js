/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */

var Base= require("./base")
var Base64= require("./base64")
var basicMatchRegex = /^[Bb]asic\s([a-zA-z0-9=]+)/;

Basic= module.exports= function (options) {
  options= options || {}
  var that= Base(options);
  var my= {};
  my._realm= options.realm || "test"
  my._getPasswordForUser= options.getPasswordForUser;
  
  that.name = options.name || "basic";

  that.authenticate= function(request, response, callback) {
    var self= this;
    var username,password;
    var authHeader= request.headers.authorization;
    var credentials= basicMatchRegex.exec(authHeader)
    
    if( credentials && credentials[1] ) {
      var providedCredentials= Base64.decode(credentials[1]);
      var splitCredentials= providedCredentials.split(":");
      username= splitCredentials[0];
      password= splitCredentials[1];
      
      my._getPasswordForUser(username, function(error, pswd) {
        if(error) callback(error); 
        else {      
          if( pswd == password) {
           self.success({"username":username}, callback);
          }
          else { 
           that._unAuthenticated(self, request, response, callback)
          }
        }
      });
    } 
    else {
      that._unAuthenticated(self, request, response, callback);
    }
  };

  that.getAuthenticateResponseHeader= function( ) {
    return "Basic realm=" + my._realm;
  }; 

  return that;
};