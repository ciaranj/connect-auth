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
* Foursquare (thanks to http://github.com/stunti)
* Custom OAuth Provider Strategy (Be your own 1.0A OAuth provider!) (A Port of Christian Amor Kvalheim's  [express-oauth-plugin])  

Please note this has only just been ported over from express, and whilst it does in fact now work again, I've not yet fully ported the tests or example applications so your mileage may vary :) 

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

 * 0.1.3 - Strategies can now be written that do not require the session middleware.
 * 0.1.2 - Added in new strategy that allows your authentication strategy to be a custom OAuth provider.
 * 0.1.0 - New simplified configuration (connect idiomatic) of strategies implemented.
