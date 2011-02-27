/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
AuthExecutionScope= module.exports = function() {
  this.executionResult= { authenticated: false };
}
AuthExecutionScope.prototype.fail= function(callback) { callback(); }                                   
AuthExecutionScope.prototype.success= function(user, callback) {
  this.executionResult.user= user;
  this.halt(callback);
};
AuthExecutionScope.prototype.halt= function(callback) {
  this.executionResult.halted= true;
  this.pass(callback);
};
AuthExecutionScope.prototype.pass= function (callback) {
  callback();
};
AuthExecutionScope.prototype.redirect= function(response, url, callback) {
  response.writeHead(303, { 'Location': url });
  response.end('');
  this.halt(callback);
};
