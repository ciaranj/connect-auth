var sys= require('sys'),
    Base64= require('support/ext/lib/ext/base64');
var basicMatchRegex = /^[Bb]asic\s([a-zA-z0-9=]+)/;

exports.Auth = Plugin.extend({
  constructor: function(options) {
    var  options= options || {}
       , self= this;
    
    this._authorize= options.onAuthorize || this._defaultOnAuthorize;
    
    Request.include({
      isAuthorized: function(callback) {
        var request= this;
        if( self._isAuthorised(request) ) callback(null, true);
        if( !request.auth.provided ) self._unAuthorized(request, callback);
        if( !request.auth.basic ) self._badRequest(request, callback);
        self._authorize(request.auth.username, request.auth.password, function(error, authorized){
          if( authorized) {
            request.REMOTE_USER= request.auth.username;
            callback(null, true);
          }
          else {
            self._unAuthorized(request, callback); 
          }
        }) 
      }
    });
  },

  _badRequest: function ( request, callback ) {
    request.halt(400, 'Bad Request');
    callback(null, false);
  },
  
  _isAuthorised: function( request ) {
    return request.REMOTE_USER !== undefined;
  },

  _unAuthorized: function( request ) {
    request.header('WWW-Authenticate','Basic realm=test');
    request.halt(401, "Authorization Required");
    callback(null, false);
  },
  
  _defaultOnAuthorize: function(username, password, callback) {
    callback(null, false);
  },
  
  on: {
    request: function(event) {  
      var auth= {},
          authHeader,
          match;
      
      // Not sure where to hang these properties nicely :(
      event.request.REMOTE_USER= undefined;
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