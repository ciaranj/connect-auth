/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 * 
 * Provides an OAuth 1.0A authentication strategy
 */
var connect= require("connect")
   ,OAuthServices= require('./_oauthservices').OAuthServices;
 
 /**
  * 
  * Initialize Oauth options.
  *
  * Options:
  *
  *   - request_token_url        'web path for the request token url endpoint, default: /oauth/request_token' (get/post)
  *   - authorize_url            'web path for the authorize form, default: /oauth/authorize' (get/post)
  *   - access_token_url         'web path for the access token url endpoint, default: /oauth/access_token' (get/post)
  *
  *   - authenticate_provider    'function to render a authentication form'
  *   - authorize_provider       'function to handle the authorization of the user and application'
  *
  *   - oauth_provider           'db instance providing needed authentication mechanisms'
  *   - oauth_protocol           'the protocol (http or https) that this oauth provider is being served from'
  *   - realm                    'realm for WWW-Authenticate header, default: oauth'
  *
  * @param  {hash} options
  * @api private
  **/
module.exports= function(options) {
  var that= {}
  options= options || {};
  that.name= options.name || "oauth";
  var my= {};
  
  // Ensure we have default values and legal options
  my['request_token_url']= options['request_token_url'] || '/oauth/request_token';
  my['authorize_url']=     options['authorize_url']     || '/oauth/authorize';
  my['access_token_url']=  options['access_token_url']  || '/oauth/access_token';
  my['oauth_protocol']=  options['oauth_protocol']  || 'http';
  my['realm']= options['realm'] || 'realm';
  my['realm']= my['realm'].replace("\"","\\\"");

  my['authenticate_provider']= options['authenticate_provider'];
  my['authorize_provider']= options['authorize_provider'];
  my['oauth_provider']= options['oauth_provider'];
  my['authorization_finished_provider']= options['authorization_finished_provider'];

  // Both authorize handler and oauth provider must be provided
  if(my['authenticate_provider'] == null) throw Error("No Authentication provider provided");
  if(my['authorize_provider'] == null) throw Error("No Authorization provider provided");
  if(!my['oauth_provider'] ) throw Error("No OAuth provider provided");
  if(my['authorization_finished_provider'] == null) throw Error("No finished authentication provider provided");

  // Set up the OAuth provider and data source
  my['oauth_service'] = new OAuthServices(my['oauth_provider']);

  that.authenticate= function(req, res, callback) {
      var self= this;
      my['oauth_service'].authorize(req, my['oauth_protocol'], function(error, result) {
         if( error ) {
           res.writeHead(error.statusCode, {'Content-Type': 'text/plain',
                                            'WWW-Authenticate': 'OAuth realm="'+my.realm+'"'})
           res.end(error.message);
           self.fail(callback);
         } 
         else {
           self.success(result, callback);
         }
      });
  }
  
  var requestTokenMethod= function(req, res) {
    my['oauth_service'].requestToken(req, my['oauth_protocol'], function(error, result) {
      if( error ) {
        res.writeHead(error.statusCode, {'Content-Type': 'text/plain'})
        res.end(error.message);
      }
      else {
        res.writeHead(200, {'Content-Type': 'text/plain'})
        res.end(["oauth_token=" + result["token"], "oauth_token_secret=" + result["token_secret"], "oauth_callback_confirmed=" + result["oauth_callback_confirmed"]].join("&"));
      }
    });
  }

  var accessTokenMethod= function(req, res) {
    my['oauth_service'].accessToken(req, my['oauth_protocol'], function(error, result) {
      if( error ) {
        res.writeHead(error.statusCode, {'Content-Type': 'text/plain'})
        res.end(error.message);
      }
      else {
        res.writeHead(200, {'Content-Type': 'text/plain'})
        res.end(["oauth_token=" + result["access_token"], "oauth_token_secret=" + result["token_secret"]].join("&"));
      }
    });
  }

  // Build the authentication routes required 
  that.setupRoutes= function(server) {
    server.use('/', connect.router(function routes(app){
      app.post(my['request_token_url'], requestTokenMethod);      
      app.get(my['request_token_url'], requestTokenMethod);
      app.post(my['access_token_url'], accessTokenMethod);      
      app.get(my['access_token_url'], accessTokenMethod);
    
      // Should render the form that allows users to authenticate themselves 
      app.get(my['authorize_url'], my['authenticate_provider'] );

      // Handles the post from the authentication form.
      app.post(my['authorize_url'], function(req, res) {
        var self = this;
        
        if(req.body['verifier'] == null) {
          my['oauth_service'].authenticateUser(req.body['username'], req.body['password'], req.body['oauth_token'], function(err, result) {                       
            if(err) { 
              // Delegate to the function of the user
              my.authorize_provider.call(self, err, req, res, false, {token:req.body['oauth_token']});
            } else {
              // Fetch the needed data
              my['oauth_service'].fetchAuthorizationInformation(req.body['username'], result.token, function(err, application, user) {
                // Signal callback about finish authorization
                my.authorize_provider.call(self, null, req, res, true, result, application, user);
              });
            }          
          });          
        } else {
          var oauth_token= req.body['oauth_token'];
          var verifier= req.body['verifier'];
          
          // Check if there is an entry for this token and verifier          
          my['oauth_service'].verifyToken(oauth_token, verifier, function(err, result) {
            if(err) {
              // Delegate to the function of the user
              my.authorize_provider.call(self, err, req, res, false, {token:oauth_token});              
            } else {
              if(result.callback != null && result.callback != "oob") {
                var callback = result.callback;
                // Correctly add the tokens if the callback has a ? allready
                var redirect_url = callback.match(/\?/) != null ? "&oauth_token=" + result.token + "&oauth_verifier=" + result.verifier : "?oauth_token=" + result.token + "&oauth_verifier=" + result.verifier;
                // Signal that a redirect is in order after finished process
                res.writeHead(303, { 'Location': result.callback + redirect_url });
                res.end('');
                
              } else {
                my.authorization_finished_provider.call(self, err, req, res, result);
              }             
            }
          });
        }
      }); 
    }));
  }  
  return that;
};
