exports.Anonymous= AuthStrategy.extend({
   constructor: function(options){
     options= options || {};
     AuthStrategy.prototype.constructor.call(this, options)
     this.anonUser= options.anonymousUser || {username: "anonymous"}
   },
   
   authenticate: function(request, callback) {
     this.success( this.anonUser, callback );
   }
});