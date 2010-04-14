exports.Never= AuthStrategy.extend({
   constructor: function(options){
     AuthStrategy.prototype.constructor.call(this, options)
   },
   
   authenticate: function(request, callback) {
     this.fail(callback);
   }
});