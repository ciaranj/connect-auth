var sys= require('sys');
exports.AuthStrategy= Class({
  constructor: function(options){
   var options= options || {}
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
  }
});