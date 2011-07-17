/*!
 * Copyright(c) 2011 Stephen Belanger <admin@stephenbelanger.com>
 * 
 * MIT Licensed
 */
var openid = require("openid"),
	url = require("url"),
	connect = require("connect"),
	http = require('http'),
	querystring = require('querystring');

module.exports = function(options, server) {
	options = options || {}
	var that = {};
	var my = {};
	
	// Generate OpenID relying party.
	my._relyingParty = new openid.RelyingParty(options.callback, null, false, false, []);

	// Give the strategy a name
	that.name = options.name || "openid";

	// Declare the method that actually does the authentication.
	that.authenticate = function(request, response, callback) {
		// Collect query info...
		var parsedUrl = url.parse(request.url, true);
		
		// Get self reference.
		var self = this;
		
		// Our identifier is in the query string, so we haven't authenticated yet.
		if (parsedUrl.query.openid_identifier) {
			request.session.openid_identifier = parsedUrl.query.openid_identifier;
			// Resolve identifier, associate, and build authentication URL
			my._relyingParty.authenticate(parsedUrl.query.openid_identifier, false, function(authUrl) {
				if ( ! authUrl) {
					callback(null);
				} else {
					self.redirect(response, authUrl, callback);
				}
			});
		} else {
			my._relyingParty.verifyAssertion(request, function(result) {
				if ( ! result.authenticated) {
					callback(null);
				} else {
					var user = {
						identifier: result.claimedIdentifier
					};
					self.executionResult.user = user; 
					self.success(user, callback);
				}
			});
		}
	}	
	return that;
};