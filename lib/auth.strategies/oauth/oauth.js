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
  *   - oauth_data_provider           'db instance providing needed authentication mechanisms'
  *   - oauth_protocol           'the protocol (http or https) that this oauth provider is being served from'
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

  if(options['oauth_data_provider'] == null) throw Error("No OAuth provider provided");
  // Set up the OAuth provider and data source
  my['oauth_service'] = new OAuthServices(options['oauth_data_provider']);

  that.authenticate= function(request, response, callback) {
    this.fail(callback);
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
    }));
  }  
  return that;
};
