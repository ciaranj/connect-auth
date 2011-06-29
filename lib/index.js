/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */

/** 
 * Module dependencies.
 */
var connect= require('connect');
var fs= require('fs');
var StrategyExecutor= require('./strategyExecutor');

/**
 * Construct the authentication middleware.
 * Construction can take 2 forms:
 *    auth(<Strategy>()/[<Strategy>()])  -  A single configured strategy, or array of strategies.
 *    auth({strategies:<Strategy>()/[<Strategy>()...]})   - More powerful variant that allows for passing in other configuration options, none yet defined.
 */
Auth= module.exports = function(optionsOrStrategy) {

  var strategies;
  var options;
  if( !optionsOrStrategy ) throw new Error("You must specify at least one strategy to use the authentication middleware, even if it is anonymous.");
  // Constructor form 1
  if(  Array.isArray(optionsOrStrategy) || ( optionsOrStrategy.authenticate !== undefined  && 
      optionsOrStrategy.strategies === undefined  ) ) {
    strategies= Array.isArray(optionsOrStrategy) ? optionsOrStrategy : [optionsOrStrategy];
    options= {};
  }
  else {
    options= optionsOrStrategy
    strategies= Array.isArray(optionsOrStrategy.strategies) ? optionsOrStrategy.strategies : [optionsOrStrategy.strategies];
  }
  var isAuthenticated = function( request, scope ) {
    if( scope === undefined ) {
      return (request.getAuthDetails().user) ? true : false;
    }
    else {
      return (request.getAuthDetails().scopedUsers[scope] && request.getAuthDetails().scopedUsers[scope].user) ? true : false;
    }
  };     
  
  var defaultGetPasswordForUser= function(username, password, callback) {
    callback( new Error("No mechanism specified for retrieving user passwords.") );
  }; 
  
  function createAuthDetails(req) {
    var auth= { scopedUsers: {} };  
    req._connect_auth= auth;
    if( req.session ) {
      req.session.auth= auth; 
    }
  };
  
  
  var server=  connect.createServer(  
    function auth(req, res, next) {
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
        else strategyExecutor.authenticate(strategy, scope, req, res, function (error, executionResult) {
          if( executionResult) { req.getAuthDetails().errorResponse= executionResult.errorResponse; }
          if(error) callback(error); // I really wish the plugins code logged errors.. 
          else {
            if( !executionResult.user ) callback(null,false)
            else {
              if( scope === undefined) {
               req.getAuthDetails().user= executionResult.user;
              }
              else {
                if( req.getAuthDetails().scopedUsers[scope] === undefined ) {
                 req.getAuthDetails().scopedUsers[scope] = {};
                }
                req.getAuthDetails().scopedUsers[scope].user=  executionResult.user;
              }              
              callback(null, true)
            }
          }
        }); 
      };
      req.getAuthDetails= function() {
        return req._connect_auth
      };
      req.isAuthenticated= function(scope) {
        return isAuthenticated( req, scope );
      };
      req.isUnAuthenticated= function(scope) {
        return !isAuthenticated( req, scope );
      };
      req.logout= function(scope) {
        if( scope === undefined) {
         delete req.getAuthDetails().user;
         req.getAuthDetails().scopedUsers= {};
        }
        else {
          delete req.getAuthDetails().scopedUsers[scope].user;
        }
      }

      // If there is a session middleware, use it.
      if( req.session && req.session.auth ) {
        req._connect_auth= req.session.auth;                                     
      } 
      else {
        // Create the auth holder if needed.
        if( ! req.getAuthDetails() ) {
          createAuthDetails(req); 
        }
      }
      next();
  });
  
  // Some strategies require routes to be defined, so give them a chance to do so.
  for(var i=0;i< strategies.length; i++ ) {
    if( strategies[i].setupRoutes ) {
      strategies[i].setupRoutes(server);
    }
  }

  var strategyExecutor = new StrategyExecutor( strategies )
 
  return server;
};

/**
 * Auto-load bundled strategies with getters.
 */
var STRATEGY_EXCLUSIONS= {"base.js" : true,
                          "base64.js" : true};

function augmentAuthWithStrategy(filename, path) {
  if (/\.js$/.test(filename) && !STRATEGY_EXCLUSIONS[filename] && filename[0] != '_') {
      var name = filename.substr(0, filename.lastIndexOf('.'));
      var camelCaseName= name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
      Object.defineProperty(Auth, camelCaseName, { 
        get: function() {
          return require('./' + path+ '/' + name);
        },
        enumerable:true});
  }
}
//TODO: Meh could make this recurse neatly over directories, but I'm lazy.
fs.readdirSync(__dirname + '/auth.strategies').forEach(function(filename){
  augmentAuthWithStrategy(filename, '/auth.strategies')
});
fs.readdirSync(__dirname + '/auth.strategies/http').forEach(function(filename){
  augmentAuthWithStrategy(filename, '/auth.strategies/http')
});
fs.readdirSync(__dirname + '/auth.strategies/oauth').forEach(function(filename){
  augmentAuthWithStrategy(filename, '/auth.strategies/oauth')
});
