/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
module.exports= function(options) {
  options= options || {};
  var that= {};
  var my= {}; 
 
  my.anonUser = options.anonymousUser || {username: "anonymous"}
  that.name     = options.name || "anon";
  
  that.authenticate= function(request, response, callback) {
    this.success( my.anonUser, callback );
  }

  return that;
};