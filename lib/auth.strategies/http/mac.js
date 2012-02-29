/*

Copyright(c) 2011 Eran Hammer-Lahav <eran@hueniverse.com>
MIT Licensed
Based on RFC-Draft: http://tools.ietf.org/html/draft-hammer-oauth-v2-mac-token

Options:

realm              - optional string with the authentication realm name. The realm value can be anything like
                     the domain name or service name. If you only have one set of tokens for the entire service,
                     don't worry about it. Otherwise, read RFC 2617. Defaults to 'Protected Resources'.

getTokenAttributes - required function to lookup an access token and find its associated secret,
                     MAC algorithm, and other attributes (such as username) needed by the application.
                     Since the actual validation is done by the module, this function is the
                     equivalent to verifying the username and password in Basic auth. Syntax:
                     function (token, callback), where callback takes a single object value with the following
                     required keys: secret, algorithm. If not token was found, call callback(null). The returned
                     object is set as the value of the connect-auth 'user' variable so add to the object any
                     other values needed by the application post-authentication based on the token (e.g. username).


isHTTPS            - optional Boolean, set to true when used with an HTTPS service. The scheme is needed
                     when calculating the default port number if none is present in the Host header field.
                     Defaults to false.

hostHeader         - optional header field name, used to override the default 'Host' header when used
                     behind a cache of a proxy. Apache2 changes the value of the 'Host' header while preserving
                     the original (which is what the module must verify) in the 'x-forwarded-host' header field.

checkNonce         - optional function for checking if the received timestamp and nonce have been used before.
                     function is called only after the signature is validated since calculating the signature is
                     assumed to be less expensive than checking the nonce. Nonce verification is important when
                     a reply of a captured request is critical and no transport layer security is used (such as
                     HTTPS). Syntax: function (token, timestamp, nonce, callback), where callback takes a single
                     Boolean value, true for valid and false for bad nonce or timestamp. If left undefined, no
                     nonce checking.

bodyHashMode       - optional string, one of ['ignore', 'validate', 'require']. 'ignore' will not validate any
                     body hash provided by the client. 'validate' will check the body hash if included. 'require'
                     will require any POST / PUT requests, with or without an entity-body to include a 'bodyhash'
                     value, and validate the hash. Defaults to 'validate'. Requires express.bodyDecoder() to set
                     request.rawBody for any mode other than 'ignore'.
*/


// Load required dependencies

var Crypto = require('crypto');
var URL = require('url');
var Base = require("./base");
var AuthUtils = require('../_authutils');


// MAC authentication

