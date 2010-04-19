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
   }   
});