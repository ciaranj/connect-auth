/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */

/** 
 * Module dependencies.
 */
var sys= require('sys');
var StrategyExecutor= require('./strategyExecutor');
var Strategies= require('./strategies');

module.exports = function auth(options) {
  options = options || {};
  
  var strategyExecutor = new StrategyExecutor(new Strategies(options))
  
  var isAuthenticated = function( request, scope ) {
    if( scope === undefined ) {
      return request.session.auth.user !== undefined;
    }
    else {
      return request.session.auth.scopedUsers[scope].user= undefined;
    }
  };
  
  var defaultGetPasswordForUser= function(username, password, callback) {
    Error.raise("No mechanism specified for retrieving user passwords.")
  };
  
  
  return function auth(req, res, next) {
    if( req.session ) {
      // Create the auth holder
      if( ! req.session.auth ) { 
        var auth= { user: undefined };
        req.session.auth= auth; 
        //TODO: move this to a prototype or somesuch
        req.session.scope= function(scope) {
          return auth.scopedUsers[scope];
        };
      }

      // Setup the utility methods
      req.authenticate = function(strategy, opts, callback) {
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
        if( isAuthenticated(req, scope) ) callback(null, true);
        else strategyExecutor.authenticate(strategy, scope, req, function(error, executionResult){
          if(error) callback(error); // I really wish the plugins code logged errors.. 
          else {
            if( !executionResult.user ) callback(null,false)
            else {
              if( scope === undefined) {
               req.session.auth.user= executionResult.user;
              }
              else {
                req.session.auth.scopedUsers[scope].user=  executionResult.user;
              }              
              callback(null, true)
            }
          }
        }); 
      };
      req.isAuthenticated= function(scope) {
        return isAuthenticated( req, scope );
      };
      req.isUnAuthenticated= function(scope) {
        return !isAuthenticated( req, scope );
      };
      req.logout= function(scope) {
        if( scope === undefined) {
         req.session.auth.user= undefined;
         req.session.auth.scopedUsers= {};
        }
        else {
          req.session.auth.scopedUsers[scope].user= undefined;
        }
      }
    }
    next();
  };
};

/*
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
 
    });
  },
  
}); 
*/