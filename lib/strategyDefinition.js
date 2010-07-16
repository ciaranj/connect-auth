/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
 
var NONCE_CHARS= ['a','b','c','d','e','f','g','h','i','j','k','l','m','n',
               'o','p','q','r','s','t','u','v','w','x','y','z','A','B',
               'C','D','E','F','G','H','I','J','K','L','M','N','O','P',
               'Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3',
               '4','5','6','7','8','9'];
               
module.exports= function(class, options) {
  this._strategyClass=  class;
  this._options= options || {};
};

module.exports.prototype.create= function() {
  // tODO: uggghhh I gotta re-factor this badly, now we're not in express
  // I can solve this a lot more elegantly ;) 
  var strategy= new this._strategyClass(this._options);
  strategy.isValid= function() {return true};
  strategy.fail= function(callback) { callback(); }                                   
  strategy.success= function(user, callback) {
    this.executionResult.user= user;
    this.halt(callback);
  };
  strategy.halt= function(callback) {
    this.executionResult.halted= true;
    this.pass(callback);
  };
  strategy.pass= function(callback) {
    callback();
  };

  strategy._getNonce= function(nonceSize) {
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
  
  return strategy;
}