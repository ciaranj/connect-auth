/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
module.exports= function(options) {
  var that= {}
  options= options || {};
  that.name= options.name || "never";
  that.authenticate= function(request, response, callback) {
    this.fail(callback);
  }  
  return that;
};
