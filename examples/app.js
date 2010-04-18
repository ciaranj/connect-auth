var kiwi= require('kiwi');
var sys= require('sys');

kiwi.require('express') 
require('express/plugins')
global.merge(require('../lib/express/plugins/auth'));

var getPasswordForUserFunction= function(user,  callback) {
  var result;
  if( user == 'foo' ) result= 'bar';
  callback(null, result);
}

use(Cookie)
use(Session, { lifetime: (150).seconds, reapInterval: (10).seconds })

var StrategyDefinition= require('../lib/express/plugins/strategyDefinition').StrategyDefinition;
use(Auth, {strategies:{"anon": new StrategyDefinition(Anonymous),
                       "never": new StrategyDefinition(Never),
                       "twitter": new StrategyDefinition(Twitter, {consumerKey: "TOqGJsdtsicNz4FDSW4N5A", consumerSecret: "CN15nhsuAGQVGL3MDAzfJ3F5FFhp1ce9U4ZbaFZrSwA"}),
                       "http": new StrategyDefinition(Http, {getPasswordForUser: getPasswordForUserFunction}),
                       "basic": new StrategyDefinition(Basic, {getPasswordForUser: getPasswordForUserFunction}),
                       "digest": new StrategyDefinition(Digest, {getPasswordForUser: getPasswordForUserFunction})}})

get ('/twitter', function() {
  var self=this;
  self.logout();
  self.authenticate(['twitter'], function(error, authenticated) { 
    self.status(200)  
    self.respond("<h1>Hello! Twitter authenticated user</p>")
  });
  
})
get('/anon', function() {
  var self=this;
  self.logout();
  self.authenticate(['anon'], function(error, authenticated) { 
    self.status(200)  
    self.respond("<h1>Hello! Full anonymous access</p>")
  });
})

get('/digest', function() {
  var self=this;
  self.logout();
  self.authenticate(['digest'], function(error, authenticated) { 
    self.status(200)  
    self.respond("<h1>Hello! My little digestive"+ self.session.auth.user.username+ "</h1>"  + "<p>" + (self.session.counter++) +"</p>")
  });
})

get('/', function() {
  var self=this;
  self.logout();
  self.authenticate(['never', 'digest', 'anon'], function(error, authenticated) { 
    if( authenticated ) {
      if( ! self.session.counter ) self.session.counter= 0;
      self.status(200)  
      self.respond("<h1>Hello!"+ self.session.auth.user.username+ "</h1>"  + "<p>" + (self.session.counter++) +"</p>")
    }
    else {
      self.status(200)  
      self.respond("<h1>Who are you, you seem to be un-authenticateable</h1>")
    }
  });
})
run();