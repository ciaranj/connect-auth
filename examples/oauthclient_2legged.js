var OAuth= require('oauth').OAuth;

var oa= new OAuth("http://localhost:3000/oauth/request_token",
                  "http://localhost:3000/oauth/access_token",
                  "JiYmll7CX3AXDgasnnIDeg",
                  "mWPBRK5kG2Tkthuf5zRV1jYWOEwnjI6xs3QVRqOOg",
                  "1.0",
                  null,
                  "HMAC-SHA1")

oa.getProtectedResource("http://localhost:3000/fetch/unicorns", "GET", '', '',  function (error, data, response) {
    console.log(data);
});
