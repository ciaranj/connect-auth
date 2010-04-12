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
//use(Session, { dataStore: MongoDbStore, mongoDbName:'sessions_poop', lifetime: (15).seconds, reapInterval: (10).seconds })
//use(Session, { dataStore: MongoDbStore, mongoServerPort: 27017, mongoServerAddress: "127.0.0.1", mongoDbName:'sessions_poop', lifetime: (15).seconds, reapInterval: (10).seconds })
//use(Session, { dataStore: MongoDbStore, mongoServer:  new require('mongodb/connection').Server("127.0.0.1", 27017, {auto_reconnect: true}, {}) , lifetime: (15).seconds, reapInterval: (10).seconds })
use(Session, { lifetime: (150).seconds, reapInterval: (10).seconds })
use(BasicAuth, {getPasswordForUser: getPasswordForUserFunction} )

get('/', function() {
  var self=this;
  self.isAuthorized( function(error, authorized) { 
    if( authorized ) {
      if( ! self.session.counter ) self.session.counter= 0;
      self.status(200)  
      self.respond("<h1>Hello!"+ self.REMOTE_USER+ "</h1>"  + "<p>" + (self.session.counter++) +"</p>")
    }
  });
})
run();