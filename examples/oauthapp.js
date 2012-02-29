var connect = require('connect');   
//var MemoryStore = require('connect/middleware/session/memory');
var auth= require('../lib');
var url= require('url');
var OAuthDataProvider= require('./in_memory_oauth_data_provider').OAuthDataProvider;

var renderAuthenticationForm= function(res, token, flash) {
  res.writeHead(200, {'Content-Type':'text/html'})
  var error= '';
  if( flash ) {
    error= '<h3>' + flash + '</h3>';
  }
  res.end('<html>                                              \n\
           <body>        \n\
           <h2>Login</h2> \n\
           '+error+' \n\
           <form method="post"> \n\
             <input type="hidden" name="oauth_token" value="'+token+'"/> \n\
             <table>            \n\
               <tr><td><label>User name</lable></td><td><input type="text" name="username"/></td></tr>    \n\
               <tr><td><label>Password</lable></td><td><input type="password" name="password"/></td></tr> \n\
             </table            \n\
             <div><input type="submit" value= "Authorize"/></div> \n\
           <form>                \n\
           </body>      \n\
          </html>');
};

var authenticateProvider= function(req, res) {
  var parsedUrl= url.parse(req.originalUrl, true);
  renderAuthenticationForm(res, parsedUrl.query.oauth_token );
};

/**
  Handle the post back from the oauth authentication session (here you can build additional leves such as
  handling authorization for the application)
**/
var authorizeProvider = function(err, req, res, authorized, authResults, application, user) {  
  var self = this;
    
  if(err) {
    renderAuthenticationForm(res, authResults.token, 'No such user or wrong password' );
  } else {
    res.writeHead(200, {'Content-Type':'text/html'})
    res.end('<html>                                              \n\
             <body>        \n\
             <h2>Login</h2> \n\
             <form method="post"> \n\
               <input type="hidden" name="oauth_token" value="'+authResults.token+'"/> \n\
               <input type="hidden" name="verifier" value="'+authResults.verifier+'"/> \n\
               <table>            \n\
                 <tr><td>Application Title</td><td>' + application.title + '</td></tr>    \n\
                 <tr><td>Application Description</td><td>' + application.description + '</td></tr>    \n\
                 <tr><td>User name</td><td>' + user.username + '</td></tr>    \n\
               </table            \n\
               <div><input type="submit" value= "Authorize"/></div> \n\
             <form>                \n\
             </body>      \n\
            </html>');
  }
};  
/**
  Handle the successful authentication and authorization
**/
var authorizationFinishedProvider = function(err, req, res, result) {

  res.writeHead(200, {'Content-Type':'text/html'})
  res.end('<html>                                              \n\
           <body>        \n\
           <h2>Authentication and Authorization Finished, Application can now access</h2> \n\
             <input type="hidden" name="oauth_token" value="'+result.token+'"/> \n\
             <input type="hidden" name="oauth_verifier" value="'+result.verifier+'"/> \n\
             <table>            \n\
               <tr><td>Token</td><td>' + result.token + '</td></tr>    \n\
               <tr><td>Verifier</td><td>' + result.verifier + '</td></tr>    \n\
             </table            \n\
           </body>      \n\
          </html>');
}

var app= connect();
app.use(connect.bodyParser())
   .use(connect.logger())
   .use(auth({strategies: [
         auth.Oauth({oauth_provider: new OAuthDataProvider({  applications:[{title:'Test', description:'Test App', consumer_key:"JiYmll7CX3AXDgasnnIDeg",secret:"mWPBRK5kG2Tkthuf5zRV1jYWOEwnjI6xs3QVRqOOg"}]
                                                            , users:[{username:'foo', password:'bar'}] }),
                     authenticate_provider: authenticateProvider,
                     authorize_provider: authorizeProvider,
                     authorization_finished_provider: authorizationFinishedProvider
                    })
             ],
             trace: true
   }))
   .use('/fetch/unicorns', function(req, res, params) {
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
   .listen(3000);