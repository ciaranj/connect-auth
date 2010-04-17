describe 'Express'
  before_each
    Strategies= require('express/plugins/strategies').Strategies
    StrategyDefinition= require('express/plugins/strategyDefinition').StrategyDefinition
    AuthStrategy= require('express/plugins/auth.strategy.base').AuthStrategy
    
    MockStrategy= AuthStrategy.extend({ 
      authenticate: function() {}
    });
    MockStrategyB= AuthStrategy.extend({ 
      authenticate: function() {}
    });
  end
  describe 'Auth'
    describe 'Strategies'
      describe 'when constructed'
        describe 'with an option declaring a strategy definition'
          it 'should add that strategy to the list of available strategies'
            var strategies= new Strategies({'strategy1' : new StrategyDefinition(MockStrategy)});
            strategies.get( 'strategy1' ).should_be_an_instance_of MockStrategy
          end
        end
        describe 'with an option declaring an array of strategy definitions'
          it 'should add those strategies to the list of available strategies'
            var strategies= new Strategies({'strategy1' : new StrategyDefinition(MockStrategy),
                                            'strategy2' : new StrategyDefinition(MockStrategyB)});
            strategies.get( 'strategy1' ).should_be_an_instance_of MockStrategy
            strategies.get( 'strategy2' ).should_be_an_instance_of MockStrategyB
          end
        end
      end
      describe 'when add is called'
        describe 'with a label and a valid Strategy'
          it 'should add that strategy to the list of available strategies'
            var strategies= new Strategies();
            strategies.add( 'test', new StrategyDefinition(MockStrategy) )
            strategies.get( 'test' ).should_be_an_instance_of MockStrategy

            expect(function(){ strategies.get('xxx') }).to( throw_error )  
          end
        end
        describe 'with an object literal of strategy definitions'
          it 'should add those strategies to the list of available strategies'
            var strategies= new Strategies();
            strategies.add( {'strategy1' : new StrategyDefinition(MockStrategy),
                             'strategy2' : new StrategyDefinition(MockStrategyB)} )

            strategies.get( 'strategy1' ).should_be_an_instance_of MockStrategy
            strategies.get( 'strategy2' ).should_be_an_instance_of MockStrategyB

            expect(function(){ strategies.get('xxx') }).to( throw_error )  
          end
        end
        describe 'with an invalid strategy'
          it 'should raise an error'
            var strategies= new Strategies();
            expect(function(){ strategies.add('test', {} ) }).to( throw_error )
          end
        end
      end
      describe 'when clear is called'
        it 'shold remove any known strategies'
        var strategies= new Strategies();

        strategies.add( {'strategy1' : new StrategyDefinition(MockStrategy),
                         'strategy2' : new StrategyDefinition(MockStrategyB) } )
        
        strategies.get('strategy1').should_be_an_instance_of MockStrategy
        strategies.get('strategy2').should_be_an_instance_of MockStrategyB
        strategies.clear();
        expect(function(){ strategies.get('strategy1') }).to( throw_error )  
        expect(function(){ strategies.get('strategy2') }).to( throw_error )  
        end
      end
      describe 'when get is called'
        describe 'with an unknown strategy'
          it 'should raise an error'
            var strategies= new Strategies();
            expect(function(){ strategies.get('sdads') }).to( throw_error )  
          end
        end
        describe 'with a known strategy'
          it 'should return the strategy'
            var strategies= new Strategies();
            strategies.add( 'test', new StrategyDefinition(MockStrategy) )
            strategies.get( 'test' ).should_be_an_instance_of MockStrategy
          end
          it 'should always return new instances of the strategy'
            var strategies= new Strategies();
            strategies.add( 'test', new StrategyDefinition(MockStrategy) )
            var get1= strategies.get( 'test' )
            get1.should_be_an_instance_of MockStrategy
            var get2= strategies.get( 'test' )
            var get3= strategies.get( 'test' )
            ( ( get1 === get2) && (get1 === get3)  && (get2 === get3) ).should_be false
          end
        end
      end
    end
  end
end