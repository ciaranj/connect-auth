var connect = require('connect')
   ,auth= require('../lib/index')
   ,url = require('url')
   ,fs = require('fs');

// We let the example run without npm, by setting up the require paths
// so the node-oauth submodule inside of git is used.  You do *NOT*
// need to bother with this line if you're using npm ...
require.paths.unshift('support')
var OAuth= require('oauth').OAuth;

var getSharedSecretForUserFunction = function(user,  callback) {
	var result;
	if(user == 'foo') 
		result= 'bar';
	callback(null, result);
};

var validatePasswordFunction = function(username, password, successCallback, failureCallback){
	if (username === 'foo' && password === "bar"){
		successCallback();
	} else {
		failureCallback();
	}
};

// N.B. TO USE Any of the OAuth or RPX strategies you will need to provide
// a copy of the example_keys_file (named keys_file) 
try {
  var example_keys= require('./keys_file');
  for(var key in example_keys) {
    global[key]= example_keys[key];
  }
}
catch(e) {
  console.log('Unable to locate the keys_file.js file.  Please copy and ammend the example_keys_file.js as appropriate');
  return;
}

// Setup the 'template' pages (don't use sync calls generally, but meh.)
var authenticatedContent= fs.readFileSync( __dirname+"/public/authenticated.html", "utf8" );
var unAuthenticatedContent= fs.readFileSync( __dirname+"/public/unauthenticated.html", "utf8" );

// There appear to be Scurrilous ;) rumours abounding that connect-auth
// doesn't 'work with connect' as it does not act like an 'onion skin'
// to address this I'm showing how one might extend the *PRIMITIVES* 
// provided by connect-auth to simplify a middleware layer. 

// This middleware detects login requests (in this case requests with a query param of ?login_with=xxx where xxx is a known strategy)
var example_auth_middleware= function() {
  return function(req, res, next) {
    var urlp= url.parse(req.url, true)
    if( urlp.query.login_with ) {
      req.authenticate([urlp.query.login_with], function(error, authenticated) {
        if( error ) {
          // Something has gone awry, behave as you wish.
          console.log( error );
          res.end();
      }
      else {
          if( authenticated === undefined ) {
            // The authentication strategy requires some more browser interaction, suggest you do nothing here!
      }
      else {
            // We've either failed to authenticate, or succeeded (req.isAuthenticated() will confirm, as will the value of the received argument)
            next();
      }
      }
    });
      }
      else {
      next();
      }
      }
};

  
function routes(app) {
  app.get ('/logout', function(req, res, params) {
    req.logout();
    res.writeHead(303, { 'Location': "/" });
    res.end('');
  })

  app.get(/.*/, function(req, res, params) {
    res.writeHead(200, {'Content-Type': 'text/html'})
    if( req.isAuthenticated() ) {
      res.end( authenticatedContent.replace("#USER#", JSON.stringify( req.getAuthDetails().user )  ) );
    }
    else {
      res.end( unAuthenticatedContent.replace("#PAGE#", req.url) );
    }
  })
}

var server= connect.createServer( 
                      connect.static(__dirname + '/public'),
                      connect.cookieParser(), 
                      connect.session({secret: 'FlurbleGurgleBurgle', 
                                       store: new connect.session.MemoryStore({ reapInterval: -1 }) }),
                      connect.bodyParser() /* Only required for the janrain strategy*/,
                      connect.compiler({enable: ["sass"]}),
                      auth( [
                            auth.Anonymous(),
                            auth.Basic({validatePassword: validatePasswordFunction}),
                            auth.Digest({getSharedSecretForUser: getSharedSecretForUserFunction}),
                            auth.Http({validatePassword: validatePasswordFunction, getSharedSecretForUser: getSharedSecretForUserFunction}),
                            auth.Never(),
                            auth.Twitter({consumerKey: twitterConsumerKey, consumerSecret: twitterConsumerSecret}),
                            auth.Facebook({appId : fbId, appSecret: fbSecret, scope: "email", callback: fbCallbackAddress, failedUri: '/auth/facebook_failed'}),
                            auth.Github({appId : ghId, appSecret: ghSecret, callback: ghCallbackAddress}),
                            auth.Yahoo({consumerKey: yahooConsumerKey, consumerSecret: yahooConsumerSecret, callback: yahooCallbackAddress}),
                            auth.Google({consumerKey: googleConsumerKey, consumerSecret: googleConsumerSecret, scope: "", callback: googleCallbackAddress}),
                            auth.Foursquare({appId: foursquareId, appSecret: foursquareSecret, callback: foursquareCallbackAddress}),
                            auth.Janrain({apiKey: janrainApiKey, appDomain: janrainAppDomain, callback: janrainCallbackUrl})
                            ]), 
                      example_auth_middleware(),      
                      connect.router(routes));
server.listen(80);
