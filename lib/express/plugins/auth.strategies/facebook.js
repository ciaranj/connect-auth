var OAuth2= require("oauth2").OAuth2,
    http = require('http');

get('/facebook_callback', function() {
  var self= this;
  this.authenticate(['facebook'], function(error, authenticated) { 
//    self.respond(200,"xxxx")
    self.redirect("/facebook")
  });
});
   
exports.Facebook= AuthStrategy.extend({
   constructor: function(options){
     AuthStrategy.prototype.constructor.call(this, options)
     this._oAuth= new OAuth2(options.appId,  options.appSecret,  "https://graph.facebook.com");
     this.scope= options.scope || "";
   },
   
   authenticate: function(request, callback) {     
     //todo: makw the call timeout ....
     var self= this; 
     if( request.param("code") ) {
       this._oAuth.getOAuthAccessToken(request.param("code"), 
                                      {redirect_uri: "http://testtwitter.com:3000/facebook_callback" }, function( error, access_token, refresh_token ){
                                        if( error ) callback(error)
                                        else {
                                          request.session["access_token"]= access_token;
                                          if( refresh_token ) request.session["refresh_token"]= refresh_token;
                                            self._oAuth.getProtectedResource("https://graph.facebook.com/me", request.session["access_token"], function (error, data, response) {
                                            if( error ) {
                                              self.fail(callback);
                                            }else {
                                              self.success(JSON.parse(data), callback)
                                            }
                                          })
                                        }
                                      });
     }
     else { 
        var redirectUrl= this._oAuth.getAuthorizeUrl({redirect_uri : "http://testtwitter.com:3000/facebook_callback", scope: this.scope })
        request.redirect( redirectUrl );
        self.halt(callback);
      }
   }
});