/*
* Copyright(c) 2011 Eran Hammer-Lahav <eran@hueniverse.com>
* MIT Licensed
* Based on RFC-Draft: http://tools.ietf.org/html/draft-hammer-oauth-v2-mac-token
*/

var Crypto = require('crypto');
var URL = require('url');
var Base = require("./base");
var AuthUtils = require('../_authutils');


MAC = module.exports = function (options) {

    // Module setup

    var that = Base(options);
    that.name = options.name || 'mac';

    var my = {};
    my._getTokenAttributes = options.getTokenAttributes;
    my._isHTTPS = options.isHTTPS || false;
    my._isForwardedHost = options.isForwardedHost || false;

    // MAC authentication

    that.authenticate = function (request, response, callback) {

        var self = this;

        // Parse HTTP Authorization header

        if (request.headers.authorization == null ||
            request.headers.authorization.length == 0) {

            // Error: No authentication

            return replyUnauthorized('', 'No authentication', response, callback, self);
        }

        var credentials = AuthUtils.splitAuthorizationHeader(request.headers.authorization);

        // Verify MAC athentication scheme

        if (credentials.type == null ||
            credentials.type.toLowerCase() != "mac") {

            // Error: Wrong authentication scheme

            return replyUnauthorized('', 'Incorrect authentication scheme', response, callback, self);
        }

        // Verify required header attributes

        if (credentials.token == null ||
            credentials.timestamp == null ||
            credentials.nonce == null ||
            credentials.signature == null) {

            // Error: Missing authentication attribute

            return replyUnauthorized('invalid_request', 'Missing attributes', response, callback, self);
        }

        // Obtain host and port information

        var hostHeader = (my._isForwardedHost ? request.headers['x-forwarded-host'] : request.headers.host);

        if (hostHeader == null) {

            // Error: Missing Host header field

            return replyUnauthorized('invalid_request', 'Missing Host header', response, callback, self);
        }

        var hostHeaderRegex = /^(?:(?:\r\n)?[\t ])*([^:]+)(?::(\d+))*(?:(?:\r\n)?[\t ])*$/; // Does not support IPv6
        var hostParts = hostHeaderRegex.exec(hostHeader);

        if (hostParts == null ||
            hostParts[1] == null) {

            // Error: Bad Host header field

            return replyUnauthorized('invalid_request', 'Bad Host header', response, callback, self);
        }

        var host = hostParts[1];
        var port = (hostParts[2] ? hostParts[2] : (my._isHTTPS ? 443 : 80));

        // Fetch token secret

        var tokenAttributes = my._getTokenAttributes(credentials.token);

        if (tokenAttributes.secret == null ||
            tokenAttributes.algorithm == null ||
            (tokenAttributes.algorithm != 'hmac-sha-1' && tokenAttributes.algorithm != 'hmac-sha-256')) {

            // Error: Invalid token

            return replyUnauthorized('invlaid_token', 'Invalid token', response, callback, self);
        }

        // Calculate signature

        var signature = signRequest(request.method,
                                    request.url,
                                    host,
                                    port,
                                    credentials.token,
                                    tokenAttributes.secret,
                                    tokenAttributes.algorithm,
                                    credentials.timestamp,
                                    credentials.nonce);

        if (signature != credentials.signature) {

            // Error: Bad signature

            return replyUnauthorized('invalid_token', 'Bad signature', response, callback, self);
        }

        // Successful authentication

        self.success(tokenAttributes, callback);
    };

    that.getAuthenticateResponseHeader = function () {
        return "MAC";
    };

    return that;
};


function replyUnauthorized(error, message, response, callback, executionScope) {

    switch (error) {
        case 'invalid_request': code = 400; break;
        case 'invalid_token': code = 401; break;
        case 'insufficient_scope': code = 403; break;
        default: code = 401; break;
    }

    response.writeHead(code, { 'Content-Type': 'text/plain',
        'WWW-Authenticate': 'MAC ' + (error ? 'error="' + error + '", error-desc="' + message + '"' : '')
    });
    response.end('Authorization Required');
    executionScope.halt(callback);
}


function signRequest(method, URI, host, port, token, secret, algorithm, timestamp, nonce) {

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

    var hashMethod;
    switch (algorithm) {

        case 'hmac-sha-1': hashMethod = 'sha1'; break;
        case 'hmac-sha-256': hashMethod = 'sha256'; break;
        default: return "";                                     // Error: Unknown algorithm
    }

    var hmac = Crypto.createHmac(hashMethod, secret).update(normalized);
    var digest = hmac.digest(encoding = "base64");
    return digest;
}


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

