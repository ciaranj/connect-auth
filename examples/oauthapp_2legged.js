var connect = require('connect');   
var auth= require('../lib');
var url= require('url');
var OAuthDataProvider= require('./in_memory_oauth_data_provider').OAuthDataProvider;
function routes(app) {
  app.get ('/fetch/unicorns', function(req, res, params) {
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
  });
}

var server= connect.createServer( 
                      connect.bodyParser(),
                      auth( [
                            auth.Oauth({oauth_provider: new OAuthDataProvider({  applications:[{title:'Test', description:'Test App', consumer_key:"JiYmll7CX3AXDgasnnIDeg",secret:"mWPBRK5kG2Tkthuf5zRV1jYWOEwnjI6xs3QVRqOOg"}]}),
                                        authenticate_provider: null,
                                        authorize_provider: null,
                                        authorization_finished_provider: null
                                       })
                            ]), 
                      connect.router(routes));
server.listen(3000);
