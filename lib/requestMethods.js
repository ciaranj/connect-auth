/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
 
/* 
 * This file contains the methods that will become 'mixed-in' with the connect request object, namely:
 * 
 *   authenticate( [strategy|options], callback(err, succcessFailOngoing) )
 *   getAuthDetails
 *   isAuthenticated( [scope] )
 *   isUnAuthenticated( [scope] )
 *   logout( [scope], [callback(err)])
 */
module.exports.authenticate= function(strategy, opts, callback, strategyExecutor, res, firstLoginHandler) {
   var strategy, opts, callback;
   var scope;

   var trace= this.getAuthDetails().trace;
   var req= this;

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
   // Choose the first strategy defined if no strategy provided
   if( !strategy && strategyExecutor.strategies ) {
     for( var k in strategyExecutor.strategies ) {
       strategy= [strategyExecutor.strategies[k].name];
       break;
     }
   }

   // Sometimes the authentication scope needs to passed between requests, we store this information
   // transiently on the session.
   if( scope === undefined && req.getAuthDetails().__performingAuthentication && req.getAuthDetails().__originalScope ) {
     scope= req.getAuthDetails().__originalScope;
   }

   trace( "Authenticating ("+this.headers.host + this.originalUrl+")", scope, ">>>" );
   if( req.isAuthenticated(scope) ) {
     delete req.getAuthDetails().__performingAuthentication;
     delete req.getAuthDetails().__originalUrl;
     delete req.getAuthDetails().__originalScope;
     trace( "Authentication successful (Already Authenticated)", scope, "<<<" );
     callback(null, true);
   }
   else {
     var authContext= {scope:scope, request:req, response:res};
     strategyExecutor.authenticate(strategy, authContext, function (error, executionResult) {
       //TODO: This needs tidying up, the HTTP strategies have bled...
       if( executionResult) {
         req.getAuthDetails().errorResponse= executionResult.errorResponse;
         if( req.getAuthDetails().__originalUrl ) {
           executionResult.originalUrl= req.getAuthDetails().__originalUrl;
         } else {
           executionResult.originalUrl= req.originalUrl;
         }
       }
       if(error) {
         delete req.getAuthDetails().__performingAuthentication;
         delete req.getAuthDetails().__originalUrl;
         delete req.getAuthDetails().__originalScope
         trace( "Authentication error: "+ error, scope, "<<<" );
         callback(error);
       }
       else {
         if( executionResult.authenticated === true ) {
           trace( "Authentication successful", scope, "<<<" );
           executionResult.originalUrl= req.getAuthDetails().__originalUrl;
           delete req.getAuthDetails().__originalUrl;
           delete req.getAuthDetails().__originalScope

           if( scope === undefined) {
            req.getAuthDetails().user= executionResult.user;
           }
           else {
             if( req.getAuthDetails().scopedUsers[scope] === undefined ) {
              req.getAuthDetails().scopedUsers[scope] = {};
             }
             req.getAuthDetails().scopedUsers[scope].user=  executionResult.user;
           }

           if( req.getAuthDetails().__performingAuthentication ) {
             try {
               delete req.getAuthDetails().__performingAuthentication;
               trace( "Firing 'FirstLogin' Handler", scope, "$$$" );
               firstLoginHandler( authContext, executionResult, callback );
             }
             catch(err) {
               trace( "error: With executing firstLoginHandler" + err.stack );
             }
           }
           else  {
             callback(null, executionResult.authenticated)
           }
         }
         else if( executionResult.authenticated === false ) {
           delete req.getAuthDetails().__performingAuthentication;
           delete req.getAuthDetails().__originalUrl;
           delete req.getAuthDetails().__originalScope;
           trace( "Authentication failed", scope, "<<<" );
           callback(null, executionResult.authenticated)
         }
         else {
           req.getAuthDetails().__performingAuthentication= true;
           req.getAuthDetails().__originalUrl= req.originalUrl;
           req.getAuthDetails().__originalScope= scope;
           trace( "Authentication ongoing (Requires browser interaction)", scope, "<<<" );
           callback(null, executionResult.authenticated)
         }
       }
     });
   }
};

 // mixins...
module.exports.getAuthDetails= function() {
   return this._connect_auth
};

module.exports.isAuthenticated= function(scope) {
   if( scope === undefined ) {
     return (this.getAuthDetails().user) ? true : false;
   }
   else {
     return (this.getAuthDetails().scopedUsers[scope] && this.getAuthDetails().scopedUsers[scope].user) ? true : false;
   }
};

module.exports.isUnAuthenticated= function(scope) {
   return !this.isAuthenticated( scope );
};

module.exports.logout= function( authContext, logoutHandler, middlewareCallback ) {
   var ad= this.getAuthDetails();
   ad.trace( "Logout", authContext.scope, "!!!" );
   var user;
   if( authContext.scope === undefined) {
     user= ad.user;
     delete ad.user;
     ad.scopedUsers= {};
   }
   else {
     user= ad.scopedUsers[authContext.scope].user;
     delete ad.scopedUsers[authContext.scope].user;
   }
   logoutHandler( authContext, user, middlewareCallback );
};