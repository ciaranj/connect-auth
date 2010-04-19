var OAuth= require("oauth").OAuth,
    http = require('http');

get('/oauth_callback', function() {
  var self= this;
  this.authenticate(['twitter'], function(error, authenticated) { 
    self.status(200)  
    self.respond("<h1>Hello! Twitter authenticated user</p>")
  });
});
   
exports.Twitter= AuthStrategy.extend({
   constructor: function(options){
     AuthStrategy.prototype.constructor.call(this, options)
     
     this._oAuth= new OAuth("http://twitter.com/oauth/request_token",
                            "http://twitter.com/oauth/access_token", 
                            "http://twitter.com/oauth/authenticate?oauth_token=", 
                            options.consumerKey,  options.consumerSecret, 
                            "1.0", "HMAC-SHA1");
   },
   
   authenticate: function(request, callback) {     
     //todo: makw the call timeout ....
     var self= this; 
     if( request.param("oauth_token") && request.session.auth["oauth_token_secret"] ) {
       this._oAuth.getOauthAccessToken(request.param("oauth_token"), request.session.auth["oauth_token_secret"],
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
        this._oAuth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, oauth_authorize_url, additionalParameters ) {
          if(error) {
            callback(null); // Ignore the error upstream, treat as validation failure.
          } else {
            request.session.auth["oauth_token_secret"]= oauth_token_secret;
            request.session.auth["oauth_token"]= oauth_token;
            request.redirect( oauth_authorize_url );
          }
        });
      }
   }
});