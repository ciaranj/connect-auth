var connect = require('connect');   
var MemoryStore = require('connect/middleware/session/memory');
var StrategyDefinition= require('../lib/strategyDefinition');
var Anonymous= require('../lib/auth.strategies/anonymous');
var Never= require('../lib/auth.strategies/never');
var auth= require('../lib/auth');

var sys= require('sys')
function helloWorld(req, res) {
   req.authenticate(['anon'], function(error, authenticated) { 
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
                      auth({"anon": new StrategyDefinition(Anonymous),
                            "never": new StrategyDefinition(Never)}), 
                      helloWorld)
       .listen(3000);