module.exports = function (options) {

    // Module setup

    var that = Base(options);
    that.name = options.name || 'mac';

    var my = {};
    my._realm = options.realm || 'Protected Resources';
    my._getTokenAttributes = options.getTokenAttributes;
    my._isHTTPS = options.isHTTPS || false;
    my._hostHeader = (options.hostHeader && options.hostHeader != '' ? options.hostHeader.toLowerCase() : 'host');
    my._checkNonce = options.checkNonce || function (token, timestamp, nonce, callback) { callback(true); };
    my._bodyHashMode = options.bodyHashMode || 'validate';

    // MAC authentication

    that.authenticate = function (request, response, callback) {

        var self = this;

        // Parse HTTP Authorization header

        if (request.headers.authorization == null ||
            request.headers.authorization.length == 0) {

            // Error: No authentication

            that._unAuthenticated(self, request, response, callback, { message: 'No authentication' });
            return;
        }

        var credentials = AuthUtils.splitAuthorizationHeader(request.headers.authorization);

        // Verify MAC authentication scheme

        if (credentials.type == null ||
            credentials.type.toLowerCase() != "mac") {

            // Error: Wrong authentication scheme

            that._unAuthenticated(self, request, response, callback, { message: 'Incorrect authentication scheme' });
            return;
        }

        // Verify required header attributes

        if (credentials.token == null ||
            credentials.timestamp == null ||
            credentials.nonce == null ||
            credentials.signature == null) {

            // Error: Missing authentication attribute

            that._badRequest(self, request, response, callback, { message: 'Missing attributes' });
            return;
        }

        // Check for body hash if required

        if (my._bodyHashMode == 'require' &&
            (request.method == 'POST' || request.method == 'PUT')) {

            if (credentials.bodyhash == null ||
                credentials.bodyhash == '') {

                // Error: Missing body hash attribute

                that._badRequest(self, request, response, callback, { message: 'Missing required body hash attribute' });
                return;
            }
        }

        // Obtain host and port information

        var hostHeader = (my._hostHeader == 'host' ? request.headers.host : request.headers[my._hostHeader]);

        if (hostHeader == null) {

            // Error: Missing Host header field

            that._badRequest(self, request, response, callback, { message: 'Missing Host header' });
            return;
        }

        var hostHeaderRegex = /^(?:(?:\r\n)?[\t ])*([^:]+)(?::(\d+))*(?:(?:\r\n)?[\t ])*$/; // Does not support IPv6
        var hostParts = hostHeaderRegex.exec(hostHeader);

        if (hostParts == null ||
            hostParts[1] == null) {

            // Error: Bad Host header field

            that._badRequest(self, request, response, callback, { message: 'Bad Host header' });
            return;
        }

        var host = hostParts[1];
        var port = (hostParts[2] ? hostParts[2] : (my._isHTTPS ? 443 : 80));

        // Fetch token secret

        my._getTokenAttributes(credentials.token, function (tokenAttributes) {

            if (tokenAttributes == null ||
                tokenAttributes.secret == null ||
                tokenAttributes.algorithm == null ||
                (tokenAttributes.algorithm != 'hmac-sha-1' && tokenAttributes.algorithm != 'hmac-sha-256')) {

                // Error: Invalid token

                that._unAuthenticated(self, request, response, callback, { message: 'Invalid token' });
                return;
            }

            // Lookup hash function

            var hashMethod = '';
            switch (tokenAttributes.algorithm) {

                case 'hmac-sha-1': hashMethod = 'sha1'; break;
                case 'hmac-sha-256': hashMethod = 'sha256'; break;
            }

            // Calculate body hash if present

            if (credentials.bodyhash != null &&
                my._bodyHashMode != 'ignore') {

                // Note: request.rawBody requires express.bodyDecoder()

                var bodyHash = Crypto.createHash(hashMethod).update(request.rawBody).digest(encoding = "base64");
                if (bodyHash != credentials.bodyhash) {

                    // Error: Mismatching body hash

                    that._unAuthenticated(self, request, response, callback, { message: 'Bad body hash' });
                    return;
                }
            }

            // Calculate signature

            var signature = signRequest(request.method,
                                        request.originalUrl,
                                        host,
                                        port,
                                        credentials.token,
                                        tokenAttributes.secret,
                                        hashMethod,
                                        credentials.timestamp,
                                        credentials.nonce,
                                        credentials.bodyhash || '');

            if (signature != credentials.signature) {

                // Error: Bad signature

                that._unAuthenticated(self, request, response, callback, { message: 'Bad signature' });
                return;
            }

            // Check nonce / timestamp combination

            my._checkNonce(credentials.token, credentials.timestamp, credentials.nonce, function (isValid) {

                if (isValid == false) {

                    // Invalid nonce

                    that._unAuthenticated(self, request, response, callback, { message: 'Invalid nonce' });
                    return;
                }

                // Successful authentication

                self.success(tokenAttributes, callback);
            });
        });
    };


    // WWW-Authenticate header

    that.getAuthenticateResponseHeader = function (executionScope, attributes) {

        return 'MAC realm="' + my._realm + '"' + (attributes && attributes.message ? ',message="' + attributes.message + '"' : '');
    };

    return that;
};


// Calculate the request signature

function signRequest(method, URI, host, port, token, secret, hashMethod, timestamp, nonce, bodyHash) {

    // Parse request URI

    var uri = URL.parse(URI, true);

    if (uri.pathname == null) {

        // Error: Bad request URI
        return "";
    }

    // Construct normalized request string

    var normalized = token + '\n' +
                     timestamp + '\n' +
                     nonce + '\n' +
                     bodyHash + '\n' +
                     method.toUpperCase() + '\n' +
                     host.toLowerCase() + '\n' +
                     port + '\n' +
                     uri.pathname + '\n';

    // Normalize parameters

    var params = new Array;

    if (uri.query) {

        var count = 0;
        for (var p in uri.query) {

            if (typeof uri.query[p] == 'string') {

                params[count++] = percentEscape(p) + "=" + percentEscape(uri.query[p]);
            }
            else {

                for (var i in uri.query[p]) {

                    params[count++] = percentEscape(p) + "=" + percentEscape(uri.query[p][i]);
                }
            }
        }

        params.sort();

        for (var i in params) {

            normalized += params[i] + '\n';
        }
    }

    // Sign normalized request string

    var hmac = Crypto.createHmac(hashMethod, secret).update(normalized);
    var digest = hmac.digest(encoding = "base64");
    return digest;
}


// Percent encode values per custom specification

function percentEscape(value) {

    // Percent-escape per specification

    var escapedString = '';

    for (var i = 0; i < value.length; i++) {

        var char = value.charCodeAt(i);

        if ((char >= 48 && char <= 57) ||       // 09
            (char >= 65 && char <= 90) ||       // AZ
            (char >= 97 && char <= 122) ||      // az
            char == 45 ||                       // -
            char == 95 ||                       // _
            char == 46 ||                       // .
            char == 126) {                      // ~

            escapedString += String.fromCharCode(char);
        }
        else {

            escapedString += '%' + char.toString(16).toUpperCase();
        }
    }

    return escapedString;
}

