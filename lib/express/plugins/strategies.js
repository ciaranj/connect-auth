exports.Strategies= Class({
   constructor: function(options){
     var options= options || {}
     var strategy_definitions;
     if( options.strategy && !options.strategies) {
        strategy_definitions= [options.strategy];
     }
     else if( options.strategies ) {
       strategy_definitions= options.strategies;
     }
     
     this.clear();
     
     if( strategy_definitions ) {
       this.add( strategy_definitions );
     }
   },

   add: function(label, strategy) {
     if( label && strategy ) {
       var def= {};
       def[label]= strategy;
       this._add([def])
     }
     else {
       this._add(label); // Allow addition of complete arrays.
     }
   },
   
   _add: function(strategy_definitions) {
     for(var stratIndex in strategy_definitions) {
       for( var strategyKey in strategy_definitions[stratIndex] ) {
         var strategy= strategy_definitions[stratIndex][strategyKey];
         if( strategy.authenticate === undefined ) {
           Error.raise("NoAuthenticateMethod", "Strategy '"+ strategyKey +"' does not define an authenticate method, this is required for all strategies.")
         }
         this.strategies[strategyKey]= strategy;
       }
     }
   },

   get: function(label) {
     return this.strategies[label];
   },
   
   clear: function() {
     this.strategies= {};
   }
});