describe 'Express'
  before_each
    OAuth= require('express/plugins/auth.strategies/oauth/oauth').OAuth
  end
  describe 'Auth'
    describe 'OAuth'
      it ' should test'
        var oa= new OAuth({
         requestUrl: "http://twitter.com/oauth/request_token",
         accessUrl: "http://twitter.com/oauth/access_token",
         authorizeUrl: "http://twitter.com/oauth/authorize?oauth_token=",
         oauthVersion: "1.0",
         signatureMethod: "HMAC-SHA1",
         consumerKey: "TOqGJsdtsicNz4FDSW4N5A", 
         consumerSecret: "CN15nhsuAGQVGL3MDAzfJ3F5FFhp1ce9U4ZbaFZrSwA"});
         
         oa.getOAuthRequestToken(function(){})
      end
      it 'should generate the signature base string described in http://oauth.net/core/1.0/#sig_base_example'
        var result= new OAuth({})._createSignatureBase("GET", "http://photos.example.net/photos", 
                                            "file=vacation.jpg&oauth_consumer_key=dpf43f3p2l4k3l03&oauth_nonce=kllo9940pd9333jh&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1191242096&oauth_token=nnch734d00sl2jdk&oauth_version=1.0&size=original")
        result.should.eql "GET&http%3A%2F%2Fphotos.example.net%2Fphotos&file%3Dvacation.jpg%26oauth_consumer_key%3Ddpf43f3p2l4k3l03%26oauth_nonce%3Dkllo9940pd9333jh%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1191242096%26oauth_token%3Dnnch734d00sl2jdk%26oauth_version%3D1.0%26size%3Doriginal"
      end
      describe 'HMAC-SHA1'
        it 'should produce the specified digest as described in http://oauth.net/core/1.0/#sig_base_example (A.5.2)'
          var SHA1= require('express/plugins/auth.strategies/oauth/sha1');
          var hash= SHA1.HMACSHA1( "kd94hf93k423kf44&pfkkdhi9sl3r4s00",
                         "GET&http%3A%2F%2Fphotos.example.net%2Fphotos&file%3Dvacation.jpg%26oauth_consumer_key%3Ddpf43f3p2l4k3l03%26oauth_nonce%3Dkllo9940pd9333jh%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1191242096%26oauth_token%3Dnnch734d00sl2jdk%26oauth_version%3D1.0%26size%3Doriginal")
          
          hash.should.eql ("tR3+Ty81lMeYAr/Fid0kMTYa/WM=")
        end
      end
    end
  end
end