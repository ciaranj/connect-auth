// Load modules

var express = require('express');
var auth = require('connect-auth');


// Create and configure server instance

function createServer () {

    // Create server

    var server = express.createServer();

    // Configure Server

    server.configure(function () {

        // Built-in

        server.use(express.methodOverride());                           // Allow method override using _method form parameter
        server.use(express.bodyDecoder()); 	                            // Parse application/x-www-form-urlencoded
        server.use(express.staticProvider(__dirname + '/files'));       // Serve client documents in local directory

        // Local

        server.use(setResponseHeader());                                // Set default response headers for CORS
        server.use(logConsole());                                       // Display incoming requests

        // Authentication

        server.use(auth([auth.Mac({ realm: "Example",                   // Set realm, typically a domain name or application name
                                    getTokenAttributes: getToken,       // Function used to fetch the access token record, typically from a database
                                    // hostHeader: 'x-forwarded-host',  // Needed when running behind a proxy such as Apache2
                                    // isHTTPS: true,                   // Uncomment for HTTPS
                                    checkNonce: nonceCheck,             // Optional nonce checking function
                                    bodyHashMode: "require" })]));      // Require body hash validation for all non GET/HEAD/OPTIONS requests
    });

    // Setup generic OPTIONS route

    server.options(/.+/, function (req, res) {

        res.send(' ');
    });

    return server;
}


// Set default response headers to enable CORS

function setResponseHeader() {

    return function (req, res, next) {

        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Authorization');
        res.header('Access-Control-Max-Age', '86400');  // One day

        next();
    };
};


// Log requests to console

function logConsole() {

    return function (req, res, next) {

        console.log('Received request: ' + req.method + ' ' + req.originalUrl);

        next();
    };
}


// MAC Authentication

function getToken (token, callback) {

    if (token != null &&
        token != '') {

        // Fetch token from database or cache

        if (token == 'h328hdkasjd3') {

            var record = { algorithm: 'hmac-sha-256',   // Required
                secret: '23hdkdho2893hdkjd',            // Required
                userId: 'johndoe'                       // Application-specific field
            };

            callback(record);
        }
        else {

            // Token not found

            callback({});
        }
    }
    else {

        // Invalid token request

        callback({});
    }
}


var nonceCache = {};

function nonceCheck(token, timestamp, nonce, callback) {

    // Warning: Don't use this in production as it will grow until out of memory

    if (nonceCache[token] == null) {

        nonceCache[token] = {};
    }

    if (nonceCache[token][timestamp] == null) {

        nonceCache[token][timestamp] = {};
    }

    if (nonceCache[token][timestamp][nonce]) {

        // Replay

        callback(false);
    }
    else {

        // Never used before

        nonceCache[token][timestamp][nonce] = true;
        callback(true);
    }
}


function authenticate (req, res, next) {

    req.authenticate(['mac'], function (error, authenticated) {

        if (authenticated) {

            var userId = req.getAuthDetails().user.userId;

            if (userId == null ||
                userId == '') {

                // Internal Error
                res.send("Bad Token User ID");
            }
            else {

                req.example = {};
                req.example.userId = userId;
                next();
            }
        }
    });
}


// Create server

var app = module.exports = createServer();


// Routing rules

app.get('/test', authenticate, function (req, res) {

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("GET Received from: " + req.example.userId);
});


app.post('/test', authenticate, function (req, res) {

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("POST Received from: " + req.example.userId);
});


// Start server

app.listen(8000, "postmile.net");
console.log('Example Server started at http://localhost:8000');

