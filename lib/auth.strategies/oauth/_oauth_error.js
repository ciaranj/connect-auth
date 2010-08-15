/*!
 * Copyright(c) 2010 Christian Amor Kvalheim <christkv@gmail.com>
 * 
 * MIT Licensed
 */
exports.OAuthBadRequestError = function(msg) {
  this.statusCode = 400;
  this.message = msg;      
}

exports.OAuthUnauthorizedError = function(msg) {
  this.statusCode = 401;
  this.message = msg;
}

exports.OAuthProviderError = function(msg) {
  this.statusCode = 400;
  this.message = msg;      
}