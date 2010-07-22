var connect = require('connect');   
var MemoryStore = require('connect/middleware/session/memory');
var auth= require('../lib/auth');

var OAuth= require('oauth').OAuth;

var getPasswordForUserFunction= function(user,  callback) {
  var result;
  if( user == 'foo' ) result= 'bar';
  callback(null, result);
}

// N.B. TO USE Any of these strategies the following relevant parameters must be defined!!!.
var fbId= "";
var fbSecret= "";
var fbCallbackAddress= "http://yourtesthost.com/auth/facebook_callback"
var ghId= "";
var ghSecret= "";
var ghCallbackAddress= "http://yourtesthost.com/auth/github_callback";
var twitterConsumerKey= "GHDOryA8raJAjQNolf1fHw";
var twitterConsumerSecret= "gcfRBoQDbSwS3thxe6yTaIkWk4utIgsCNXxfidi0RDM";
var yahooConsumerKey= "";
var yahooConsumerSecret= "";
var yahooCallbackAddress= "http://yourtesthost.com/auth/yahoo_callback";
var foursquareConsumerKey= "";
var foursquareConsumerSecret= "";
var janrainApiKey= "";
var janrainAppDomain= "yourrpxnowsubdomain";
var janrainCallbackUrl= "http://localhost/auth/janrain_callback";


