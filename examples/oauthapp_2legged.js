var connect = require('connect');   
var auth= require('../lib');
var url= require('url');
var OAuthDataProvider= require('./in_memory_oauth_data_provider').OAuthDataProvider;

var app= connect();
app.use(connect.bodyParser())
   .use(connect.logger())
   .use(auth( [
         auth.Oauth({oauth_provider: new OAuthDataProvider({  applications:[{title:'Test', description:'Test App', consumer_key:"JiYmll7CX3AXDgasnnIDeg",secret:"mWPBRK5kG2Tkthuf5zRV1jYWOEwnjI6xs3QVRqOOg"}]}),
                     authenticate_provider: null,
                     authorize_provider: null,
                     authorization_finished_provider: null
                    })
         ]))
   .use ('/fetch/unicorns', function(req, res, params) {
     req.authenticate(['oauth'], function(error, authenticated) { 
         if( authenticated ) {
           res.writeHead(200, {'Content-Type': 'text/plain'})
           res.end('The unicorns fly free tonight');
         } 
         else {
           res.writeHead(401, {'Content-Type': 'text/plain'})
           res.end('Doubt you\'ll ever see this.');
         }
     });
   })
   .listen( 3000 );
