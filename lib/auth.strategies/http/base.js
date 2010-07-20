/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
Base= module.exports= function () {
  var that= {};
  that._badRequest= function(req, res, callback) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    this.halt(callback);
  };
  that._unAuthenticated= function(req, res, callback) {
    res.writeHead(401, { 'Content-Type': 'text/plain',
                         'WWW-Authenticate': this.getAuthenticateResponseHeader() });
    res.end("Authorization Required");
    this.halt(callback);
  };
  return that;
};