function routes(app) {
  app.get ('/auth/twitter', function(req, res, params) {
    req.authenticate(['twitter'], function(error, authenticated) { 
      if( authenticated ) {
        var oa= new OAuth("http://twitter.com/oauth/request_token",
                          "http://twitter.com/oauth/access_token",
                          twitterConsumerKey,
                          twitterConsumerSecret,
                          "1.0",
                          null,
                          "HMAC-SHA1");
        oa.getProtectedResource("http://twitter.com/statuses/user_timeline.xml", "GET",
                                req.session.auth["twitter_oauth_token"], req.session.auth["twitter_oauth_token_secret"],  function (error, data) {
            res.writeHead(200, {'Content-Type': 'text/html'})
            res.end("<html><h1>Hello! Twitter authenticated user ("+req.session.auth.user.username+")</h1>"+data+ "</html>")
        });
      }
      else {
        res.writeHead(200, {'Content-Type': 'text/html'})
        res.end("<html><h1>Twitter authentication failed :( </h1></html>")
      }
    });
  })

  app.get ('/auth/facebook', function(req, res, params) {
    req.authenticate(['facebook'], function(error, authenticated) {
      res.writeHead(200, {'Content-Type': 'text/html'})
      if( authenticated ) {
        res.end("<html><h1>Hello Facebook user:" + JSON.stringify(  req.session.auth.user ) + ".</h1></html>")
      }
      else {
        res.end("<html><h1>Facebook authentication failed :( </h1></html>")
      }
    });
  })


  app.get ('/auth/github', function(req, res, params) {
    req.authenticate(['github'], function(error, authenticated) {
      res.writeHead(200, {'Content-Type': 'text/html'})
      if( authenticated ) {
        res.end("<html><h1>Hello github user:" + JSON.stringify(  req.session.auth.user ) + ".</h1></html>")
      }
      else {
        res.end("<html><h1>Github authentication failed :( </h1></html>")
      }
    });
  })

  app.get ('/auth/yahoo', function(req, res, params) {
    req.authenticate(['yahoo'], function(error, authenticated) {
      res.writeHead(200, {'Content-Type': 'text/html'})
      if( authenticated ) {
        res.end("<html><h1>Hello Yahoo! user:" + JSON.stringify(  req.session.auth.user ) + ".</h1></html>")
      }
      else {
        res.end("<html><h1>Yahoo! authentication failed :( </h1></html>")
      }
    });
  })

  app.get('/auth/anon', function(req, res, params) {
    req.authenticate(['anon'], function(error, authenticated) { 
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end("<html><h1>Hello! Full anonymous access</h1></html>")
    });
  })
  
  app.get('/auth/never', function(req, res, params) {
    req.authenticate(['anon'], function(error, authenticated) { 
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end("<html><h1>Hello! Authenticated: "+ authenticated + "</h1></html>")
    });
  })
    
  app.get('/auth/basic', function(req, res, params) {
    req.authenticate(['basic'], function(error, authenticated) { 
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end("<html><h1>Hello! Basic access</h1></html>")
    });
  })
  app.get('/auth/http', function(req, res, params) {
    req.authenticate(['http'], function(error, authenticated) { 
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end("<html><h1>Hello! Delegated Http access</h1></html>")
    });
  })  
  app.get('/auth/digest', function(req, res, params) {
    res.writeHead(200, {'Content-Type': 'text/html'})
    req.authenticate(['digest'], function(error, authenticated) { 
      if( authenticated ) {
        if( ! req.session.counter ) req.session.counter= 0;
        res.end("<html><h1>Hello! My little digestive"+ req.session.auth.user.username+ "</h1>"  + "<p>" + (req.session.counter++) +"</p></html>")
      }
      else {
        res.end("<html><h1>should not be happening...</h1></html>")
      }
    });
  })

  app.get ('/logout', function(req, res, params) {
    req.logout();
    res.writeHead(303, { 'Location': "/" });
    res.end('');
  })

  app.get('/', function(req, res, params) {
    var self=this;
    res.writeHead(200, {'Content-Type': 'text/html'})
    if( !req.isAuthenticated() ) {
      res.end('<html>                                              \n\
          <head>                                             \n\
            <title>connect Auth -- Not Authenticated</title> \n\
          </head>                                            \n\
          <body>                                             \n\
            <div id="wrapper">                               \n\
              <h1>Not authenticated</h1>                     \n\
              <div class="fb_button" id="fb-login" style="float:left; background-position: left -188px">          \n\
                <a href="/auth/facebook" class="fb_button_medium">        \n\
                  <span id="fb_login_text" class="fb_button_text"> \n\
                    Connect with Facebook                    \n\
                  </span>                                    \n\
                </a>                                         \n\
              </div>                                         \n\
              <div style="float:left;margin-left:5px">       \n\
                <a href="/auth/yahoo" style="border:0px">  \n\
                 <img style="border:0px" src="http://l.yimg.com/a/i/reg/openid/buttons/1_new.png"/> \n\
                </a>                                         \n\
              </div>                                         \n\
              <div style="float:left;margin-left:5px">       \n\
                <a href="/auth/twitter" style="border:0px">  \n\
                  <img style="border:0px" src="http://apiwiki.twitter.com/f/1242697715/Sign-in-with-Twitter-darker.png"/>\n\
                </a>                                         \n\
              </div>                                         \n\
              <div style="float:left;margin-left:5px">       \n\
                <a href="/auth/github" style="border:0px">  \n\
                  <img style="border:0px" src="http://github.com/intridea/authbuttons/raw/master/png/github_64.png"/>\n\
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
            ' + JSON.stringify(req.session.auth.user) + '   \n\
             <h2><a href="/logout">Logout</a></h2>                \n\
            </div>                                           \n\
          </body>                                            \n\
        </html>')
    }
  })
}
var server= connect.createServer( 
                      connect.cookieDecoder(), 
                      connect.session({ store: new MemoryStore({ reapInterval: -1 }) }),
                      connect.bodyDecoder() /* Only required for the janrain strategy*/,
                      auth( [
                            auth.Anonymous(),
                            auth.Basic({getPasswordForUser: getPasswordForUserFunction}),
                            auth.Digest({getPasswordForUser: getPasswordForUserFunction}),
                            auth.Http({getPasswordForUser: getPasswordForUserFunction}),
                            auth.Never(),
                            auth.Twitter({consumerKey: twitterConsumerKey, consumerSecret: twitterConsumerSecret}),
                            auth.Facebook({appId : fbId, appSecret: fbSecret, scope: "email", callback: fbCallbackAddress}),
                            auth.Github({appId : ghId, appSecret: ghSecret, callback: ghCallbackAddress})
                            ]), 
                            
                      connect.router(routes));

/*var server= connect.createServer( 
                      connect.cookieDecoder(), 
                      connect.session({ store: new MemoryStore({ reapInterval: -1 }) }),
                      connect.bodyDecoder(), // Only required for the janrain strategy
                           "github": new StrategyDefinition(auth.Github, {appId : ghId, appSecret: ghSecret, callback: ghCallbackAddress}),
                           "yahoo": new StrategyDefinition(auth.Yahoo, {consumerKey: yahooConsumerKey, consumerSecret: yahooConsumerSecret, callback: yahooCallbackAddress}),
                           "foursquare" : new StrategyDefinition(auth.Foursquare, {consumerKey: foursquareConsumerKey, consumerSecret: foursquareConsumerSecret}),
                           "janrain": new StrategyDefinition(auth.Janrain, {apiKey: janrainApiKey, 
                                                                       appDomain: janrainAppDomain, 
                                                                       callback: janrainCallbackUrl}),
                       connect.router(routes)); */
server.listen(80);