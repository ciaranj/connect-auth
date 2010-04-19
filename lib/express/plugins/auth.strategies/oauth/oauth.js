var OAuth= require('oauth').OAuth;
        
exports.OAuth= AuthStrategy.extend({
   constructor: function(options){
     AuthStrategy.prototype.constructor.call(this, options)
     this._oAuth= new OAuth(options.requestUrl, options.accessUrl, options.authorizeUrl, 
                            options.consumerKey,  options.consumerSecret, options.oauthVersion, options.signatureMethod);
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
            request.redirect( oauth_authorize_url );
          }
        });
      }
   }

});
