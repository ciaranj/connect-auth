/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
 var  connect= require('connect')
    , Events= require('./events')
    , RequestMethods= require('./requestMethods')
    , StrategyExecutor= require('./strategyExecutor')
    , Tracing= require('./tracing');

/**
 * Construct the authentication middleware.
 * Construction can take 2 forms:
 *    auth(<Strategy>()|[<Strategy>()])  -  A single configured strategy, or array of strategies.
 *    auth({ strategies:<Strategy>()|[<Strategy>()...]
 *           [trace: true|false|function(message, req, [scope])}])   - More powerful variant that allows for passing in other configuration options, none yet defined.
 */
module.exports = function(optionsOrStrategy) {

  var i, strategies, strategyExecutor, options, traceFunction, server;

  if( !optionsOrStrategy ) throw new Error("You must specify at least one strategy to use the authentication middleware, even if it is anonymous.");
  // Constructor form 1
  if( Array.isArray(optionsOrStrategy) || ( optionsOrStrategy.authenticate !== undefined && optionsOrStrategy.strategies === undefined  ) ) {
    strategies= Array.isArray(optionsOrStrategy) ? optionsOrStrategy : [optionsOrStrategy];
    options= {trace: false};
  }
  else {
    options= optionsOrStrategy
    strategies= Array.isArray(optionsOrStrategy.strategies) ? optionsOrStrategy.strategies : [optionsOrStrategy.strategies];
  }

  if( !options.trace ) { // If options.trace is specified as false or undefined we no-op the messages.
    traceFunction= Tracing.nullTrace;
  }
  else if( options.trace === true ) { // If options.trace is really true then we log out to console
    traceFunction= Tracing.standardTrace;
  }
  else { // Custom provided trace function
    traceFunction= options.trace;
  }

  var logoutHandler= options.logoutHandler || Events.defaultLogoutHandler;
  var firstLoginHandler= options.firstLoginHandler || Events.defaultFirstLoginHandler;

  // Construct the strategy executor.
  strategyExecutor= new StrategyExecutor( strategies )

  // Construct the middleware that adapts the request object to provide authentication primitives.

  var internalApp= connect();
  internalApp.use( function auth(req, res, next) {

      // Mix-in the static utility methods (the methods are directly on the request, and don't need the response object).
      req.getAuthDetails=    RequestMethods.getAuthDetails;
      req.isAuthenticated=   RequestMethods.isAuthenticated;
      req.isUnAuthenticated= RequestMethods.isUnAuthenticated;

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
      // Assign a tracer so if needed routes can trace.
      req.getAuthDetails().trace= function( message, scope, linePrefix ) {
        traceFunction( message, {scope:scope, request:req, response:res}, linePrefix );
      };

      // These methods require the request & response to be in their closures.
      req.authenticate= function(strategy, opts, middlewareCallback) {
        RequestMethods.authenticate.call( this, strategy, opts, middlewareCallback, strategyExecutor, res, firstLoginHandler );
      };

      req.logout= function( scope, middlewareCallback ) {
        if( typeof scope === 'function' && middlewareCallback === undefined ) {
          middlewareCallback= scope;
          scope= undefined;
        }
        RequestMethods.logout.call( this, {scope:scope, request:req, response:res}, logoutHandler, function() {
          //Clear out the saved auth details
          //TODO: this should be scope-aware.
          createAuthDetails( req );
          // Assign a tracer so if needed routes can trace.
          req.getAuthDetails().trace= function( message, scope, linePrefix ) {
            traceFunction( message, {scope:scope, request:req, response:res}, linePrefix );
          };
          
          if( middlewareCallback) middlewareCallback();
        })
      };

      // Now we've added our requisite methods to the request, call the next part of the middleware chain
      // (which may in fact be a middleware piece that enforces authentication!)
      next();
  });

  // Some strategies require routes to be defined, so give them a chance to do so.
  for(i=0;i< strategies.length; i++ ) {
    if( strategies[i].setupRoutes ) {
      strategies[i].setupRoutes(internalApp);
    }
  }

  return internalApp;
};

// Utility functions
function createAuthDetails( request ) {
   var auth= { scopedUsers: {} };
   request._connect_auth= auth;
   if( request.session ) {
     request.session.auth= auth;
   }
 };