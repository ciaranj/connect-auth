/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
AuthExecutionScope= module.exports = function() {
  this.executionResult= { authenticated: false };
}
AuthExecutionScope.prototype.fail= function(callback) { 
  this.executionResult.authenticated= false;
  callback();
}
AuthExecutionScope.prototype.redirect= function(response, url, callback) {
  response.writeHead(303, { 'Location': url });
  response.end('');
  this.executionResult.authenticated= undefined;
  this.halt(callback);
};

AuthExecutionScope.prototype.success= function(user, callback) {
  this.executionResult.user= user;
  this.executionResult.authenticated= true;
  this.halt(callback);
};
AuthExecutionScope.prototype.halt= function(callback) {
  this.executionResult.halted= true;
  // We don't set a value for this.executionResult.authenticated
  // as it has either been set as a result of a call to fail/redirect/success or
  // is using the default value of 'false'
  this.pass(callback);
};
AuthExecutionScope.prototype.pass= function (callback) {
  callback();
};