var sys= require('sys');

exports.Auth = Plugin.extend({
  constructor: function(options) {
    
    var  options= options || {}
       , self= this;
    
    this._getPasswordForUser= options.getPasswordForUser || this._defaultGetPasswordForUser;
    
    Request.include({

      isAuthorized: function(callback) {  
        var request= this;

        if( self._isAuthenticated(request) ) callback(null, true);
        if( !request.auth.provided ) self._unAuthenticated(request, callback);
        if( !self._isRecognisedAuthenticationType(request) ) self._badRequest(request, callback);
        
        self._authenticate(request, function(error, authenticated){
          if( error ) callback(error);
          else {
            if( authenticated ) {
              callback(null, true);
            } else {
              self._unAuthenticated(request, callback); 
            }
          }
        })
      }
    });
  },

  _badRequest: function ( request, callback ) {
    request.halt(400, 'Bad Request');
    callback(null, false);
  },
  
  _isAuthenticated: function( request ) {
    return request.REMOTE_USER !== undefined;
  },
  
  _isRecognisedAuthenticationType: function( request ) {
    Error.raise("Unspecified authentication type.")
  },

  _getAuthenticateResponseHeader: function( request ) {
    Error.raise("WWW-Authenticate Header response has not been declared")
  },

  _parseAuthorizationHeader: function( request ) {
    Error.raise("Not sure how to parse this authentication header")
  },

  _unAuthenticated: function( request, callback ) {
    request.header('WWW-Authenticate', this._getAuthenticateResponseHeader());
    request.halt(401, "Authorization Required");
    callback(null, false);
  },

  _defaultGetPasswordForUser: function(username, password, callback) {
    Error.raise("No mechanism specified for retrieving user passwords.")
  },
  
  on: {
    request: function(event) { 
      var auth= {},
          authHeader,
          match;
      // Not sure where to hang these properties nicely :(
      event.request.REMOTE_USER= undefined;
      event.request.auth= auth;
      try {
        authHeader= event.request.header('Authorization');
        if( authHeader ) {
          auth.provided= true;
          this._parseAuthorizationHeader(authHeader, auth);
        }
        else auth.provided= false;
      }
      catch( e ) {
        auth.provided= false;
        sys.puts( e ) 
      }
    }
  }
});