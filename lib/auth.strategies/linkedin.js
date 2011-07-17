/*!
 * Copyright(c) 2010 Stephen Belanger <admin@stephenbelanger.com>
 * MIT Licensed
 */
var OAuth = require("oauth").OAuth,
	url = require("url"),
	connect = require("connect"),
	http = require('http');

Linkedin = module.exports = function(options, server) {
	options = options || {}
	var that = {};
	var my = {};

	// Construct the internal OAuth client
	my._oAuth = new OAuth(
		"https://api.linkedin.com/uas/oauth/requestToken"
		, "https://api.linkedin.com/uas/oauth/accessToken"
		, options.consumerKey
		, options.consumerSecret
		, "1.0"
		, options.callback || null
		, "HMAC-SHA1"
	);

	// Give the strategy a name
	that.name = options.name || "linkedin";
	
	// Build the authentication routes required 
	that.setupRoutes= function(server) {
		server.use('/', connect.router(function routes(app) {
			app.get('/auth/linkedin_callback', function(req, res) {
				req.authenticate([that.name], function(error, authenticated) {
					res.writeHead(303, {
						'Location': req.session.linkedin_redirect_url
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
		if (parsedUrl.query && parsedUrl.query.oauth_token && parsedUrl.query.oauth_verifier && request.session.auth["linkedin_oauth_token_secret"]) {
			my._oAuth.getOAuthAccessToken(parsedUrl.query.oauth_token, request.session.auth["linkedin_oauth_token_secret"], parsedUrl.query.oauth_verifier, function(error, token, secret, params) {
					if (error) {
						callback(null);
					} else {
						request.session.auth["linkedin_oauth_token_secret"] = secret;
						request.session.auth["linkedin_oauth_token"] = token;
						
						// Get user profile data.
						my._oAuth.getProtectedResource("https://api.linkedin.com/v1/people/~", 'get', token, secret, {'x-li-format':'json'}, function (error, data, response) {
							if (error) {
								self.fail(callback);
							} else {
								var result = JSON.parse(data);
								var user = {
									first_name: result.firstName
									, last_name: result.lastName
									, url: result.siteStandardProfileRequest.url
									, headline: result.headline
								};
								self.executionResult.user = user; 
								self.success(user, callback);
							}
						})
					}
			});
		} else {
			my._oAuth.getOAuthRequestToken(function(error, token, secret, auth_url, params) {
				if (error) {
					callback(null); // Ignore the error upstream, treat as validation failure.
				} else {
					request.session['linkedin_redirect_url'] = request.url;
					request.session.auth["linkedin_oauth_token_secret"] = secret;
					request.session.auth["linkedin_oauth_token"] = token;
					self.redirect(response, "https://api.linkedin.com/uas/oauth/authorize?oauth_token=" + token, callback);
				}
			});
		}
	}	
	return that;
};

