exports.StrategyExecutor= Class({
   constructor: function(options){
     var options= options || {}
     this.strategies= options.strategies 
   },

   authenticate: function(strategies, scope, request, callback) {
     var executionResult= { authenticated: false };
     if( !this.strategies || this.strategies.length ==0 ) callback( null, executionResult );
     else {
       var strategiesToTest= [];
       var carryOn= false;
       try{
         for(var i =0 ;i < strategies.length; i++ ) {
           strategiesToTest[i]= this.strategies.get(strategies[i]);
           strategiesToTest[i].executionResult= executionResult;
         }
         carryOn= true;
       }
       catch(e) {
         callback(e);
       }
       
       if( carryOn ) {
         if( strategiesToTest.length  == 0 ) callback( null, executionResult );
         else {
           var total= strategiesToTest.length;
           var complete= 0;
           var strategy;
      
          //todo: error handling urghhh
          //todo: scope!        
          ;(function next(e) {
             if (executionResult.halted || e || complete === total)
               callback(e, executionResult)
             else {
               strategy= strategiesToTest[complete++];
               if( strategy.isValid() ) {
                 strategy.authenticate(request, next);
               } 
               else {
                 next();
               }
             }
           })()
         }
       }
     }
   }
});