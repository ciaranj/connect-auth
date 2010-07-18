/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */

/** 
 * Module dependencies.
 */
var connect= require('connect');
var sys= require('sys');
var StrategyExecutor= require('./strategyExecutor');
var Strategies= require('./strategies');

module.exports = function auth(options) {
  options = options || {};
  
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
  
  var server=  connect.createServer(  
    function auth(req, res, next) {
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
          else strategyExecutor.authenticate(strategy, scope, req, res, function(error, executionResult){
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
  });

  var strategyExecutor = new StrategyExecutor(new Strategies(options, server))
 
  return server;
};