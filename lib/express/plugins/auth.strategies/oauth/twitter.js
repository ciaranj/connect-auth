var OAuth= require("./oauth").OAuth
var sys = require('sys'),
   http = require('http');

get('/oauth_callback', function() {
  var self= this;
  this.authenticate(['twitter'], function(error, authenticated) { 
    self.status(200)  
    self.respond("<h1>Hello! Twitter authenticated user</p>")
  });
});
   
exports.Twitter= OAuth.extend({
   constructor: function(options){
     options.requestUrl= "http://twitter.com/oauth/request_token";
     options.accessUrl= "http://twitter.com/oauth/access_token";
     options.authorizeUrl= "http://twitter.com/oauth/authenticate?oauth_token=";
     options.oauthVersion= "1.0";
     options.signatureMethod= "HMAC-SHA1";
     
     OAuth.prototype.constructor.call(this, options)
   },
   authenticate: function(request, callback) {     
     //todo: makw the call timeout ....
     var self= this; 
     if( request.param("oauth_token") && request.session.auth["oauth_token_secret"] ) {
       this.getOauthAccessToken(request.param("oauth_token"), request.session.auth["oauth_token_secret"],
                                function( error, oauth_token, oauth_token_secret, additionalParameters ) {
                                  if( error ) calback(null);
                                  else {
                                    request.session.auth["oauth_token_secret"]= oauth_token_secret;
                                    request.session.auth["oauth_token"]= oauth_token;
                                    var user= { user_id: additionalParameters.user_id,
                                               username: additionalParameters.screen_name }
                                               
                                               self.executionResult.user= user;
                                               
                                               // Need to sort out redirection proeprly
                                               //TODO: sort out the redirect to original url (currently tis a mess )   
                                               request.redirect("/twitter")
                                               self.halt(callback);
                                               //self.success(user, callback)
                                  }
                                });
     }
     else {
        this.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, additionalParameters ) {
          if(error) {
            callback(null); // Ignore the error upstream, treat as validation failure.
          } else {
            request.session.auth["oauth_token_secret"]= oauth_token_secret;
            request.redirect( self._authorizeUrl+ oauth_token );
          }
        });
      }
   }
   
});