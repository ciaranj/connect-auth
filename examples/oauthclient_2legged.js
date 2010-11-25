var sys= require('sys')

var OAuth= require('../lib/oauth').OAuth;

var oa= new OAuth("http://localhost:3000/oauth/request_token",
                  "http://localhost:3000/oauth/access_token",
                  "key",
                  "secret",
                  "1.0",
                  null,
                  "HMAC-SHA1")

oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
  if(error) sys.puts('error :' + error)
  else { 
    sys.puts('oauth_token :' + oauth_token)
    sys.puts('oauth_token_secret :' + oauth_token_secret)
    sys.puts('requestoken results :' + sys.inspect(results))
    sys.puts("Requesting access token")
    oa.getOAuthAccessToken(oauth_token, oauth_token_secret, function(error, oauth_access_token, oauth_access_token_secret, results2) {
      sys.puts('oauth_access_token :' + oauth_access_token)
      sys.puts('oauth_token_secret :' + oauth_access_token_secret)
      sys.puts('accesstoken results :' + sys.inspect(results2))
      sys.puts("Requesting access token")
      var data= "";
      oa.getProtectedResource("http://localhost:3000/fetch/unicorns", "GET", oauth_access_token, oauth_access_token_secret,  function (error, data, response) {
          sys.puts(data);
      });
    });
  }
})
