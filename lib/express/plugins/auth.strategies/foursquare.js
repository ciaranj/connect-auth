var OAuth = require("oauth").OAuth,
    http   = require('http');

var sys = require('sys');
get('/auth/foursquare_callback', function() {
  var self= this;
  this.authenticate(['foursquare'], function(error, authenticated) {
    self.redirect( self.session['foursquare_redirect_url'] )
  });
});
   
exports.Foursquare = AuthStrategy.extend({
   constructor: function(options){
     AuthStrategy.prototype.constructor.call(this, options)
     
     this._oAuth= new OAuth("http://foursquare.com/oauth/request_token",
                            "http://foursquare.com/oauth/access_token", 
                            options.consumerKey,  options.consumerSecret, 
                            "1.0", null, "HMAC-SHA1");
   },
   authenticate: function(request, callback) {     
       //todo: makw the call timeout ....
       var self= this; 
       if( request.param("oauth_token") && request.session.auth["foursquare_oauth_token_secret"] ) {
          this._oAuth.getOauthAccessToken(request.param("oauth_token"), 
                                       request.session.auth["foursquare_oauth_token_secret"],
                                       function( error, oauth_token, oauth_token_secret, additionalParameters ) {
                                           if( error ) {
                                               require('sys').debug('error in foursquare');
                                               callback(null);
                                           } else {
                                               //require('sys').debug('oauth_token_secret: ' + oauth_token_secret);
                                               //require('sys').puts('REQUEST SESSION');
                                               //sys.puts(sys.inspect(request.session, true, null));
                                               request.session.auth["foursquare_oauth_token_secret"] = oauth_token_secret;
                                               request.session.auth["foursquare_oauth_token"]        = oauth_token;
                                               var user = { user_id: additionalParameters.user_id,
                                                            username: additionalParameters.screen_name 
                                               }
                                               self.executionResult.user= user; 
                                               self.success(user, callback)
                                           }
                                       });
       } else {
          this._oAuth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, oauth_authorize_url, additionalParameters ) {
              if (error) {
                callback(null); // Ignore the error upstream, treat as validation failure.
              } else {
                 request.session['foursquare_redirect_url']            = request.back;
                 request.session.auth["foursquare_oauth_token_secret"] = oauth_token_secret;
                 request.session.auth["foursquare_oauth_token"]        = oauth_token;
                 request.redirect( "http://foursquare.com/oauth/authorize?oauth_token=" + oauth_token );
              }
          });
       }
   }
});
