exports.Strategies= Class({
   constructor: function(options){
     var options= options || {}
     this.clear();
     this.add( options );
   },

   add: function(labelOrStrategyLiteral, strategy_definition) {
     if( labelOrStrategyLiteral && strategy_definition ) {
       var def= {};
       def[labelOrStrategyLiteral]= strategy_definition;
       this._add(def)
     }
     else {
       this._add(labelOrStrategyLiteral); // Allow addition of complete literals.
     }
   },
   
   _add: function(strategy_definitions) {
     for(var stratIndex in strategy_definitions) {
       var strategyDefinition= strategy_definitions[stratIndex];
       var strategy= strategyDefinition.create();
       if( strategy.authenticate === undefined ) {
         Error.raise("NoAuthenticateMethod", "Strategy '"+ stratIndex +"' does not define an authenticate method, this is required for all strategies.")
       }
       this.strategyDefinitions[stratIndex]= strategyDefinition;
     }
   },

   get: function(label) {
     var result= this.strategyDefinitions[label];
     if( result === undefined ) Error.raise("NoSuchStrategy", "Strategy '" + label+ "' has not be declared.")
     return result.create();
   },
   
   clear: function() {
     this.strategyDefinitions= {};
   }
});