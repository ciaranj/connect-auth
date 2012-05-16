connect-auth
============

Useful authentication strategies based on [warden]. Available as a [npm] package.

Provides out of the box authentication strategies for:

* HTTP Basic - sole or negotiated
* HTTP Digest - sole or negotiated
* Anonymous
* Never
* Facebook connect (OAuth 2)
* Github (OAuth 2)
* Yahoo (OAuth 1.0A)
* Twitter (OAuth 1.0)
* RPXNow / janrain SSO 
* BitBucket ( thanks to http://github.com/fjakobs )
* Foursquare (thanks to http://github.com/stunti)
* Custom OAuth Provider Strategy (2-Legged & 3-Legged)(Be your own 1.0A OAuth provider!) (A Port of Christian Amor Kvalheim's  [express-oauth-plugin])  
* Sina  (Danny Siu)
* Google (Oauth 1 & OAuth 2 clients)
* Yammer (Stephen Belanger)
* Linkedin (Stephen Belanger)

Take Care!

-cj.


Testing
=======

    % make

Running with npm
=================

    % npm install connect-auth
	% cp examples/example_keys_file.js examples/keys_file.js

Edit keys_file.js

Run

    % node examples/app.js
    % open http://localhost


[warden]: http://github.com/hassox/warden
[npm]: http://github.com/isaacs/npm    
[express-oauth-plugin]: http://github.com/christkv/node-express-oauth-plugin


Changelog
=========
* 0.5.2  
		Allow multiple users per application in Oauth Provider (3 legged) (Evan Prodromou)
		Improved the behaviour of the OAuth Provider's Form/POST signing behaviours ( Evan Prodromou )
		Fix broken 3-legged OAuth provider support ( Jason Chu )
 * 0.5.1  
		Change Google OAuth2 strategy to only request (and retrieve) the authenticating user's profile information (and optionally their e-mail address.)
 * 0.5.0  
		Update to support connect 2.0.0  
		New 2-legged OAuth provider support ( Jason Chu )  
		Yammer Support added (Stephen Belanger)  
		Linkedin Support added (Stephen Belanger)  
		Support for configuring Facebook's OAuth dialog mode ( Barada Sahu )  
		Stopped some global scope pollution ( Fabian Jakobs )  
 * 0.4.1  
		Provide support to allow the authentication scope to 'survive' authentication redirects e.g. twitter, facebook etc. Allowing for scope usage with these strategies.  
 * 0.4.0  
		Introduce new tracing capabilities (provide an option of trace:true/function when constructing the auth middleware)  
		Introduce 2 new 'events/callbacks' : firstLoginHandler and logoutHandler to allow fairly standard authentication strategies.  
		Restructured the code to help with others reading it :)  
		Although I'm bumping the version number this release is still backwards compatible with 0.3.x, it just introduces significant new functionality.  
 * 0.3.2  
		Fixed Google OAuth Strategy  
		Provided *new* Google OAuth2 Strategy  
 * 0.3.1  
		Fixing package.json (no real changes)  
 * 0.3.0  
		Modified 'request.Authenticate(...)' to pass back 'undefined' when an active authentication strategy has required a communication with the browser to fully complete the authentication process.  - *Possible Breaking change*  
		Fixed various failure cases for nearly all strategies (utilising the new 'undefined' authentication type)  
		Migrated Foursquare strategy to OAuth2 (requires at least v0.9.3 of node-oauth)  
		New getglue strategy
		logout now takes an (optional) callback [this should be the default that is used.] 
 * 0.2.3  
    Added support for BitBucket (Thanks http://github.com/fjakobs)  
    Fixed bug introduced in 0.2.2 when dealing with strategies that 'fail'  
 * 0.2.2  
    Added index.js ( Pau Ramon Revilla ) to root folder for easier inclusion  
    Added support for SSO with http://t.sina.com.cn/ ( Danny Siu )  
    Added hd query parameter to allow Google Hosted Domain for google sSO strategy ( Olmo Maldonado )  
		Adds prelimenary support for the new HTTP MAC authentication scheme as defined by RFC-to-be:
		http://tools.ietf.org/html/draft-hammer-oauth-v2-mac-token ( Eran Hammer-Lahav )  
		Added support for SSO with google (not using OpenId, but OAuth, so an intermediary approach) (Masahiro Hayashi)  
		Twitter strategy now supports OAuth Callback Urls (Ben Marvell)  
		Added option 'isAutoRespond' to handle authentication errors by the application with the HTTP Schemes. (Eran Hammer-Lahav)  
		Support for 'scoped' users (aka multiple con-current authentications) (Logan Aube)  
 * 0.2.1  
		Removed dead file that was seemingly breaking nDistro  
 * 0.2.0  
		Updated HTTP strategies c/o Robbie Clutton no longer require passwords to be stored in the plain. - *Breaking change*  
		Changed the default javascript file from auth.js to index.js. - *Breaking change*  
		Fixed the isAuthenticated mechanism to work with mongodb (Lakin Wecker, Richard Walsh)  
		Realm parameter now ignored in the Authorization header for the OAuth Provider strategy (Wade Simmons)  
 * 0.1.3  
		Strategies can now be written that do not require the session middleware.  
 * 0.1.2  
		Added in new strategy that allows your authentication strategy to be a custom OAuth provider.  
 * 0.1.0  
		New simplified configuration (connect idiomatic) of strategies implemented.
