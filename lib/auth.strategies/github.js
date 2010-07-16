var OAuth2= require("oauth2").OAuth2,
    http = require('http'),
    URL = require('url');

get('/auth/github_callback', function() {
  var self= this;
  this.authenticate(['github'], function(error, authenticated) { 
    self.redirect( self.session['github_redirect_url'] )
  });
});
   
exports.Github= AuthStrategy.extend({
   constructor: function(options){
     AuthStrategy.prototype.constructor.call(this, options)
     this._oAuth= new OAuth2(options.appId,  options.appSecret,  "https://github.com/", "login/oauth/authorize", "login/oauth/access_token");
     this._redirectUri= options.callback;
     
     this.scope= options.scope || "";
   },
   
   authenticate: function(request, callback) {     
     //todo: makw the call timeout ....
     var self= this; 
     if( request.param("code") ) {
       this._oAuth.getOAuthAccessToken(request.param("code"), 
                                      {redirect_uri: self._redirectUri}, function( error, access_token, refresh_token ){
                                        if( error ) callback(error)
                                        else {
                                          request.session["access_token"]= access_token;
                                          if( refresh_token ) request.session["refresh_token"]= refresh_token;
                                            self._oAuth.getProtectedResource("https://github.com/api/v2/json/user/show", request.session["access_token"], function (error, data, response) {
                                            if( error ) {
                                              self.fail(callback);
                                            }else {
                                              self.success(JSON.parse(data).user, callback)
                                            }
                                          })
                                        }
                                      });
     }
     else { 
        request.session['github_redirect_url']= request.back;
        var redirectUrl= this._oAuth.getAuthorizeUrl({redirect_uri : self._redirectUri, scope: this.scope })
        request.redirect( redirectUrl );
        self.halt(callback);
      }
   }
});