var OAuth= require("oauth").OAuth,
    http = require('http');

get('/auth/yahoo_callback', function() {
  var self= this;
  this.authenticate(['yahoo'], function(error, authenticated) {
    self.redirect( self.session['yahoo_redirect_url'] )
  });
});
   
exports.Yahoo= AuthStrategy.extend({
   constructor: function(options){
     AuthStrategy.prototype.constructor.call(this, options)
     
     this._oAuth= new OAuth( "https://api.login.yahoo.com/oauth/v2/get_request_token",
                             "https://api.login.yahoo.com/oauth/v2/get_token", 
                             options.consumerKey,  options.consumerSecret, 
                             "1.0", options.callback, "HMAC-SHA1");
   },
   
   authenticate: function(request, callback) {     
     //todo: makw the call timeout ....
     var self= this; 
     if(    request.param("oauth_token")
         && request.param("oauth_verifier") 
         && request.session.auth["yahoo_oauth_token_secret"]
         && request.param("oauth_token") == request.session.auth["yahoo_oauth_token"] ) {
       
       this._oAuth.getOauthAccessToken(request.param("oauth_token"), request.session.auth["yahoo_oauth_token_secret"], request.param("oauth_verifier"),
                                function( error, oauth_token, oauth_token_secret, additionalParameters ) {
                                  if( error ) callback(null);
                                  else {
                                    self._oAuth.getProtectedResource("http://social.yahooapis.com/v1/user/" + additionalParameters.xoauth_yahoo_guid + "/profile?format=json", "GET", 
                                      oauth_token, oauth_token_secret, 
                                      function(error, data){
                                        if( error ) callback(null);
                                        var profile= JSON.parse(data).profile;
                                        request.session.auth["yahoo_oauth_token_secret"]= oauth_token_secret;
                                        request.session.auth["yahoo_oauth_token"]= oauth_token;
                                        self.success(profile, callback)
                                    });
                                  }
                                });
     }
     else { 
        this._oAuth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, oauth_authorize_url, additionalParameters ) {
          if(error) { 
            callback(null); // Ignore the error upstream, treat as validation failure.
          } else {
            request.session['yahoo_redirect_url']= request.back;
            request.session.auth["yahoo_oauth_token_secret"]= oauth_token_secret;
            request.session.auth["yahoo_oauth_token"]= oauth_token;
            request.redirect( "https://api.login.yahoo.com/oauth/v2/request_auth?oauth_token=" + oauth_token );
          }
        });
      }
   }
});