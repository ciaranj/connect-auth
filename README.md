connect-auth
============

Useful authentication strategies based on [warden]. Available as a [npm] package.

Provides out of the box authentication stratgies for:

 * HTTP Basic - sole or negotiated
 * HTTP Digest - sole or negotiated
 * Facebook connect (OAuth 2)
 * Github (OAuth 2)
 * Yahoo (OAuth 1.0A)
 * Twitter (OAuth 1.0)
 * Anonymous
 * Never

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
