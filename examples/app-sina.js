var connect = require('connect');
var MemoryStore = require('connect/middleware/session/memory');
var auth = require('../lib/index');
var util = require('util');

// We let the example run without npm, by setting up the require paths
// so the node-oauth submodule inside of git is used.  You do *NOT*
// need to bother with this line if you're using npm ...
require.paths.unshift('support');
var OAuth = require('oauth').OAuth;


// N.B. TO USE Any of the OAuth or RPX strategies you will need to provide
// a copy of the example_keys_file (named keys_file)
try {
  var example_keys = require('./keys_file');
  for (var key in example_keys) {
    global[key] = example_keys[key];
  }
}
catch(e) {
  console.log('Unable to locate the keys_file.js file.  Please copy and ammend the example_keys_file.js as appropriate');
  return;
}

var sinaWBOAuth = new OAuth("http://api.t.sina.com.cn/oauth/request_token",
                            "http://api.t.sina.com.cn/oauth/access_token",
                            sinaConsumerKey, sinaConsumerSecret,
                            "1.0", sinaCallbackAddress, "HMAC-SHA1");

function routes(app) {
  app.get('/auth/sina', function(req, res, params) {
    req.authenticate(['sina'], function(error, authenticated) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      if (authenticated) {
        res.end("<html><h1>Hello Sina user:" + JSON.stringify(req.getAuthDetails().user) + ".</h1></html>")
      }
      else {
        res.end("<html><h1>Sina authentication failed :( </h1></html>")
      }
    });
  });

  app.get('/sina/user_timeline', function(req, res, params) {
    req.authenticate((['sina']), function(error, authenticated) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      if (authenticated) {
        sinaWBOAuth.getProtectedResource('http://api.t.sina.com.cn/statuses/user_timeline.json', 'GET',
                                         req.getAuthDetails()['sina_oauth_token'],
                                         req.getAuthDetails()['sina_oauth_token_secret'],
                                         function (error, data) {
                                           if (error) {
                                             var r = ["<html><pre>",
                                                      "error = " + util.inspect(error),
                                                      "</pre></html>"];
                                             res.end(r.join(""));
                                           } else {
                                            var utl = JSON.parse(data);
                                             res.write("<html><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
                                             res.write("<body>");

                                             res.write("<h1>Fetch user_timeline for Sina user:" + JSON.stringify(req.getAuthDetails().user) + ".</h1>");
                                             res.write(util.inspect(utl));
                                             res.end("</html>");
                                           }
                                         }
            )
      }
      else {
        res.end("<html><h1>You are not logged in to Sina</h1></html>");
      }
    });
  });

  app.get('/sina/post_current_time', function(req, res, params) {
    req.authenticate((['sina']), function(error, authenticated) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      if (authenticated) {
        var s = "The time now is: " + new Date();
        sinaWBOAuth.getProtectedResource('http://api.t.sina.com.cn/statuses/update.json?status=' + encodeURIComponent(s), 'POST',
                                         req.getAuthDetails()['sina_oauth_token'],
                                         req.getAuthDetails()['sina_oauth_token_secret'],
                                         function (error, data) {
                                           if (error) {
                                             var r = ["<html><pre>",
                                                      "error = " + util.inspect(error),
                                                      "</pre></html>"];
                                             res.end(r.join(""));
                                           }
                                           else {
                                             var result = JSON.parse(data);
                                             res.write("<html><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
                                             res.write("<body>");
                                             res.write("<h1>Message Posted for Sina user:" + JSON.stringify(req.getAuthDetails().user) + ".</h1>");
                                             res.write("<body>");
                                             res.write("<ol>");
                                             res.write("<li>Message = " + s);
                                             res.write("<li>");
                                             res.write("<li>Result = " + JSON.stringify(util.inspect(result)));
                                             res.write("</ol>");
                                             res.write("</body>");
                                             res.end("</html>");
                                           }
                                         }
            )
      }
      else {
        res.end("<html><h1>You are not logged in to Sina</h1></html>");
      }
    });
  });


  app.get('/auth/anon', function(req, res, params) {
    req.authenticate(['anon'], function(error, authenticated) {
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end("<html><h1>Hello! Full anonymous access</h1></html>")
    });
  })

  app.get('/auth/never', function(req, res, params) {
    req.authenticate(['anon'], function(error, authenticated) {
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end("<html><h1>Hello! Authenticated: " + authenticated + "</h1></html>")
    });
  })

  app.get('/logout', function(req, res, params) {
    req.logout();
    res.writeHead(303, { 'Location': "/" });
    res.end('');
  })

  app.get('/', function(req, res, params) {
    var self = this;
    res.writeHead(200, {'Content-Type': 'text/html'})
    if (!req.isAuthenticated()) {
      res.end('<html>                                              \n\
          <head>                                             \n\
            <title>connect Auth -- Not Authenticated</title> \n\
          </head>                                            \n\
          <body>                                             \n\
            <div id="wrapper">                               \n\
              <h1>Not authenticated</h1>                     \n\
              <div style="float:left;margin-left:5px">          \n\
                <a href="/auth/sina" style="border:0px">        \n\
                    <img style="border:0px" src="http://open.sinaimg.cn/wikipic/button/16.png"/>            \n\
                </a>                                         \n\
              </div>                                         \n\
            </div>                                           \n\
          </body>                                            \n\
        </html>')
    }
    else {
      res.end('<html>                                              \n\
          <head>                                             \n\
            <title>Express Auth -- Authenticated</title>\n\
          </head>                                            \n\
          <body>                                             \n\
            <div id="wrapper">                               \n\
              <h1>Authenticated</h1>     \n\
            ' + JSON.stringify(req.getAuthDetails().user) + '   \n\
             <h2><a href="/logout">Logout</a></h2>                \n\
            </div>                                           \n\
          </body>                                            \n\
        </html>')
    }
  })
}

var server = connect.createServer(
    connect.cookieDecoder(),
    connect.session({ store: new MemoryStore({ reapInterval: -1 }) }),
    connect.bodyDecoder() /* Only required for the janrain strategy*/,
    auth([
           auth.Anonymous(),
           auth.Never(),
           auth.Sina({consumerKey: sinaConsumerKey, consumerSecret: sinaConsumerSecret, callback: sinaCallbackAddress})
         ]),
    connect.router(routes));

server.listen(80);