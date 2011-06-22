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
* BitBucket ( thanks to simplegeo )
* Foursquare (thanks to http://github.com/stunti)
* Custom OAuth Provider Strategy (Be your own 1.0A OAuth provider!) (A Port of Christian Amor Kvalheim's  [express-oauth-plugin])  

Take Care!

-cj.


Testing
=======

    % make

Running with npm
=================

    % npm install connect-auth
    % node examples/connect-testing.js

Edit /etc/hosts to include the following entry

    % grep twit /etc/hosts
    127.0.0.1    testtwitter.com

For basic auth

    % open http://localhost:3000

For twitter auth

    % open http://localhost:3000/twitter


[warden]: http://github.com/hassox/warden
[npm]: http://github.com/isaacs/npm    
[express-oauth-plugin]: http://github.com/christkv/node-express-oauth-plugin


Changelog
=========

 * 0.2.3
    Added support for BitBucket (Thanks simplegeo) 
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
