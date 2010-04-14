var sys= require('sys');
exports.AuthStrategy= Class({
  constructor: function(options){
   var options= options || {}
  },
/*
  authenticate: function(auth, callback) {
  },
*/
  isValid: function() {return true},

  fail: function(callback) {
    sys.p('fail')
    callback();
  },

  success: function(user, callback) {
    sys.p('success')
    callback(null, user )
  }   
});