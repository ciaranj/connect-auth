/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * Copyright(c) 2012 Christoph Jerolimov <c.jerolimov@tarent.de>
 * MIT Licensed
 */
var OAuth= require('oauth').OAuth2,
	querystring= require('querystring'),
	url= require('url'),
	http= require('http');

module.exports= function(options, server) {
	options = options || {}
	var that = {};
	var my = {};

	// Construct the internal OAuth client
	my._oAuth= new OAuth(options.appId, options.appSecret, "https://graph.facebook.com");

	// Hack to remove the code parameter on all requests which breaks this type of request!!
	my._original_request = my._oAuth._request;
	my._oAuth._request = function(method, url, headers, post_body, access_token, callback) {
		var post = querystring.parse(post_body);
		delete post['type'];
		delete post['code'];
		post_body = querystring.stringify(post);
		my._original_request.call(this, method, url, headers, post_body, access_token, callback);
	}

	// Give the strategy a name
	that.name = options.name || "facebook-token";

	// Declare the method that actually does the authentication
	that.authenticate= function(request, response, callback) {
		var self = this;
		var access_token = request.query.access_token;
		if (!access_token) {
			//self.fail(callback);
			callback({'error': 'missing access_token'});
			return;
		}

		//todo: makw the call timeout ....
		my._oAuth.get('https://graph.facebook.com/me', access_token, function(error, data, response) {
			if (error) {
				//self.fail(callback);
				callback(error);
			} else {
				self.success(JSON.parse(data), callback)
			}
		});
	}
	return that;
};
