/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * Based *HEAVILY* on the work of  Christian Amor Kvalheim <christkv@gmail.com>
 * 
 * MIT Licensed
 */
var authutils= require('../lib/auth.strategies/_authutils')   
/**
  All methods must be implemented for the system to work
  This is an example, not even close to production ready in-memory example
  of what one would need to provide in order to support an OAuth backend
**/
var OAuthDataProvider = exports.OAuthDataProvider = function( options ) {
  if(!options) options= {};
  this.oauth_applications= options['applications'] || [];
  this.oauth_users_request_tokens= [];
} 

function generateRandomString() {
  return authutils.getNonce(32);
}

/**
  Locating methods used for looking up authentication information
**/
OAuthDataProvider.prototype.previousRequestToken = function(token, callback) {
/*  var self = this;
  self.db.collection('oauth_previous_users_request_tokens', function(err, collection) {
    collection.findOne({'token':token}, function(err, token) {
      token != null ? callback(new Error("Previously used token"), null) : callback(null, token);
    });
  });*/
}

OAuthDataProvider.prototype.tokenByConsumer = function(consumerKey, callback) {
/*   this.db.collection('oauth_users_request_tokens', function(err, collection) {
     collection.findOne({'consumer_key':consumerKey}, function(err, token) {
       token == null ? callback(new Error("No suck token"), null) : callback(null, token);
     });
   });*/
   
}

OAuthDataProvider.prototype.applicationByConsumerKey = function(consumerKey, callback) {
  for(var key in this.oauth_applications) {
    if( this.oauth_applications[key] && this.oauth_applications[key].consumer_key == consumerKey ) {
      callback(null, this.oauth_applications[key]);
      return;
    }
  }
  callback(new Error("No such user with consumer key: "+ consumerKey));
  
/*  this.db.collection('oauth_applications', function(err, collection) {
    collection.findOne({'consumer_key':consumerKey}, function(err, user) {
      user != null ? callback(null, user) : callback(new Error("No such user with consumer key: " + consumerKey), null);
    });
  });*/
}

OAuthDataProvider.prototype.fetchAuthorizationInformation = function(username, token, callback) {
/*  var self = this;
  
  // 
  // Create Serial flow for simplifier feeding chaining the functions
  //
  var fetchApplicationAndUser = new simplifier.SerialFlow(
    function(callback) {
      self.db.collection('oauth_users_request_tokens', function(err, requestCollection) {
        requestCollection.findOne({'token':token}, function(err, requestDoc) {
          callback(err, requestDoc);
        })
      });
    }, 
    
    function(err, requestDoc, callback) {
      // Use the request to fetch the associated user
      self.db.collection('users', function(err, userCollection) {
        userCollection.findOne({'username':requestDoc.username}, function(err, userDoc) {
          callback(err, requestDoc, userDoc);
        });
      });      
    }
  );
  
  // 
  // Create Serial flow for simplifier feeding chaining the functions
  //
  var fetchAllParts = new simplifier.ParallelFlow(
    // Fetch the application object
    function(callback) {
      // locate consumer key by token
      self.db.collection('oauth_users_request_tokens', function(err, requestCollection) {
        requestCollection.findOne({'token':token}, function(err, requestDoc) {
          // Fetch the application
          self.db.collection('oauth_applications', function(err, applicationCollection) {
            applicationCollection.findOne({'consumer_key':requestDoc.consumer_key}, function(err, oauthApplicationDoc) {
              callback(err, oauthApplicationDoc);
            });
          });
        })
      });
    },    
    // Fetches the application and user document
    fetchApplicationAndUser
  )
  
  //
  //  Execute all the functions and feed results into final method
  //  
  new simplifier.Simplifier().execute(
    // Execute flow
    fetchAllParts,    
    // All results coming back are arrays function1 [err, doc] function2 [err, doc1, doc2]
    function(oauthApplicationDocResult, userDocResult) {          
      callback(null, oauthApplicationDocResult[1], userDocResult[1]);
    }
  );   */   
}

/**
  Validation methods used to check if the tokens and user are valid
**/
OAuthDataProvider.prototype.validToken = function(accessToken, callback) {
/*  this.db.collection('oauth_users_request_tokens', function(err, collection) {
    collection.findOne({'access_token':accessToken}, function(err, token) {
      token == null ? callback(new Error("No suck token"), null) : callback(null, token);
    });
  });*/
}

