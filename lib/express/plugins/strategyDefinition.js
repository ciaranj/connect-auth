exports.StrategyDefinition= Class({
  
  constructor: function( class, options ){
    this._strategyClass=  class;
    this._options= options || {};
  },
  
  create: function() {
    return new this._strategyClass(this._options);
  }  
});