var md5= require('support/ext/lib/ext/md5'),
    utils = require('express/utils');

BaseHttpStrategy= require('./base').BaseHttpStrategy;
var DigestStrategy= require('./digest').DigestStrategy;
var BasicStrategy= require('./basic').BasicStrategy;

var sys= require('sys');    

exports.HttpStrategy= BaseHttpStrategy.extend({

   constructor: function(options){
     var options= options || {}
     BaseHttpStrategy.prototype.constructor.call(this, options)

     if( options.basicStrategy ) {
       this.basicStrategy= options.basicStrategy;
     } 
     else if( options.useBasic ) {
       this.basicStrategy= new BasicStrategy(options);
     }
     
     if( options.digestStrategy ) {
       this.digestStrategy= options.digestStrategy;
     } 
     else if( options.useDigest ) {
       this.digestStrategy= new DigestStrategy(options);
     }
     if( this.basicStrategy ) this.basicStrategy.embedded= true;
     if( this.digestStrategy ) this.digestStrategy.embedded= true;
   },
   
   authenticate: function(request, callback) {
     var authHeader= request.header('Authorization');
     var self= this;
     var failureAwareFunction= function(error, user) {
       if( error ) callback(error);
       else {
         if( user ) callback(null, user);
         else {
           self._unAuthenticated(request, callback);
         }
       }
     };
     if( authHeader ) {
       if( authHeader.match(/^[Bb]asic.*/)  && this.basicStrategy ) {
         this.basicStrategy.authenticate(request, failureAwareFunction);
       }
       else if( authHeader.match(/^[Dd]igest.*/) && this.digestStrategy ) {
         this.digestStrategy.authenticate(request, failureAwareFunction);
       }
       else {
         this._badRequest( request, callback );
       }
     }  
     else  {
       this._unAuthenticated( request, callback );
     }
   },

   isValid: function() {
     return ( this.digestStrategy !== undefined || this.basicStrategy !== undefined )
   },

    getAuthenticateResponseHeader: function() {
      var challenges= "";
      if( this.digestStrategy ) challenges+= this.digestStrategy.getAuthenticateResponseHeader();
      if( this.digestStrategy && this.basicStrategy ) challenges+= ", ";
      if( this.basicStrategy ) challenges+= this.basicStrategy.getAuthenticateResponseHeader();
      return challenges;
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