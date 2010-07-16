/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */
module.exports= function(options) {
  options= options || {};
  this.anonUser= options.anonymousUser || {username: "anonymous"}
};

module.exports.prototype.authenticate= function(request, callback) {
  this.success( this.anonUser, callback );
}
