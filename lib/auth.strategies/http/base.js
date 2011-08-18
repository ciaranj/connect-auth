/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
module.exports= function (options) {
  var that = {};
  var my = {};
  my._isAutoRespond = (options.isAutoRespond == null ? true : options.isAutoRespond);

  that._badRequest = function (executionScope, req, res, callback, attributes) {
    var authHeader = this.getAuthenticateResponseHeader(executionScope, attributes);
    if (my._isAutoRespond) {
      res.writeHead(400, { 'Content-Type': 'text/plain',
                           'WWW-Authenticate': authHeader });
      res.end('Bad Request');
    }
    executionScope.executionResult.errorResponse = { code: 400, header: authHeader, attributes: attributes };
    executionScope.halt(callback);
  };
  that._unAuthenticated= function(executionScope, req, res, callback, attributes) {  
    var authHeader = this.getAuthenticateResponseHeader(executionScope, attributes);
    if (my._isAutoRespond) {
        res.writeHead(401, { 'Content-Type': 'text/plain',
                             'WWW-Authenticate': authHeader
        });
        res.end('Authorization Required');
    }
    executionScope.executionResult.errorResponse = { code: 401, header: authHeader, attributes: attributes };
    executionScope.halt(callback);
  };
  return that;
};
