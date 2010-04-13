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
use(Session) 
//use(Session, { dataStore: MongoDbStore, mongoDbName:'sessions_poop', lifetime: (15).seconds, reapInterval: (10).seconds })
//use(Session, { dataStore: MongoDbStore, mongoServerPort: 27017, mongoServerAddress: "127.0.0.1", mongoDbName:'sessions_poop', lifetime: (15).seconds, reapInterval: (10).seconds })
//use(Session, { dataStore: MongoDbStore, mongoServer:  new require('mongodb/connection').Server("127.0.0.1", 27017, {auto_reconnect: true}, {}) , lifetime: (15).seconds, reapInterval: (10).seconds })
use(Session, { lifetime: (150).seconds, reapInterval: (10).seconds })
use(Auth, {getPasswordForUser: getPasswordForUserFunction} )


get('/', function() {
  var self=this;
  self.authenticate(function(error, authenticated) { 
    if( authenticated ) {
      if( ! self.session.counter ) self.session.counter= 0;
      self.status(200)  
      self.respond("<h1>Hello!"+ self.session.auth.REMOTE_USER+ "</h1>"  + "<p>" + (self.session.counter++) +"</p>")
    }
    else {
      self.status(200)  
      self.respond("<h1>Who are you, you seem to be un-authenticateable</h1>")
    }
  });
})
run();