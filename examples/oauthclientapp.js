var connect = require('connect');   
var url= require('url')

// We let the example run without npm, by setting up the require paths
// so the node-oauth submodule inside of git is used.  You do *NOT*
// need to bother with this line if you're using npm ...
//require.paths.unshift('support')
var OAuth= require('oauth').OAuth;
var oa= new OAuth("http://localhost:3000/oauth/request_token",
                 "http://localhost:3000/oauth/access_token", 
                 "JiYmll7CX3AXDgasnnIDeg",  "mWPBRK5kG2Tkthuf5zRV1jYWOEwnjI6xs3QVRqOOg", 
                 "1.0A", "http://localhost:4000/oauth/callback", "HMAC-SHA1");       

var app= connect();
app.use(connect.logger())
   .use(connect.cookieParser("secret"))
   .use(connect.session())
   .use ('/oauth/callback', function(req, res, params) {
     var parsedUrl= url.parse(req.originalUrl, true);
     console.log(require('util').inspect(req.session))
     oa.getOAuthAccessToken(parsedUrl.query.oauth_token, req.session.oauth_token_secret, parsedUrl.query.oauth_verifier, 
       function(error, oauth_access_token, oauth_access_token_secret, results) {
         oa.getProtectedResource("http://localhost:3000/fetch/unicorns", "GET", oauth_access_token, oauth_access_token_secret, function(error, data){
           res.writeHead(200, {'Content-type': 'text/html'})
           res.end(data);
         })
       })
   })
   .use ('/', function(req, res, params) {
     oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
       console.log( error )
       req.session.oauth_token_secret= oauth_token_secret;
       console.log(require('util').inspect(req.session))

       res.writeHead(303, { 'Location': "http://localhost:3000/oauth/authorize?oauth_token=" + oauth_token });
       res.end('');
     });
   })
   .listen(4000);
