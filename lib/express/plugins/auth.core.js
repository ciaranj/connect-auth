var sys= require('sys');
var Request = require('express/request').Request  

exports.Auth = Plugin.extend({
  constructor: function(options) {
    
    var  options= options || {strategies:{}}
       , self= this;
    
    this._strategyExecutor= new StrategyExecutor({"strategies": new Strategies(options.strategies)})

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
          //TODO: DEFINE DEFAULT STRATEGY(IES)
        }
        var request= this;
        if( self._isAuthenticated(request, scope) ) callback(null, true);
        else self._strategyExecutor.authenticate(strategy, scope, request, function(error, executionResult){
          if(error) callback(error); // I really wish the plugins code logged errors.. 
          else {
            if( !executionResult.user ) callback(null,false)
            else {
              if( scope === undefined) {
               request.session.auth.user= executionResult.user;
              }
              else {
                request.session.auth.scopedUsers[scope].user=  executionResult.user;
              }              
              callback(null, true)
            }
          }
        }); 
      },
      
      isAuthenticated: function(scope) {
        return self._isAuthenticated( this, scope );
      },

      isUnAuthenticated: function(scope) {
        return !self._isAuthenticated( this, scope );
      },

      logout: function(scope) {
        if( scope === undefined) {
         this.session.auth.user= undefined;
         this.session.auth.scopedUsers= {};
        }
        else {
          this.session.auth.scopedUsers[scope].user= undefined;
        }

      },
    });
  },
  
  _isAuthenticated: function( request, scope ) {
    if( scope === undefined ) {
      return request.session.auth.user !== undefined;
    }
    else {
      return request.session.auth.scopedUsers[scope].user= undefined;
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
        var auth= { user: undefined };
        event.request.session.auth= auth; 
        //TODO: move this to a prototype or somesuch
        event.request.session.scope= function(scope) {
          return auth.scopedUsers[scope];
        };
      }
    }
  } 
});