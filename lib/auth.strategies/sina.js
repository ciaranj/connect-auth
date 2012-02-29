/*!
 * Copyright(c) 2010 Danny Siu <danny.siu@gmail.com>
 */
var OAuth = require("oauth").OAuth,
    url = require("url"),
    connect = require("connect"),
    util = require("util"),
    http = require('http');

module.exports = function(options, server) {
  options = options || {};
  var that = {};
  var my = {};

  // Construct the internal OAuth client
  my._oAuth = new OAuth("http://api.t.sina.com.cn/oauth/request_token",
                        "http://api.t.sina.com.cn/oauth/access_token",
                        options.consumerKey, options.consumerSecret,
                        "1.0", options.callback, "HMAC-SHA1");

  // Give the strategy a name
  that.name = options.name || "sina";

  // Build the authentication routes required
  that.setupRoutes = function(server) {
    server.use('/', connect.router(function routes(app) {
      app.get('/auth/sina_callback', function(req, res) {
        req.authenticate([that.name], function(error, authenticated) {
          res.writeHead(303, { 'Location': req.session.sina_redirect_url });
          res.end('');
        });
      });
    }));
  };


  // Declare the method that actually does the authentication
  that.authenticate = function(request, response, callback) {
    //todo: if multiple connect middlewares were doing this, it would be more efficient to do it in the stack??

    var parsedUrl = url.parse(request.originalUrl, true);

    //todo: makw the call timeout ....
    var self = this;
    if (parsedUrl.query &&
        parsedUrl.query.oauth_token &&
        parsedUrl.query.oauth_verifier &&
        request.session.auth["sina_oauth_token_secret"] &&
        parsedUrl.query.oauth_token == request.session.auth["sina_oauth_token"]) {

      my._oAuth.getOAuthAccessToken(parsedUrl.query.oauth_token,
                                    request.session.auth["sina_oauth_token_secret"],
                                    parsedUrl.query.oauth_verifier,
                                    function(error, oauth_token, oauth_token_secret, additionalParameters) {
                                      if (error) {
                                        callback(null);
                                      }
                                      else {
                                        request.session.auth["sina_oauth_token_secret"] = oauth_token_secret;
                                        request.session.auth["sina_oauth_token"] = oauth_token;
                                        self.success(additionalParameters, callback);
                                      }
                                    })
    }
    else {
      my._oAuth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
        if (error) {
          callback(null); // Ignore the error upstream, treat as validation failure.
        } else {
          request.session['sina_redirect_url'] = request.originalUrl;
          request.session.auth["sina_oauth_token_secret"] = oauth_token_secret;
          request.session.auth["sina_oauth_token"] = oauth_token;

          self.redirect(response,
                        "http://api.t.sina.com.cn/oauth/authorize?oauth_token=" + oauth_token
                            + "&oauth_callback=" + encodeURIComponent(options.callback),
                        callback);
        }
      });
    }
  };
  return that;
};