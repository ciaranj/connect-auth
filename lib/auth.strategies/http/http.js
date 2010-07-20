/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */

var Base= require("./base");
var Digest= require('./digest');
var Basic= require('./basic'); 
var StrategyDefinition= require('../../strategyDefinition')

Http= module.exports= function (options) {
  options= options || {}
  var that= Base(options);
  var my= {};

  if( options.basicStrategy ) {
    my.basicStrategy= options.basicStrategy;
  } 
  else if( options.useBasic !== false ) {
    my.basicStrategy= new StrategyDefinition(Basic, options).create();
  }
  
  if( options.digestStrategy ) {
    my.digestStrategy= options.digestStrategy;
  } 
  else if( options.useDigest !== false ) {
    my.digestStrategy= new StrategyDefinition(Digest, options).create();
  }
  if( my.basicStrategy ) my.basicStrategy.embedded= true;
  if( my.digestStrategy ) my.digestStrategy.embedded= true;  

  that.isValid = function() {
    return ( my.digestStrategy !== undefined || my.basicStrategy !== undefined )
  };

  that.getAuthenticateResponseHeader = function() {
     var challenges= "";
     if( my.digestStrategy ) challenges+= my.digestStrategy.getAuthenticateResponseHeader();
     if( my.digestStrategy && my.basicStrategy ) challenges+= ", ";
     if( my.basicStrategy ) challenges+= my.basicStrategy.getAuthenticateResponseHeader();
     return challenges;
   }
   
   that.authenticate= function(req, res, callback) {
      var authHeader=  req.headers.authorization;
      
      if( authHeader ) {
        if( authHeader.match(/^[Bb]asic.*/)  && my.basicStrategy ) {
          my.basicStrategy.executionResult= this.executionResult; // Horribly flawed as we're sharing strategy instances atm.

          my.basicStrategy.authenticate(req, res, callback);
        }
        else if( authHeader.match(/^[Dd]igest.*/) && my.digestStrategy ) {
          my.digestStrategy.executionResult= this.executionResult; // Horribly flawed as we're sharing strategy instances atm.

          my.digestStrategy.authenticate(req, res, callback);
        }
        else {  
          this._badRequest( req, res, callback );
        }
      }  
      else  {
        this._unAuthenticated( req, res, callback );
      }
  }
  
  return that;
};