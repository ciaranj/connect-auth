describe 'Express'
  before_each
    AuthStrategy= require('express/plugins/auth.strategy.base').AuthStrategy
  end
  describe 'Auth'
    describe 'Base Strategy'
      it 'should return nonces of the requested size correctly'
        var as= new AuthStrategy();
        as._getNonce(1).length.should_be 1
        as._getNonce(2).length.should_be 2
        as._getNonce(5).length.should_be 5
        as._getNonce(10).length.should_be 10
        as._getNonce(100).length.should_be 100
        as._getNonce(1000).length.should_be 1000
      end
    end
  end
end