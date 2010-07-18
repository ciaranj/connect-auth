/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
module.exports= function(strategies, server) {
  this.server = server
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
    var strategy= strategyDefinition.create(this.server);
    if( strategy.authenticate === undefined ) {
      throw new Error( "Strategy '"+ stratIndex +"' does not define an authenticate method, this is required for all strategies.")
    }
    this.strategyDefinitions[stratIndex]= strategyDefinition;
  }
};

module.exports.prototype.get= function(label) { 
  var result= this.strategyDefinitions[label];
  if( result === undefined ) throw new Error("NoSuchStrategy", "Strategy '" + label+ "' has not be declared.")
  return result.create(this.server);
}

module.exports.prototype.clear= function() {
  this.strategyDefinitions= {};
};