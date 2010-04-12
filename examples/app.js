var kiwi= require('kiwi');
var sys= require('sys');

kiwi.require('express') 
require('express/plugins')
global.merge(require('../lib/express/plugins/auth'));

use(Cookie) 

//use(Session, { dataStore: MongoDbStore, mongoDbName:'sessions_poop', lifetime: (15).seconds, reapInterval: (10).seconds })
//use(Session, { dataStore: MongoDbStore, mongoServerPort: 27017, mongoServerAddress: "127.0.0.1", mongoDbName:'sessions_poop', lifetime: (15).seconds, reapInterval: (10).seconds })
//use(Session, { dataStore: MongoDbStore, mongoServer:  new require('mongodb/connection').Server("127.0.0.1", 27017, {auto_reconnect: true}, {}) , lifetime: (15).seconds, reapInterval: (10).seconds })
use(Session, { lifetime: (150).seconds, reapInterval: (10).seconds })
use(Auth)

get('/', function() {
  if( this.isAuthorized() ) {
    if( ! this.session.counter ) this.session.counter= 0;
    return "<h1>Hello!"+ this.REMOTE_USER+ "</h1>"  + "<p>" + (this.session.counter++) +"</p>"
  }
})
run();