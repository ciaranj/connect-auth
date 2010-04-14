describe 'Express'
  before_each
    Strategies= require('express/plugins/strategies').Strategies
    MockStrategy= function(){ return {
      authenticate: function(){},
      isValid: function(){}
    }};
  end
  describe 'Auth'
    describe 'Strategies'
      describe 'when constructed'
        describe 'with an option declaring a strategy definition'
          it 'should add that strategy to the list of available strategies'
            var mockStrategyA= new MockStrategy
            var strategies= new Strategies({strategy:{'strategy1' : mockStrategyA} });
            strategies.get( 'strategy1' ).should.eql mockStrategyA
          end
        end
        describe 'with an option declaring an array of strategy definitions'
          it 'should add those strategies to the list of available strategies'
            var mockStrategyA= new MockStrategy
            var mockStrategyB= new MockStrategy
            var strategies= new Strategies({strategies:[{'strategy1' : mockStrategyA},
                                                        {'strategy2' : mockStrategyB}]});
            strategies.get( 'strategy1' ).should.eql mockStrategyA
            strategies.get( 'strategy2' ).should.eql mockStrategyB
          end
        end
      end
      describe 'when add is called'
        describe 'with a label and a valid Strategy'
          it 'should add that strategy to the list of available strategies'
            var strategies= new Strategies();
            var mockStrategy= new MockStrategy
            strategies.add( 'test', mockStrategy )

            strategies.get( 'test' ).should.eql mockStrategy
            strategies.get( 'xxx' ).should_be undefined
          end
        end
        describe 'with an array of strategy definitions'
          it 'should add those strategies to the list of available strategies'
            var strategies= new Strategies();
            var mockStrategyA= new MockStrategy
            var mockStrategyB= new MockStrategy

            strategies.add( [{'strategy1' : mockStrategyA},
                             {'strategy2' : mockStrategyB}] )

            strategies.get( 'strategy1' ).should.eql mockStrategyA
            strategies.get( 'strategy2' ).should.eql mockStrategyB
            strategies.get( 'xxx' ).should_be undefined
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
        var mockStrategyA= new MockStrategy
        var mockStrategyB= new MockStrategy

        strategies.add( [{'strategy1' : mockStrategyA},
                         {'strategy2' : mockStrategyB}] )
        strategies.get('strategy1').should_be mockStrategyA
        strategies.get('strategy2').should_be mockStrategyB
        strategies.clear();
        strategies.get('strategy1').should_be undefined
        strategies.get('strategy2').should_be undefined
        end
      end
      describe 'when get is called'
        describe 'with an unknown strategy'
          it 'should return undefined'
            var strategies= new Strategies();
            strategies.get('sdads').should_be undefined
          end
        end
        describe 'with a known strategy'
          it 'should return the strategy'
            var strategies= new Strategies();
            var mockStrategy= new MockStrategy
            strategies.add( 'test', mockStrategy )
            strategies.get( 'test' ).should.eql mockStrategy
          end
        end
      end
    end
  end
end