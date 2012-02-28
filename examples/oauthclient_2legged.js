var sys= require('sys')

var OAuth= require('oauth').OAuth;

var oa= new OAuth("http://localhost:3000/oauth/request_token",
                  "http://localhost:3000/oauth/access_token",
                  "JiYmll7CX3AXDgasnnIDeg",
                  "mWPBRK5kG2Tkthuf5zRV1jYWOEwnjI6xs3QVRqOOg",
                  "1.0",
                  null,
                  "HMAC-SHA1");

OAuth.prototype.makeSignedRequest = function(oauth_token, oauth_token_secret, method, url, extra_params, post_body, post_content_type,  callback){
                                      this._performSecureRequest(oauth_token, oauth_token_secret, method, url, extra_params, post_body, post_content_type,  callback );
                                    };
exports.test = function(err){
	oa.makeSignedRequest("", null, "GET", "http://localhost:3000/fetch/unicorns", null, null, null, function (error, data, response) {
	  if(error!=null){
	    sys.puts(false, 'ERROR: Test  Failed. Got an error while processing oAuth data: ' + sys.inspect(error));
	  }else{
	    sys.puts(false, '√ Test Succeeded!');	
	    //sys.puts('response: '+sys.inspect(response));
		sys.puts('Test2 - data: '+sys.inspect(data));
	  }
	  
	});	
}


this.test(null);
