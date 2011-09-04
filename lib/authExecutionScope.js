/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
var AuthExecutionScope= module.exports = function( authContext ) {
  this.executionResult= { authenticated: false };
  this.authContext= authContext;
  this._trace= authContext.request.getAuthDetails().trace;
  this._scope= authContext.scope;
}

/**
 * Utility method for providing tracing functionality within an autthenitcation strategy
 * Takes a 'message' to log out
 */
AuthExecutionScope.prototype.trace= function( message ) { 
  var messagePrefix= "";
  if( this.executionResult.currentStrategy ) {
    messagePrefix= this.executionResult.currentStrategy + ": ";
  }
  this._trace( messagePrefix + message, this._scope, "***" )
}

AuthExecutionScope.prototype.fail= function(callback) { 
  this.trace( "Failed", "***" );
  this.executionResult.authenticated= false;
  callback();
}
AuthExecutionScope.prototype.redirect= function(response, url, callback) {
  this.trace( "Redirecting to: "+ url, "***" );
  response.writeHead(303, { 'Location': url });
  response.end('');
  this.executionResult.authenticated= undefined;
  this._halt(callback);
};

AuthExecutionScope.prototype.success= function(user, callback) {
  this.trace( "Succeeded", "***" );
  this.executionResult.user= user;
  this.executionResult.authenticated= true;
  this._halt(callback);
};

AuthExecutionScope.prototype._halt= function(callback) {
  this.executionResult.halted= true;
  // We don't set a value for this.executionResult.authenticated
  // as it has either been set as a result of a call to fail/redirect/success or
  // is using the default value of 'false'
  callback();
};

AuthExecutionScope.prototype.halt= function(callback) {
  this.trace( "Halted", "***" );
  this.executionResult.authenticated= undefined;
  this._halt(callback);
};
AuthExecutionScope.prototype.pass= function (callback) {
  this.trace( "Skipped", "***" );
  callback();
};