var kiwi= require('kiwi'),
    sys= require('sys')

kiwi.require('express') 
     require('express/plugins')
kiwi.seed('oauth')
var style = require('express/pages/style').style  
style+=  require('./style').style  

//require.paths.unshift(__dirname+ "/../lib/node-oauth/lib/")
var OAuth= require('oauth').OAuth;
var OAuth2= require('oauth2').OAuth2;

Object.merge(global, require('../lib/express/plugins/auth'));

var getPasswordForUserFunction= function(user,  callback) {
  var result;
  if( user == 'foo' ) result= 'bar';
  callback(null, result);
}

use(Cookie)
use(Logger)
use(Session, { lifetime: (150).seconds, reapInterval: (10).seconds })

// N.B. TO USE the facebook strategy you must specify these values correctly for your application.
var fbId= "";
var fbSecret= "";

var StrategyDefinition= require('../lib/express/plugins/strategyDefinition').StrategyDefinition;
use(Auth, {strategies:{"anon": new StrategyDefinition(Anonymous),
                       "never": new StrategyDefinition(Never),
                       "facebook": new StrategyDefinition(Facebook, {appId : fbId, appSecret: fbSecret, scope: "email"}),
                       "twitter": new StrategyDefinition(Twitter, {consumerKey: "TOqGJsdtsicNz4FDSW4N5A", consumerSecret: "CN15nhsuAGQVGL3MDAzfJ3F5FFhp1ce9U4ZbaFZrSwA"}),
                       "http": new StrategyDefinition(Http, {getPasswordForUser: getPasswordForUserFunction}),
                       "basic": new StrategyDefinition(Basic, {getPasswordForUser: getPasswordForUserFunction}),
                       "digest": new StrategyDefinition(Digest, {getPasswordForUser: getPasswordForUserFunction})}})

get ('/auth/twitter', function() {
  var self=this;
  self.authenticate(['twitter'], function(error, authenticated) { 
    if( authenticated ) {
      var oa= new OAuth("http://twitter.com/oauth/request_token",
                        "http://twitter.com/oauth/access_token",
                        "TOqGJsdtsicNz4FDSW4N5A",
                        "CN15nhsuAGQVGL3MDAzfJ3F5FFhp1ce9U4ZbaFZrSwA",
                        "1.0",
                        "HMAC-SHA1");
      oa.getProtectedResource("http://twitter.com/statuses/user_timeline.xml", "GET", self.session.auth["oauth_token"], self.session.auth["oauth_token_secret"],  function (error, data) {
        sys.p('got protected resource ')
          self.respond(200, "<html><h1>Hello! Twitter authenticated user ("+self.session.auth.user.username+")</h1>"+data+ "</html>")
      });
    }
    else {
      self.respond(200, "<html><h1>Twitter authentication failed :( </h1></html>")
    }
  });
})

get ('/auth/facebook', function() {
  var self=this;
  self.authenticate(['facebook'], function(error, authenticated) {
    if( authenticated ) {

      self.respond(200, "<html><h1>Hello Facebook user:" + JSON.stringify(  self.session.auth.user ) + ".</h1></html>")
    }
    else {
      self.respond(200, "<html><h1>Twitter authentication failed :( </h1></html>")
    }
  });
})

get('/auth/anon', function() {
  var self=this;
  self.authenticate(['anon'], function(error, authenticated) { 
    self.respond(200, "<html><h1>Hello! Full anonymous access</h1></html>")
  });
})

get('/auth/digest', function() {
  var self=this;
  self.authenticate(['digest'], function(error, authenticated) { 
    if( authenticated ) {
      if( ! self.session.counter ) self.session.counter= 0;
      self.respond(200, "<html><h1>Hello! My little digestive"+ self.session.auth.user.username+ "</h1>"  + "<p>" + (self.session.counter++) +"</p></html>")
    }
    else {
      self.respond(200, "<html><h1>should not be happening...</h1></html>")
    }
  });
})

get ('/logout', function() {
  this.logout();
  this.redirect("/")
})

get('/', function() {
  var self=this;
  if( !this.isAuthenticated() ) {
    self.respond(200, 
      '<html>                                              \n\
        <head>                                             \n\
          <title>Express Auth -- Not Authenticated</title> \n\
          ' + style + '                                    \n\
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
            <a href="/auth/twitter" style="border:0px">                \n\
            <img style="border:0px" src="http://apiwiki.twitter.com/f/1242697715/Sign-in-with-Twitter-darker.png"/>\n\
            </a>                                           \n\
          </div>                                           \n\
        </body>                                            \n\
      </html>')
  }
  else {
    self.respond(200, 
      '<html>                                              \n\
        <head>                                             \n\
          <title>Express Auth -- Authenticated</title>\n\
          ' + style + '                                    \n\
        </head>                                            \n\
        <body>                                             \n\
          <div id="wrapper">                               \n\
            <h1>Authenticated</h1>     \n\
            <h2><a href="/logout">Logout</a></h2>                \n\
          </div>                                           \n\
        </body>                                            \n\
      </html>')
  }
})

run();
