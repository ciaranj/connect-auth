var sys= require('sys'),
    Base64= require('support/ext/lib/ext/base64');
var basicMatchRegex = /^[Bb]asic\s([a-zA-z0-9=]+)/;

exports.Auth = Plugin.extend({
  constructor: function() {
    var self= this;
    Request.include({
      isAuthorized: function() {
        if( self._isAuthorised(this) ) return true;
        if( !this.auth.provided ) return self._unAuthorized(this);
        if( !this.auth.basic ) return self._badRequest(this);
        if( self._authorize(this.auth.username, this.auth.password) ) {
          this.REMOTE_USER= this.auth.username;
          return true;
        } else return self._unAuthorized(this);
      }
    });
  },

  _badRequest: function ( request ) {
    request.halt(400, 'Bad Request');
  },
  
  _isAuthorised: function( request ) {
    return request.REMOTE_USER;
  },

  _unAuthorized: function( request ) {
    request.header('WWW-Authenticate','Basic realm=test');
    request.halt(401, "Authorization Required");
    return false;
  },
  _authorize: function(username, password) {
    return username == 'test' && password == 'pass';
  },
  
  on: {
    request: function(event) { 
      var auth= {},
          authHeader,
          match;
      event.request.auth= auth;
      authHeader= event.request.header('Authorization');
       
      if( authHeader ) {
        auth.provided= true;
        var credentials= basicMatchRegex.exec(authHeader)
        if( credentials && credentials[1] ) {
          var providedCredentials= Base64.decode(credentials[1]);
          var splitCredentials= providedCredentials.split(":");
          auth.username= splitCredentials[0];
          auth.password= splitCredentials[1];
          auth.basic= true;
        } 
      }
      else auth.provided= false;
    },

    response: function(event) {
    }
  }
});