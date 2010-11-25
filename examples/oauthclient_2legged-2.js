var sys= require('sys')

var OAuth= require('oauth').OAuth;

var oa= new OAuth("http://localhost:3000/oauth/request_token",
                  "http://localhost:3000/oauth/access_token",
                  "JiYmll7CX3AXDgasnnIDeg",
                  "mWPBRK5kG2Tkthuf5zRV1jYWOEwnjI6xs3QVRqOOg",
                  "1.0",
                  null,
                  "HMAC-SHA1");

exports.test = function(err){
	oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
	  if(error){
	    sys.puts('ERROR: Test1 Failed. Could not get the request token. ' + sys.inspect(error));
	  }else { 
	    sys.puts('oauth_token :' + oauth_token);
	    sys.puts('oauth_token_secret :' + oauth_token_secret);
	    sys.puts('requestoken results :' + sys.inspect(results));
	    sys.puts("Requesting access token")
	    oa.getOAuthAccessToken(oauth_token, oauth_token_secret, function(error, oauth_access_token, oauth_access_token_secret, results2) {
	      if(error){
	        sys.puts('ERROR: Test1 Failed. Could not get the access token. ' + sys.inspect(error));
	      }else{
	        sys.puts('oauth_access_token :' + oauth_access_token);
	        sys.puts('oauth_token_secret :' + oauth_access_token_secret);
	        sys.puts('accesstoken results :' + sys.inspect(results2));
	        sys.puts("Requesting access token");
	        var data= "";
	        oa.getProtectedResource("http://localhost:3000/fetch/unicorns", "GET", oauth_access_token, oauth_access_token_secret,  function (error, data, response) {
	          if(!error){
	            sys.puts(data);
				sys.puts(false, '√ Test Succeeded!');	
	          }else{
	            sys.puts('ERROR: Test Failed. Could not get the protected resource. '+ sys.inspect(error));
	          }
	        });
	      }
	    });
	  }
	});
}


this.test(null);