/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
var AuthExecutionScope= require('./authExecutionScope');

module.exports= function(strategies) {
  this.strategies= {};
  for(var i=0; i<strategies.length; i++) {
    this.strategies[strategies[i].name] = strategies[i];
  }
};

module.exports.prototype.authenticate= function(strategies, scope, request, response, callback) {
  var executionScope= new AuthExecutionScope();
  if( !this.strategies || this.strategies.length ==0 ) callback( null, executionScope.executionResult );
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
      console.log('Error: ' + e);
      callback(e);
    }
    if( carryOn ) {
      if( strategiesToTest.length  == 0 ) callback( null, executionScope.executionResult );
      else {
        var total= strategiesToTest.length;
        var complete= 0;
        var strategy; 
        
       //todo: error handling urghhh
       //todo: scope!        
       ;(function next(e) {
          if (executionScope.executionResult.halted || e || complete === total)
            callback(e, executionScope.executionResult)
          else {
            strategy= strategiesToTest[complete++];
            if( strategy.isValid === undefined || strategy.isValid() ) {  
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