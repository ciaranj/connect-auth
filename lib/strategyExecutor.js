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

module.exports.prototype.authenticate= function(strategies, scope, trace, request, response, callback) {
  var executionScope= new AuthExecutionScope( scope, trace, request, response );
  if( !this.strategies || this.strategies.length ==0 ) {
    trace( "Unable to find a strategy to authenticate with", request, response, scope, "###");
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
      trace( "Error choosing strategy: "+ e, request, response, scope, "###");
      callback(e);
    }
    if( carryOn ) {
      if( strategiesToTest.length  == 0 ) {
        trace( "Tested all strategies :" + util.inspect(executionScope.executionResult), request, response, scope, "###");
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
            trace( "Tested all strategies", request, response, scope, "###");
            callback(e, executionScope.executionResult)
          }
          else {
            strategy= strategiesToTest[complete++];
            if( strategy.isValid === undefined || strategy.isValid() ) {  
              trace( "Attempting authentication with: " + strategy.name, request, response, scope, "###" );
              executionScope.executionResult.currentStrategy= strategy.name;
              strategy.authenticate.call(executionScope, request, response, next);
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