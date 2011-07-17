/*!
 * Copyright(c) 2010 Stephen Belanger <admin@stephenbelanger.com>
 * MIT Licensed
 */
var OAuth = require("oauth").OAuth,
	url = require("url"),
	connect = require("connect"),
	http = require('http');

yammer = module.exports = function(options, server) {
	options = options || {}
	var that = {};
	var my = {};

	// Construct the internal OAuth client
	my._oAuth = new OAuth(
		"https://www.yammer.com/oauth/request_token"
		, "https://www.yammer.com/oauth/access_token"
		, options.consumerKey
		, options.consumerSecret
		, "1.0"
		, options.callback || null
		, "HMAC-SHA1"
	);

	// Give the strategy a name
	that.name = options.name || "yammer";
	
	// Build the authentication routes required 
	that.setupRoutes= function(server) {
		server.use('/', connect.router(function routes(app) {
			app.get('/auth/yammer_callback', function(req, res) {
				req.authenticate([that.name], function(error, authenticated) {
					res.writeHead(303, {
						'Location': req.session.yammer_redirect_url
					});
					res.end('');
				});
			});
		}));
	}

	// Declare the method that actually does the authentication
	that.authenticate = function(request, response, callback) {
		//todo: if multiple connect middlewares were doing this, it would be more efficient to do it in the stack??
		var parsedUrl = url.parse(request.url, true);

		//todo: makw the call timeout ....
		var self = this;
		if (parsedUrl.query && parsedUrl.query.oauth_token && parsedUrl.query.oauth_verifier && request.session.auth["yammer_oauth_token_secret"]) {
			my._oAuth.getOAuthAccessToken(parsedUrl.query.oauth_token, request.session.auth["yammer_oauth_token_secret"], parsedUrl.query.oauth_verifier, function(error, token, secret, params) {
					if (error) {
						callback(null);
					} else {
						request.session.auth["yammer_oauth_token_secret"] = secret;
						request.session.auth["yammer_oauth_token"] = token;
						
						// Get user profile data.
						my._oAuth.getProtectedResource("https://www.yammer.com/api/v1/groups.json", 'get', token, secret, function (error, data, response) {
							if (error) {
								self.fail(callback);
							} else {
								var result = JSON.parse(data);
								self.executionResult.user = result; 
								self.success(result, callback);
							}
						})
					}
			});
		} else {
			my._oAuth.getOAuthRequestToken(function(error, token, secret, auth_url, params) {
				if (error) {
					callback(null); // Ignore the error upstream, treat as validation failure.
				} else {
					request.session['yammer_redirect_url'] = request.url;
					request.session.auth["yammer_oauth_token_secret"] = secret;
					request.session.auth["yammer_oauth_token"] = token;
					self.redirect(response, "https://www.yammer.com/oauth/authorize?oauth_token=" + token, callback);
				}
			});
		}
	}	
	return that;
};

