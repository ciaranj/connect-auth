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
module.exports.authenticate= function(strategy, opts, callback, strategyExecutor, res) {
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

   trace( "Authenticating ("+this.headers.host + this.url+")", scope, ">>>" );
   if( req.isAuthenticated(scope) ) {
     trace( "Authentication successful (Already Authenticated)", scope, "<<<"  );
     callback(null, true);
   }
   else {
     strategyExecutor.authenticate(strategy, {scope:scope, request:req, response:res}, function (error, executionResult) {
       //TODO: This needs tidying up, the HTTP strategies have bled...
       if( executionResult) {
         req.getAuthDetails().errorResponse= executionResult.errorResponse;
       }

       if(error) {
         trace( "Authentication error: "+ error, scope, "<<<" );
         callback(error);
       }
       else {
         if( executionResult.authenticated === true ) {
           trace( "Authentication successful", scope, "<<<"  );
           if( scope === undefined) {
            req.getAuthDetails().user= executionResult.user;
           }
           else {
             if( req.getAuthDetails().scopedUsers[scope] === undefined ) {
              req.getAuthDetails().scopedUsers[scope] = {};
             }
             req.getAuthDetails().scopedUsers[scope].user=  executionResult.user;
           }
         }
         else if( executionResult.authenticated === false ) {
           trace( "Authentication failed", scope, "<<<"  );
         }
         else {
           trace( "Authentication ongoing (Requires browser interaction)", scope, "<<<"  );
         }
         callback(null, executionResult.authenticated)
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