express-auth
============

Useful authentication strategies based on [warden]. Available as a [kiwi] package.
Provides out of the box authentication stratgies for:
* HTTP Basic
* HTTP Digest
* Facebook connect (OAuth 2)
* Github (OAuth 2)
* Yahoo (OAuth 1.0A)
* Twitter (OAuth 1.0)
* Anonymous
* Never

Testing
=======

    % make

Running with kiwi
=================

    % brew install kiwi
    % kiwi install express-auth
    % node examples/app.js

Edit /etc/hosts to include the following entry

    % grep twit /etc/hosts
    127.0.0.1    testtwitter.com

For basic auth

    % open http://localhost:3000

For twitter auth

    % open http://localhost:3000/twitter


[warden]: http://github.com/hassox/warden
[kiwi]: http://github.com/visionmedia/kiwi
