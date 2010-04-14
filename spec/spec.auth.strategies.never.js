describe 'Express'
  before_each
    AuthStrategy= require('express/plugins/auth.strategy.base').AuthStrategy
    Never= require('express/plugins/auth.strategies/never').Never
  end
  describe 'Auth'
    describe 'Never'
      describe 'when authenticated'
        it 'should not pass back a user object'
          var never= new Never();
          var u
          never.authenticate( null, function(error, user) {
            u=user;
          });
          u.should_be undefined
        end
      end
    end
  end
end