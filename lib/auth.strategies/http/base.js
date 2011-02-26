/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
Base= module.exports= function (options) {
  var that = {};
  var my = {};
  my._isAutoRespond = options.isAutoRespond || true;

  that._badRequest = function (executionScope, req, res, callback, attributes) {
    var authHeader = this.getAuthenticateResponseHeader(executionScope, attributes);
    if (my._isAutoRespond) {
      res.writeHead(400, { 'Content-Type': 'text/plain',
                           'WWW-Authenticate': authHeader });
      res.end('Bad Request');
      executionScope.halt(callback);
    }
    else {
      executionScope.halt(callback, { code: 400, header: authHeader, attributes: attributes });
    }
  };
  that._unAuthenticated= function(executionScope, req, res, callback, attributes) {  
    var authHeader = this.getAuthenticateResponseHeader(executionScope, attributes);
    if (my._isAutoRespond) {
        res.writeHead(401, { 'Content-Type': 'text/plain',
                             'WWW-Authenticate': authHeader
        });
        res.end('Authorization Required');
        executionScope.halt(callback);
    }
    else {
        executionScope.halt(callback, { code: 401, header: authHeader, attributes: attributes });
    }
  };
  return that;
};
