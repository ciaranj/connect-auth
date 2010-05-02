describe 'Express'
  before_each
    Digest= require('express/plugins/auth.strategies/http/digest').Digest
  end
  describe 'Auth'
    describe 'Digest Strategy'
      it 'should split a complex Authorization header into its constituent credentials parts'
        var mockHeader= "Digest username=foo, realm=\"test\", nonce=\"b343d03296358b5d7f985500568b\", uri=\"/\", response=\"52bc08c966a3b16bedb62f1b4a5b40f8\""

        var credentials= new Digest({})._splitAuthorizationHeader(mockHeader);
        credentials.username.should_be "foo"
        credentials.realm.should_be "test"
        credentials.nonce.should_be "b343d03296358b5d7f985500568b"
        credentials.uri.should_be "/"
        credentials.response.should_be "52bc08c966a3b16bedb62f1b4a5b40f8"
      end
    end
  end
end