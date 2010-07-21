/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
var NONCE_CHARS= ['a','b','c','d','e','f','g','h','i','j','k','l','m','n',
               'o','p','q','r','s','t','u','v','w','x','y','z','A','B',
               'C','D','E','F','G','H','I','J','K','L','M','N','O','P',
               'Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3',
               '4','5','6','7','8','9'];
               
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
AuthExecutionScope.prototype.pass= function(callback) {
  callback();
};

AuthExecutionScope.prototype._getNonce= function(nonceSize) {
   var result = [];
   var chars= NONCE_CHARS;
   var char_pos;
   var nonce_chars_length= chars.length;
   
   for (var i = 0; i < nonceSize; i++) {
       char_pos= Math.floor(Math.random() * nonce_chars_length);
       result[i]=  chars[char_pos];
   }
   return result.join('');
 };

