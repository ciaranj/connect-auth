var connect = require("connect"),
    https = require('https'),
    url = require('url');

module.exports = function(options) {
    options = options || {};
    var that = {};

    that.name = options.name || "cas";
    that.ssoHost = options.casServer;
    that.serverBaseURL = options.serverBaseURL;

    var ssoBaseURL = 'https://' + that.ssoHost;
    var loginURL = ssoBaseURL + '/login';
    var validateURL = ssoBaseURL + '/validate';

    var validate = function(request, ticket, callback) {
        var resolvedURL = url.resolve(that.serverBaseURL, request.url);
        var parsedURL = url.parse(resolvedURL, true);
        delete parsedURL.query.ticket;
        delete parsedURL.search;
        var service = url.format(parsedURL);
        var result = https.get({
            host: that.ssoHost,
            path: url.format({
                pathname: '/validate',
                query: {
                    ticket: ticket,
                    service: service
                }
            }),
        },

            function (response) {
                response.setEncoding('utf8');

                var body = '';
                response.on('data', function(chunk) {
                    body += chunk;
                });

                response.on('end', function() {
                    var lines = body.split('\n');
                    if (lines.length >= 1) {
                        if (lines[0] == 'no') {
                            callback(null, null);
                            return;
                        }
                        else if (lines[0] == 'yes' && lines.length >= 2) {
                            var user = {
                                id: lines[1]
                            };
                            callback(null, user);
                            return;
                        }
                    }
                    callback(new Error('The response from the server was bad'), null);
                    return;
                });
            }
        );
        result.on('error', function(e) {
            console.error(e);
            callback(e, null);
        });
        return;
    };

    // Build the authentication routes required
    that.setupRoutes = function(server) {
        server.use('/', connect.router(function routes(app) {
            app.get('*', function(req, res, next) {
                var parsedUrl = url.parse(req.url, true);
                if (parsedUrl.query["ticket"]) {
                    req.authenticate([that.name], function(error, authenticated) {
                        next();
                    });
                }
                else {
                    next();
                }
            });
        }));
    };


    that.authenticate = function(request, response, callback) {
        var self = this;
        var parsedUrl = url.parse(request.url, true);

        if (request.getAuthDetails()['cas_login_attempt_failed'] === true) {
            // Because we bounce through authentication calls across multiple requests
            // we use this to keep track of the fact we *Really* have failed to authenticate
            // so that we don't keep re-trying to authenticate forever.
            delete request.getAuthDetails()['cas_login_attempt_failed'];
            self.fail(callback);
        }
        else if (parsedUrl.query["ticket"]) {
            self.trace('Phase 2/2 - Verifying CAS Ticket');

            validate(request, parsedUrl.query["ticket"], function(error, result) {
                if (result !== null) {
                    var user = {
                        user_id: result.id
                    };
                    self.success(user, callback);
                }
                else {
                    request.getAuthDetails()['cas_login_attempt_failed'] = true;
                    self.fail(callback);
                }
            });
        }
        else {
            self.trace('Phase 1/2 - Authenticating with CAS');
            var redirectURL = url.parse(loginURL, true);
            var service = that.serverBaseURL + request.url;
            redirectURL.query.service = service;
            self.redirect(response, url.format(redirectURL), callback);
        }
    };
    return that;
};