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
use(Auth, {strategies: [{"anon" : new Anonymous(),
                        "never" : new Never(),
                        "http" : new Http({getPasswordForUser: getPasswordForUserFunction}),
                        "basic" : new Basic({getPasswordForUser: getPasswordForUserFunction}),
                        "digest" : new Digest({getPasswordForUser: getPasswordForUserFunction})}
                        ]})


get('/anon', function() {
  var self=this;
  self.authenticate(['anon'], function(error, authenticated) { 
    self.status(200)  
    self.respond("<h1>Hello! Full anonymous access</p>")
  });
})

get('/digest', function() {
  var self=this;
  self.authenticate(['digest'], function(error, authenticated) { 
    self.status(200)  
    self.respond("<h1>Hello! My little digestive"+ self.session.auth.user.username+ "</h1>"  + "<p>" + (self.session.counter++) +"</p>")
  });
})

get('/', function() {
  var self=this;
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