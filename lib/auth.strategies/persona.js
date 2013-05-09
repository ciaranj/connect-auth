var  https= require('https')
   , querystring= require('querystring');
/*
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 *
 * Verification routines for mozilla persona.
 */
module.exports= function(options) {
  var that= {}
  var my= {}; 
  options= options || {};
  that.name= options.name || "persona";
  my.audience= options.audience || "";
  that.authenticate= function(request, response, callback) {
    var self= this;
    if(!request.body || !request.body.assertion) {
      this.trace( "No persona Assertion supplied." );
      this.fail(callback);
    } else {
      this.trace( "Verifying Assertion." );
      if( my.audience == "" ) {
        this.trace( "No persona audience configured." );
        this.fail(callback);
      }
      else {
        var vreq = https.request({host: "verifier.login.persona.org", path: "/verify", method: "POST"}, function(vres) {
            var body = "";
            vres.on('data', function(chunk) { body+=chunk; } )
                .on('end', function() {
                  try {
                    var verifierResp = JSON.parse(body);
                    var valid = verifierResp && verifierResp.status === "okay";
                    var email = valid ? verifierResp.email : null;
                    if (valid) {
                      self.trace("assertion verified successfully for email:", email);
                      self.success({"email":email}, callback);  
                    } else {
                      self.trace("failed to verify assertion:", verifierResp.reason);
                      self.fail()
                    }
                  } catch(e) {
                    // bogus response from verifier!
                    self.trace("non-JSON response from verifier: " + body);
                    self.fail( callback );
                  }
               });
          });
          vreq.setHeader('Content-Type', 'application/x-www-form-urlencoded');

          var data = querystring.stringify({
            assertion: request.body.assertion,
            audience: my.audience
          });

          vreq.setHeader('Content-Length', data.length);
          vreq.write(data);
          vreq.end();
        }
    }
  }
  return that;
};
