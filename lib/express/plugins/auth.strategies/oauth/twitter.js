var OAuth= require("./oauth").OAuth
var sys = require('sys'),
   http = require('http');
   
exports.Twitter= OAuth.extend({
   constructor: function(options){
     options.requestUrl= "http://twitter.com/oauth/request_token";
     options.accessUrl= "http://twitter.com/oauth/access_token";
     options.authorizeUrl= "http://twitter.com/oauth/authorize?oauth_token=";
     options.oauthVersion= "1.0";
     options.signatureMethod= "HMAC-SHA1";
     
     OAuth.prototype.constructor.call(this, options)
   },
   
   authenticate: function(request, callback) {     
     //todo: makw the call timeout ....
      this.getOAuthRequestToken(function(){});
       /*
     var google = http.createClient(80, 'twitter.com');
     var request = google.request('GET', authRequst, {'host': 'twitter.com'});
     request.addListener('response', function (response) {
       sys.puts('STATUS: ' + response.statusCode);
       sys.puts('HEADERS: ' + JSON.stringify(response.headers));
       response.setEncoding('utf8');
       response.addListener('data', function (chunk) {
         sys.puts('BODY: ' + chunk);
       });
     });
     request.end();
    
            */
    // request.redirect(this._getUrl())
//     this.fail(callback);
   }
   
});