/**
  Fetch a token by token and verifier (can be used to verify if a token exists)
**/
OAuthDataProvider.prototype.tokenByTokenAndVerifier = function(token, verifier, callback) {
/*  var self = this;
  
  self.db.collection('oauth_users_request_tokens', function(err, collection) {
    collection.findOne({'token':token, 'verifier':verifier}, function(err, token) {
      token != null ? callback(err, token) : callback(new Error("No token containing token: " + token + " and verifier: " + verifier), null);
    })
  });*/
}

OAuthDataProvider.prototype.validateNotReplay = function(accessToken, timestamp, nonce, callback) {
//  callback(null, true);
}

/**
  Fetch user id based on token (used to identify user in oauth calls later)
**/
OAuthDataProvider.prototype.userIdByToken = function(token, callback) {
/*  var self = this;    

  self.db.collection('oauth_users_request_tokens', function(err, collection) {
    collection.findOne({'access_token':token}, function(err, tokenEntry) {
      callback(null, {id:tokenEntry.username});
    });
  });  */
}

OAuthDataProvider.prototype.authenticateUser = function(username, password, oauthToken, callback) {
/*  var self = this;    
  
  self.db.collection('users', function(err, collection) {
    var encodedPassword = MD5.hex_md5(password);
    collection.findOne({'username':username, 'password':encodedPassword}, function(err, user) {      
      if(user != null) {
        // Update the oauthToken document to signal that key is authenticated
        self.db.collection('oauth_users_request_tokens', function(err, collection) {
          collection.findOne({'token':oauthToken}, function(err, tokenEntry) {
            tokenEntry.authenticated = true;
            collection.save(tokenEntry, function(err, doc) {
              callback(null, doc);
            });
          });
        });
      } else {
        callback(new Error("Authentication of user/password failed"), null);
      }
    });
  });  */
}

/**
  Associate an application token request with a system user after the user has authenticated, allows for authorization later
**/
OAuthDataProvider.prototype.associateTokenToUser = function(username, token, callback) {
/*  var self = this;    
  self.db.collection('users', function(err, collection) {
    collection.findOne({'username':username}, function(err, user) {
      // Locate the token
      self.db.collection('oauth_users_request_tokens', function(err, requestCollection) {
        requestCollection.findOne({'token': token}, function(err, requestTokenDoc) {
          requestTokenDoc['username'] = username;
          requestCollection.save(requestTokenDoc, callback);
        });
      });
    });
  });*/
}

/**
  Generation methods used to create new tokens for the oauth interface
**/  
OAuthDataProvider.prototype.generateRequestToken = function(oauthConsumerKey, oauthCallback, callback) {
   var requestToken= {};
   requestToken['consumer_key']= oauthConsumerKey;
   requestToken['token']= generateRandomString();
   requestToken['token_secret']= generateRandomString();
   requestToken['callback']= oauthCallback;
   requestToken['verifier']= generateRandomString();
   this.oauth_users_request_tokens[this.oauth_users_request_tokens.length++]= requestToken;
   callback(null, requestToken);
/*  this.db.collection('oauth_users_request_tokens', function(err, collection) {
    // Save the entry, Generate a request token and token secret
    collection.save({'consumer_key':oauthConsumerKey , 'token':new mongo.ObjectID().toHexString(), 'token_secret':new mongo.ObjectID().toHexString(), 'callback':oauthCallback, 'verifier':new mongo.ObjectID().toHexString()}, function(err, doc) {
      callback(null, doc);
    });
  }); */
}

OAuthDataProvider.prototype.generateAccessToken = function(oauthToken, callback) {
/*  var self = this;
  this.db.collection('oauth_users_request_tokens', function(err, collection) {
    // Generate access token
    collection.findOne({'token':oauthToken}, function(err, tokenObject) {
      tokenObject['access_token'] = new mongo.ObjectID().toHexString();
      collection.save(tokenObject, function(err, doc) {
        // Remove the id from the doc (so we can reuse the document)
        doc['_id'] = null;          
        // Save the freshly minted access token to the list of used tokens
        self.db.collection('oauth_previous_users_request_tokens', function(err, collection) {
          collection.save(doc, function(err, doc) {
            callback(null, doc);
          });
        });
      });
    });
  }); */
}

/**
  Ensures that we avoid multiple entries for tokens
**/
OAuthDataProvider.prototype.cleanRequestTokens = function(consumerKey, callback) {
  for(var key in this.oauth_users_request_tokens) {
    if( this.oauth_users_request_tokens[key] && this.oauth_users_request_tokens[key].consumer_key == consumerKey ) {
      delete this.oauth_users_request_tokens[key];
    }
  }
  callback(null, null);
  
/*  this.db.collection('oauth_users_request_tokens', function(err, collection) {
    collection.remove({'consumer_key':consumerKey}, function(err, collection) {
      callback(null, null);
    });
  }); */
}