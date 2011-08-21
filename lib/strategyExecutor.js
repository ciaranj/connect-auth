/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
var  AuthExecutionScope= require('./authExecutionScope')
   , util= require('util');

module.exports= function(strategies) {
  this.strategies= {};
  for(var i=0; i<strategies.length; i++) {
    this.strategies[strategies[i].name] = strategies[i];
  }
};

module.exports.prototype.authenticate= function(strategies, authContext, callback) {
  var executionScope= new AuthExecutionScope( authContext );
  if( !this.strategies || this.strategies.length ==0 ) {
    executionScope.trace( "Unable to find a strategy to authenticate with", "###");
    callback( null, executionScope.executionResult );
  }
  else {
    var strategiesToTest= [];
    var carryOn= false;
    try{
      // Find the set of configured strategies (this.strategies) that match those requested for this call to
      // authenticate (strategies)
      for(var i =0 ;i < strategies.length; i++ ) {
        if( this.strategies[ strategies[i] ] ) {
          strategiesToTest[strategiesToTest.length]= this.strategies[ strategies[i] ];
        }
      }
      carryOn= true;
    }
    catch(e) {  
      executionScope.trace( "Error choosing strategy: "+ e.stack, "###");
      callback(e);
    }
    if( carryOn ) {
      if( strategiesToTest.length  == 0 ) {
        executionScope.trace( "Tested all strategies :" + util.inspect(executionScope.executionResult), "###");
        callback( null, executionScope.executionResult );
      }
      else {
        var total= strategiesToTest.length;
        var complete= 0;
        var strategy;

       //todo: error handling urghhh
       //todo: scope!
       ;(function next(e) {
          if (executionScope.executionResult.halted || e || complete === total) {
            executionScope.trace( "Tested all strategies", "###");
            callback(e, executionScope.executionResult)
          }
          else {
            strategy= strategiesToTest[complete++];
            if( strategy.isValid === undefined || strategy.isValid() ) {  
              executionScope.executionResult.currentStrategy= strategy.name;
              executionScope.trace( "Attempting authentication with: " + strategy.name, "###" );
              strategy.authenticate.call(executionScope, authContext.request, authContext.response, next);
            }
            else {
              next();
            }
          }
        })()
      }
    }
  }
};