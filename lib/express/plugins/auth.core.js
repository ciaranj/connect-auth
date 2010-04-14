var sys= require('sys');

exports.Auth = Plugin.extend({
  constructor: function(options) {
    
    var  options= options || {}
       , self= this;
    
    this._getPasswordForUser= options.getPasswordForUser || this._defaultGetPasswordForUser;
    
    Request.include({

      authenticate: function(strategy, opts, callback) {
        var strategy, opts, callback;
        var scope;

        //ughhh pull this rubbish somewhere tidy...
        if( strategy && opts && callback ) {
          var type= typeof strategy;
          if(  strategy.constructor != Array ) {
            strategy= [strategy]
          }
          scope= opts.scope;
        }
        else if( strategy && opts ) {
          callback= opts;
          var type= typeof strategy;
          if( strategy.constructor == Array ) {
            // do nothing
          }
          else if( type == 'string' ) {
            strategy= [strategy];
          }
          else if( type == 'object') {
            scope= strategy.scope
            strategy= undefined;
          }
        }
        else if( strategy ) {
          callback= strategy;
          strategy= undefined;
        }

        var request= this;
        if( self._isAuthenticated(request,scope) ) callback(null, true);
        
        var realStrat= new HttpStrategy({useBasic:true, useDigest:true, getPasswordForUser: options.getPasswordForUser});
//        var realStrat = new AnonymousAuthenticateStrategy()
        if( realStrat.isValid() ) {
          realStrat.authenticate(request, function(error, user) {
            if( error ) callback(error);
            else {
              if( user ) {
                if( scope === undefined) {
                 request.session.auth.user= user;
                }
                else {
                  request.session.auth.scopedUsers[scope].user= user;
                }
                callback(null, true);
              }else {
                callback(null, false);
              }
            }
          })
        }
        else callback(null, false)
      }
    });
  },

  isAuthenticated: function(scope) {
    return self._isAuthenticated( this, scope );
  },

  logout: function(scope) {
    if( scope === undefined) {
     this.session.auth.REMOTE_USER= undefined;
     this.session.auth.scopedUsers= {};
    }
    else {
      this.session.auth.scopedUsers[scope].REMOTE_USER= undefined;
    }
    
  },
  
  _isAuthenticated: function( request, scope ) {
    if( scope === undefined ) {
      return request.session.auth.REMOTE_USER !== undefined;
    }
    else {
      return request.session.auth.scopedUsers[scope].REMOTE_USER= undefined;
    }
  },

  _defaultGetPasswordForUser: function(username, password, callback) {
    Error.raise("No mechanism specified for retrieving user passwords.")
  },
  
  on: {
    request: function(event) {
      var authHeader,
          match;
      if( ! event.request.session.auth ) { 
        var auth= { REMOTE_USER: undefined };
        event.request.session.auth= auth; 
        //TODO: move this to a prototype or somesuch
        event.request.session.scope= function(scope) {
          return auth.scopedUsers[scope];
        };
      }
    }
  } 
});