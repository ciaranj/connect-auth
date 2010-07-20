var connect = require('connect');   
var MemoryStore = require('connect/middleware/session/memory');
var StrategyDefinition= require('../lib/strategyDefinition');
var auth= require('../lib/auth');
var Anonymous= require('../lib/auth.strategies/anonymous');
var Never= require('../lib/auth.strategies/never');
var Basic= require('../lib/auth.strategies/http/basic')
var Digest= require('../lib/auth.strategies/http/digest')
var Http= require('../lib/auth.strategies/http/http')
var Twitter= require('../lib/auth.strategies/twitter')
var Github = require('../lib/auth.strategies/github')
var Facebook= require('../lib/auth.strategies/facebook') 
var Yahoo = require('../lib/auth.strategies/yahoo')
var Janrain = require('../lib/auth.strategies/janrain')
var Foursquare = require('../lib/auth.strategies/foursquare')

var twitterConsumerKey= "";
var twitterConsumerSecret= "";

var ghId= "";
var ghSecret= "";
var ghCallbackAddress=""

var fbId= "";
var fbSecret= "";
var fbCallbackAddress="http://yourhost.com/auth/facebook_callback"

var yahooConsumerKey= "--";
var yahooConsumerSecret= "";
var yahooCallbackAddress= "http://yourhost.com/auth/yahoo_callback"

var foursquareConsumerKey= "";
var foursquareConsumerSecret= "";

var janrainApiKey= "";
var janrainAppDomain= "yourrpxnowsubdomain";
var janrainCallbackUrl= "http://localhost/auth/janrain_callback";

var sys= require('sys')  


var getPasswordForUserFunction= function(user,  callback) {
  var result;
  if( user == 'foo' ) result= 'bar';
  callback(null, result);
}



function helloWorld(req, res) {
   req.authenticate(['foursquare'], function(error, authenticated) { 
     if( authenticated ) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('hello world - AUTHENTICATED - ' + JSON.stringify(req.session.auth.user));
      } 
      else { 
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('hello world - un-authenticated');
      }
   });   
}

// Demonstrates janrain when embedded in link
function janrain(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'})
  if( req.isAuthenticated() )  {
    res.end("Signed in :  " + req.session.auth.user.email);
  }
  else {
    res.end("<a  href='https://yourrpxnowsubdomain.rpxnow.com/openid/v2/signin?foo=bar&token_url=http%3A%2F%2Flocalhost%2Fauth%2Fjanrain_callback'> Sign In </a>");
  }
}
var server= connect.createServer( connect.cookieDecoder(), 
                      connect.session({ store: new MemoryStore({ reapInterval: -1 }) }),
                      connect.bodyDecoder() /* Only required for the janrain strategy*/,
                      auth({"basic": new StrategyDefinition(Basic,{getPasswordForUser: getPasswordForUserFunction}),
                                     "github": new StrategyDefinition(Github, {appId : ghId, appSecret: ghSecret, callback: ghCallbackAddress}),
                                     "digest": new StrategyDefinition(Digest,{getPasswordForUser: getPasswordForUserFunction}),
                                     "yahoo": new StrategyDefinition(Yahoo, {consumerKey: yahooConsumerKey, consumerSecret: yahooConsumerSecret, callback: yahooCallbackAddress}),
                                     "facebook": new StrategyDefinition(Facebook, {appId : fbId, appSecret: fbSecret, scope: "email", callback: fbCallbackAddress}),
                                     "twitter": new StrategyDefinition(Twitter, {consumerKey: twitterConsumerKey, consumerSecret: twitterConsumerSecret}),
                                     "http": new StrategyDefinition(Http, {getPasswordForUser: getPasswordForUserFunction}),
                                     "foursquare" : new StrategyDefinition(Foursquare, {consumerKey: foursquareConsumerKey, consumerSecret: foursquareConsumerSecret}),
                                     "janrain": new StrategyDefinition(Janrain, {apiKey: janrainApiKey, 
                                                                                 appDomain: janrainAppDomain, 
                                                                                 callback: janrainCallbackUrl}),
                                     "anon": new StrategyDefinition(Anonymous),
                                     "never": new StrategyDefinition(Never)}), 
                       helloWorld
                      /*janrain*/);
       server.listen(80);