/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
module.exports.defaultLogoutHandler= function( authContext, loggedOutUser, callback ) {
  if( callback ) callback();
}

/**
 * Provides a basic 'out of the box' factory function for 
 * redirecting a user to a specified url on logout
 */
module.exports.redirectOnLogout= function( redirectUrl ) {
  return function( authContext, loggedOutUser, callback ) {
    authContext.response.writeHead(303, { 'Location': redirectUrl });
    authContext.response.end('');
    if( callback ) callback();
  };
}

module.exports.defaultFirstLoginHandler= function( authContext, executionResult, callback ) {
  if( callback ) callback( null, true );
}