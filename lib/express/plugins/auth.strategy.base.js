var sys= require('sys');
exports.AuthStrategy= Class({
  constructor: function(options){
  },
/*
  authenticate: function(request, callback) {
  },
*/
  isValid: function() {return true},

  fail: function(callback) {
    callback();
  },

  success: function(user, callback) {
    this.executionResult.user= user;
    this.halt(callback);
  },
  
  halt: function(callback) {
    this.executionResult.halted= true;
    this.pass(callback);
  },
  
  pass: function(callback) {
    callback();
  },
  
  NONCE_CHARS: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n',
                'o','p','q','r','s','t','u','v','w','x','y','z','A','B',
                'C','D','E','F','G','H','I','J','K','L','M','N','O','P',
                'Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3',
                '4','5','6','7','8','9'],
  
  _getNonce: function(nonceSize) {
     var result = [];
     var chars= this.NONCE_CHARS;
     var char_pos;
     var nonce_chars_length= chars.length;
     
     for (var i = 0; i < nonceSize; i++) {
         char_pos= Math.floor(Math.random() * nonce_chars_length);
         result[i]=  chars[char_pos];
     }
     return result.join('');
   }
});