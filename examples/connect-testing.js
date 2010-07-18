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

var sys= require('sys')  


var getPasswordForUserFunction= function(user,  callback) {
  var result;
  if( user == 'foo' ) result= 'bar';
  callback(null, result);
}



function helloWorld(req, res) {
   req.authenticate(['yahoo'], function(error, authenticated) { 
     if( authenticated ) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('hello world - AUTHENTICATED');
      } 
      else { 
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('hello world - un-authenticated');
      }
   });   
}

connect.createServer( connect.cookieDecoder(), 
                      connect.session({ store: new MemoryStore({ reapInterval: -1 }) }),
                      auth({"basic": new StrategyDefinition(Basic,{getPasswordForUser: getPasswordForUserFunction}),
                                     "github": new StrategyDefinition(Github, {appId : ghId, appSecret: ghSecret, callback: ghCallbackAddress}),
                                     "digest": new StrategyDefinition(Digest,{getPasswordForUser: getPasswordForUserFunction}),
                                     "yahoo": new StrategyDefinition(Yahoo, {consumerKey: yahooConsumerKey, consumerSecret: yahooConsumerSecret, callback: yahooCallbackAddress}),
                                     "facebook": new StrategyDefinition(Facebook, {appId : fbId, appSecret: fbSecret, scope: "email", callback: fbCallbackAddress}),
                                     "twitter": new StrategyDefinition(Twitter, {consumerKey: twitterConsumerKey, consumerSecret: twitterConsumerSecret}),
                                     "http": new StrategyDefinition(Http, {getPasswordForUser: getPasswordForUserFunction}),
                                     "anon": new StrategyDefinition(Anonymous),
                                     "never": new StrategyDefinition(Never)}), 
                      helloWorld)
       .listen(80);