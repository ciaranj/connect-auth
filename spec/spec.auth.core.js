describe 'Express'
  before_each
    reset()
    use(Cookie)
    use(Session)
    use(Basic= require('express/plugins/auth').Basic, {getPasswordForUser: function(error, callback) { callback(null, 'bar')} })
  end
  describe 'Auth'
    describe 'on'
      describe 'request'
        describe 'given no authorisation header'
          it 'should set auth provided false'
            var auth; 
             get('/', function(){ 
               auth= this.session.auth;  
             })
             get('/')
             auth.provided.should.eql( false )
           end
           it 'should set REMOTE_USER to be undefined'
             var remoteUser; 
              get('/', function(){ 
                remoteUser= this.session.auth.REMOTE_USER;  
              })
              get('/')
              remoteUser.should_be undefined
            end
           describe 'when a method requires authorization'
             it 'should set the WWW-Authenticate header'
               var auth; 
                get('/', function() { 
                  this.isAuthorized( function(error, authorized) { } )
                });
                var response= get('/', {})
                response.headers['www-authenticate'].should.eql "Basic realm=test"
                response.status.should.eql 401
                response.body.should.eql "Authorization Required"
              end
           end
         end
         describe 'given an invalid authorisation header'

          it 'should set auth provided false'
            var auth; 
            get('/', function(){ 
              auth= this.session.auth;
            })
            get('/', { headers: { authorization : "Basic Zm9vOsdsmJhcg==" } } )
            auth.provided.should.eql false
          end
          it 'should set REMOTE_USER to be undefined'
            var remoteUser;
            get('/', function(){ 
              remoteUser= this.session.auth.REMOTE_USER;  
            })
            get('/', { headers: { authorization : "Basic Zm9sdsdvOmJhcg==" } } )
            remoteUser.should_be undefined
          end
          
          it 'isAuthorized should pass back false' 
             var authed; 
              get('/', function() {
                var self=this; 
                this.isAuthorized(function(error, authorized) {
                                        authed= authorized})
              });
              var response= get('/', { headers: { authorization : "Basic Zm9vOmsdsdJhcg==" } } )
              authed.should_be false
          end
         end

         describe 'given a valid authorisation header'
           it 'should set auth provided true'
             var auth; 
              get('/', function(){ 
                auth= this.session.auth;
              })
              get('/', { headers: { authorization : "Basic Zm9vOmJhcg==" } } )
              auth.provided.should.eql( true )
            end
            it 'should set REMOTE_USER to be undefined'
              var remoteUser;
               get('/', function(){ 
                 remoteUser= this.session.auth.REMOTE_USER;  
               })
               get('/', { headers: { authorization : "Basic Zm9vOmJhcg==" } } )
               remoteUser.should_be undefined
            end
            describe 'when a method requires authorization'
              it 'should request the password for the given username from the getPasswordForUser callback' 
                 var user;
                  use(BasicAuth, {getPasswordForUser: function(u, callback) {
                                            user= u;
                                            callback(null,'bar')
                    }} )
                  get('/', function() {
                    this.isAuthorized(function(error, authorized) {})
                  });
                  var response= get('/', { headers: { authorization : "Basic Zm9vOmJhcg==" } } )
                  user.should.eql 'foo'
              end             
              describe 'and the getPasswordForUser function returns the expected password'
                before_each
                  use(BasicAuth, {getPasswordForUser: function(user, callback) { callback(null, 'bar')} } )
                end
                it 'should not set the WWW-Authenticate header' 
                   get('/', function() { 
                     this.isAuthorized( function(error, authorized) { } )
                   });
                   var response= get('/', { headers: { authorization : "Basic Zm9vOmJhcg==" } } )
                   response.headers['www-authenticate'].should_be undefined
                end
                it 'should set REMOTE_USER to be the passed credential\'s username' 
                   var remoteUser; 
                    get('/', function() {
                      var self=this; 
                      this.isAuthorized(function(error, authorized) {
                                              remoteUser= self.session.auth.REMOTE_USER})
                    });
                    var response= get('/', { headers: { authorization : "Basic Zm9vOmJhcg==" } } )
                    remoteUser.should.eql "foo"
                end
                it 'isAuthorized should pass back true' 
                   var authed; 
                    get('/', function() {
                      var self=this; 
                      this.isAuthorized(function(error, authorized) {
                                              authed= authorized})
                    });
                    var response= get('/', { headers: { authorization : "Basic Zm9vOmJhcg==" } } )
                    authed.should_be true
                end
              end
              
              describe 'and the onAuthorize function returns a mis-matching password'
                before_each
                  use(BasicAuth, {getPasswordForUser: function(error, callback) { callback(null, null)} }  )
                end
                it 'should set the WWW-Authenticate header' 
                   get('/', function() { 
                     this.isAuthorized( function(error, authorized) { } )
                   });
                   var response= get('/', { headers: { authorization : "Basic Zm9vOmJhcg==" } } )
                   response.headers['www-authenticate'].should_be "Basic realm=test"
                end
                it 'should set REMOTE_USER to be undefined' 
                   var remoteUser; 
                    get('/', function() {
                      var self=this; 
                      this.isAuthorized(function(error, authorized) {
                                              remoteUser= self.session.auth.REMOTE_USER})
                    });
                    var response= get('/', { headers: { authorization : "Basic Zm9vOmJhcg==" } } )
                    remoteUser.should_be undefined
                end
                it 'isAuthorized should pass back false' 
                   var authed; 
                    get('/', function() {
                      var self=this; 
                      this.isAuthorized(function(error, authorized) {
                                              authed= authorized})
                    });
                    var response= get('/', { headers: { authorization : "Basic Zm9vOmJhcg==" } } )
                    authed.should_be false
                end
              end
            end 
          end
      end
    end
  end
end