var md5= require('support/ext/lib/ext/md5'),
    utils = require('express/utils');

BaseHttpStrategy= require('./base').BaseHttpStrategy;
var DigestStrategy= require('./digest').Digest;
var BasicStrategy= require('./basic').Basic;

var sys= require('sys');    
exports.Http= BaseHttpStrategy.extend({

   constructor: function(options){
     var options= options || {}
     BaseHttpStrategy.prototype.constructor.call(this, options)
     if( options.basicStrategy ) {
       this.basicStrategy= options.basicStrategy;
     } 
     else if( options.useBasic !== false ) {
       this.basicStrategy= new BasicStrategy(options);
     }
     
     if( options.digestStrategy ) {
       this.digestStrategy= options.digestStrategy;
     } 
     else if( options.useDigest !== false ) {
       this.digestStrategy= new DigestStrategy(options);
     }
     if( this.basicStrategy ) this.basicStrategy.embedded= true;
     if( this.digestStrategy ) this.digestStrategy.embedded= true;
   },
   
   authenticate: function(request, callback) {
     require('sys').puts('http-authenticate')
     var authHeader= request.header('Authorization');
     var self= this;
     if( authHeader ) {
       if( authHeader.match(/^[Bb]asic.*/)  && this.basicStrategy ) {
         this.basicStrategy.executionResult= this.executionResult; // Horribly flawed as we're sharing strategy instances atm.
         
         this.basicStrategy.authenticate(request, callback);
       }
       else if( authHeader.match(/^[Dd]igest.*/) && this.digestStrategy ) {
         this.digestStrategy.executionResult= this.executionResult; // Horribly flawed as we're sharing strategy instances atm.
         
         this.digestStrategy.authenticate(request, callback);
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
      request.respond(400, 'Bad Request');
      this.halt(callback)
    },

   _unAuthenticated: function( request, callback ) { 
     request.header('WWW-Authenticate', this.getAuthenticateResponseHeader());
     request.respond(401, "Authorization Required");
     this.halt(callback)
   },
   
});