/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
module.exports= function(strategies) {
  this.clear();
  this._add(strategies);
};

module.exports.prototype.add= function(labelOrStrategyLiteral, strategy_definition) {
  if( labelOrStrategyLiteral && strategy_definition ) {
    var def= {};
    def[labelOrStrategyLiteral]= strategy_definition;
    this._add(def)
  }
  else {
    this._add(labelOrStrategyLiteral); // Allow addition of complete literals.
  }
};

//todo: Hmm I can now re-work this method so it remains hidden, good-o :)
module.exports.prototype._add= function(strategy_definitions) {
  for(var stratIndex in strategy_definitions) {
    var strategyDefinition= strategy_definitions[stratIndex];
    var strategy= strategyDefinition.create();
    if( strategy.authenticate === undefined ) {
      Error.raise("NoAuthenticateMethod", "Strategy '"+ stratIndex +"' does not define an authenticate method, this is required for all strategies.")
    }
    this.strategyDefinitions[stratIndex]= strategyDefinition;
  }
};

module.exports.prototype.get= function(label) { 
  console.log(label)
  var result= this.strategyDefinitions[label];
  if( result === undefined ) Error.raise("NoSuchStrategy", "Strategy '" + label+ "' has not be declared.")
  return result.create();
}

module.exports.prototype.clear= function() {
  this.strategyDefinitions= {};
};