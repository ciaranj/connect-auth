/*!
* Skyrock.com auth strategie
* see http://www.skyrock.com/developer/
* MIT Licensed
*/
var OAuth= require("oauth").OAuth,
	url = require("url"),
	http = require('http');

Skyrock = module.exports= function(options, server) {
	options= options || {}
	var that= {};
	var my= {};

	// Construct the internal OAuth client
	my._oAuth = new OAuth(
		"https://api.skyrock.com/v2/oauth/initiate"
		, "https://api.skyrock.com/v2/oauth/token"
		, options.consumerKey
		, options.consumerSecret
		, "1.0"
		, options.callback || null
		, "HMAC-SHA1"
	);

	// Give the strategy a name
	that.name  = options.name || "skyrock";

	// Build the authentication routes required
	that.setupRoutes= function(app) {
		app.use('/auth/skyrock_callback', function(req, res){
			req.authenticate([that.name], function(error, authenticated) {
				res.writeHead(303, { 'Location': req.session.skyrock_redirect_url });
				res.end('');
			});
		});
	}

	// Declare the method that actually does the authentication
	that.authenticate= function(request, response, callback) {
		//todo: if multiple connect middlewares were doing this, it would be more efficient to do it in the stack??
		var parsedUrl= url.parse(request.originalUrl, true);

		//todo: makw the call timeout ....
		var self= this;
		if( request.getAuthDetails()['skyrock_login_attempt_failed'] === true ) {
			// Because we bounce through authentication calls across multiple requests
			// we use this to keep track of the fact we *Really* have failed to authenticate
			// so that we don't keep re-trying to authenticate forever.
			delete request.getAuthDetails()['skyrock_login_attempt_failed'];
			self.fail( callback );
		} else {
			if( parsedUrl.query && parsedUrl.query.denied ) {
				self.trace( 'User denied OAuth Access' );
				request.getAuthDetails()['skyrock_login_attempt_failed'] = true;
				self.fail(callback);
			} else if( parsedUrl.query && parsedUrl.query.oauth_token && request.session.auth["skyrock_oauth_token_secret"] ) {
				self.trace( 'Phase 2/2 : Requesting an OAuth access token.' );
				my._oAuth.getOAuthAccessToken(parsedUrl.query.oauth_token, request.session.auth["skyrock_oauth_token_secret"], parsedUrl.query.oauth_verifier,
							function( error, oauth_token, oauth_token_secret, additionalParameters ) {
								if( error ) {
									self.trace( 'Error retrieving the OAuth Access Token: ' + JSON.stringify(error) );
									request.getAuthDetails()['skyrock_login_attempt_failed'] = true;
									self.fail(callback);
								} else {
									self.trace( 'Successfully retrieved the OAuth Access Token' );
									request.session.auth["skyrock_oauth_token_secret"]= oauth_token_secret;
									request.session.auth["skyrock_oauth_token"]= oauth_token;

									// Get user profile data.
									my._oAuth.getProtectedResource("https://api.skyrock.com/v2/user/get.json", 'get', oauth_token, oauth_token_secret, function (error, data, response) {
										if (error) {
											self.fail(callback);
										} else {
											var result = JSON.parse(data);
											var user = {
												username: result.username
												, firstname: result.firstname
												, name: result.name
												, user_url: result.user_url
											};
											self.executionResult.user = user;
											self.success(user, callback);
										}
									})
								}
							});
			} else {
				self.trace( 'Phase 1/2 - Requesting an OAuth Request Token' )
				my._oAuth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, oauth_authorize_url, additionalParameters ) {
					if(error) {
						self.trace( 'Error retrieving the OAuth Request Token: ' + JSON.stringify(error) );
						callback(null); // Ignore the error upstream, treat as validation failure.
					} else {
						self.trace( 'Successfully retrieved the OAuth Request Token' );
						request.session['skyrock_redirect_url']= request.originalUrl;
						request.session.auth["skyrock_oauth_token_secret"]= oauth_token_secret;
						request.session.auth["skyrock_oauth_token"]= oauth_token;
						self.redirect(response, "https://api.skyrock.com/v2/oauth/authenticate?oauth_token=" + oauth_token, callback);
					}
				});
			}
		}
	}
	return that;
};
