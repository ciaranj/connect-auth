exports.BaseHttpStrategy= AuthStrategy.extend({

   constructor: function(options){
     var options= options || {}
     AuthStrategy.prototype.constructor.call(this, options)
   },

    _badRequest: function ( request, callback ) {
      request.halt(400, 'Bad Request');
      callback(null, false);
    },

   _unAuthenticated: function( request, callback ) {     
     request.header('WWW-Authenticate', this.getAuthenticateResponseHeader());
     request.halt(401, "Authorization Required");
     callback(null, null);
   },
   
});