/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * Based heavily on the work of Christian Amor Kvalheim <christkv@gmail.com>
 * 
 * MIT Licensed
 */
var  url= require('url')
   , authutils= require('../_authutils')
   , errors= require('./_oauth_error')
   , oauth= require('oauth');

function parseParameters( method, headers, query, body ) {
  var result= {};
  
  if(headers['authorization'] != null && headers['authorization'].indexOf('OAuth') != -1) {
    result= authutils.splitAuthorizationHeader(headers['authorization']);
    delete result.type;
    // Exclude the "realm" parameter per Section 3.4.1.3.1 of RFC 5849
    delete result.realm;
  }

  //TODO: Figure out how to use post params....
  if( query ) {
    for(var key in query) {
      result[key] = query[key];
    }
  }
  
  return result;
}

function validateParameters(parameters, requiredParameters) {
  if( !parameters ) return false;
  var legalParameters = true;
  requiredParameters.forEach(function(requiredParameter) {
    if(parameters[requiredParameter] == null) legalParameters = false;
  });
  return legalParameters;
}

exports.OAuthServices= function(provider) {
  this.provider= provider;
  /**
    Ensure the provider has the correct functions
  **/
  ['previousRequestToken', 'tokenByConsumer', 'applicationByConsumerKey', 'validToken', 'authenticateUser', 'generateRequestToken', 'generateAccessToken', 'cleanRequestTokens', 'validateNotReplay', 'associateTokenToUser', 'tokenByTokenAndVerifier', 'userIdByToken'].forEach(function(method) {
    if(!(Object.prototype.toString.call(provider[method]) === "[object Function]")) throw Error("Data provider must provide the methods ['previousRequestToken', 'tokenByConsumer', 'applicationByConsumerKey', 'validToken', 'authenticateUser', 'generateRequestToken', 'generateAccessToken', 'cleanRequestTokens', 'validateNotReplay', 'associateTokenToUser', 'tokenByTokenAndVerifier']");
  });  
};

exports.OAuthServices.prototype.accessToken= function(request, protocol, callback) {
  var parsedUrl= url.parse(request.url, true);
  var method= request.method;
  var headers= request.headers;
  var host= headers['host'];
  var path= parsedUrl.pathname;
  var query= parsedUrl.query;
  
  var requestParameters = parseParameters(method, headers, query, request.body);
  // Ensure correct parameters are available
  if(!validateParameters(requestParameters, ['oauth_consumer_key', 'oauth_token', 
                                             'oauth_signature_method', 'oauth_signature', 
                                             'oauth_timestamp', 'oauth_nonce', 
                                             'oauth_verifier'])) { 
    callback( new errors.OAuthBadRequestError("Missing required parameter"), null); 
    return 
  };

  // Make a note of this as it will screw stuff up later if we leave it in the parameters bag
  var oauth_signature= requestParameters['oauth_signature'];
  delete requestParameters['oauth_signature'];
  
  var self= this;    
  // Fetch the secret and token for the user
  this.provider.applicationByConsumerKey(requestParameters['oauth_consumer_key'], function(err, user) {
    if(err) {
      callback(new errors.OAuthProviderError('Invalid Consumer Key'), null);        
    } else {
      if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: applicationByConsumerKey must return a object with fields [token, secret]"), null); return;}
      // Fetch the secret and token for the user
      self.provider.tokenByConsumer(requestParameters['oauth_consumer_key'], function(err, tokenObject) {
        if(err) {
          callback(new errors.OAuthProviderError('Invalid / expired Token'), null);        
        } else {  
          if(tokenObject.token == null || tokenObject.token_secret == null) { callback(new errors.OAuthProviderError("provider: tokenByConsumer must return a object with fields [token, token_secret]"), null); return;}
          // Ensure the token is the same as the one passed in from the server
          if(tokenObject.token == requestParameters["oauth_token"]) {
            // Ensure that the key has not been issued before
            self.provider.previousRequestToken(requestParameters['oauth_consumer_key'], function(err, result) {
              if(err) {
                callback(new errors.OAuthUnauthorizedError("Invalid / expired Token"), null);
              } else {
                // If we have a user for this consumer key let's calculate the signature
                var oauthClient= new oauth.OAuth(null, null, requestParameters['oauth_consumer_key'], user.secret, null, null, 'HMAC-SHA1');
                parsedUrl.protocol= protocol+":";
                parsedUrl.host= host;
                var reconstructedUrl= url.format(parsedUrl);
                var reconstructedOauthParameters= oauthClient._normaliseRequestParams(requestParameters);
                var calculatedSignature= oauthClient._getSignature(method, reconstructedUrl, reconstructedOauthParameters, tokenObject.token_secret );
                
                // Check if the signature is correct and return a access token
                if(calculatedSignature == oauth_signature /*|| self.calculateSignatureGoogleWay(method, protocol, url, path, requestParameters, tokenObject.token_secret, user.secret) == requestParameters.oauth_signature */) {
                  self.provider.generateAccessToken(requestParameters['oauth_token'], function(err, result) { 
                    if(result.access_token == null || result.token_secret == null) { callback(new errors.OAuthProviderError("generateAccessToken must return a object with fields [access_token, token_secret]"), null); return; }
                    callback(null, result);
                  });
                } else {
                  callback(new errors.OAuthUnauthorizedError("Invalid signature"), null);
                }
              }
            });                  
          } else {
            callback(new errors.OAuthUnauthorizedError("Invalid / expired Token"), null);
          }              
        }      
      });
    }
  });
  
};

exports.OAuthServices.prototype.authenticateUser = function(username, password, oauthToken, callback) {
  var self = this;
  
  this.provider.authenticateUser(username, password, oauthToken, function(err, result) {
    if(err) { callback(new errors.OAuthProviderError('internal error'), null); return; };
    if(result.token == null || result.verifier == null) { callback(new errors.OAuthProviderError("authenticateUser must return a object with fields [token, verifier]"), null); return;}
    // Save the association between the key and the user (to make available for later retrival)
    self.provider.associateTokenToUser(username, result.token, function(err, doc) {
      callback(err, result);      
    });
  });
}

exports.OAuthServices.prototype.authorize= function(request, protocol, callback) {
  var parsedUrl= url.parse(request.url, true);
  var method= request.method;
  var headers= request.headers;
  var host= headers['host'];
  var path= parsedUrl.pathname;
  var query= parsedUrl.query;
  
  var requestParameters= parseParameters(method, headers, query, request.body);
  if(requestParameters == null) { callback(new errors.OAuthBadRequestError("Missing required parameter"), null); return };  
  // Ensure correct parameters are available
  if(!validateParameters(requestParameters, ['oauth_consumer_key', 'oauth_token', 
                                             'oauth_signature_method', 'oauth_signature', 
                                             'oauth_timestamp', 'oauth_nonce'])) { 
    callback(new errors.OAuthBadRequestError("Missing required parameter"), null); 
    return 
  };    
  // Make a note of this as it will screw stuff up later if we leave it in the parameters bag
  var oauth_signature= requestParameters['oauth_signature'];
  delete requestParameters['oauth_signature'];
  
  var self = this; 
  
  // Check if token is valid
  self.provider.validToken(requestParameters.oauth_token, function(err, token) {
    if(err) {
      callback(new errors.OAuthProviderError('Invalid / expired Token'), null);        
    } else {                
      if(token.access_token == null || token.token_secret == null) { callback(new errors.OAuthProviderError("provider: validToken must return a object with fields [access_token, token_secret]"), null); return;}
      self.provider.validateNotReplay(requestParameters.oauth_token, requestParameters.oauth_timestamp, requestParameters.oauth_nonce, function(err, result) {
        if(err) {
          callback(new errors.OAuthUnauthorizedError('Invalid / used nonce'), null);
        } else {
          self.provider.applicationByConsumerKey(token.consumer_key, function(err, user) {
            if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: applicationByConsumerKey must return a object with fields [token, secret]"), null); return;}
            // If we have a user for this consumer key let's calculate the signature
            var oauthClient= new oauth.OAuth(null, null, requestParameters['oauth_consumer_key'], user.secret, null, null, 'HMAC-SHA1');
            parsedUrl.protocol= protocol+":";
            parsedUrl.host= host;
            var reconstructedUrl= url.format(parsedUrl);
            var reconstructedOauthParameters= oauthClient._normaliseRequestParams(requestParameters);
            var calculatedSignature= oauthClient._getSignature(method, reconstructedUrl, reconstructedOauthParameters ,  token.token_secret );
            
            // Check if the signature is correct and return a access token
            if(calculatedSignature == oauth_signature /*|| self.calculateSignatureGoogleWay(method, protocol, url, path, requestParameters, token.token_secret, user.secret) == requestParameters.oauth_signature*/) {
              // Fetch the user id to pass back
              self.provider.userIdByToken(requestParameters.oauth_token, function(err, doc) {
                if(doc.id == null) { callback(new errors.OAuthProviderError("provider: userIdByToken must return a object with fields [id]"), null); return;}
                // Return the user id to the calling function
                callback(null, doc);                
              });
            } else {
              callback(new errors.OAuthBadRequestError("Invalid signature"), null);
            }          
          });
        }
      });
    }
  });
};

/**
  Fetch an associated application object and user object
**/
exports.OAuthServices.prototype.fetchAuthorizationInformation = function(username, token, callback) {
  this.provider.fetchAuthorizationInformation(username, token, function(err, application, user) {
    if(application.title == null || application.description == null || user.token == null || user.username == null) { callback(new errors.OAuthProviderError("provider: applicationByConsumerKey must return a application object with fields [title, description] and a user object with fields [username, token]"), null); return;}
    // Return the value to calling plugin
    callback(err, application, user);
  });
}

exports.OAuthServices.prototype.requestToken= function(request, protocol, callback) {
  var parsedUrl= url.parse(request.url, true);
  var method= request.method;
  var headers= request.headers;
  var host= headers['host'];
  var path= parsedUrl.pathname;
  var query= parsedUrl.query;
  
  var requestParameters= parseParameters(method, headers, query, request.body);
  // Ensure correct parameters are available
  if(!validateParameters(requestParameters, ['oauth_consumer_key', 'oauth_signature_method', 
                                             'oauth_signature', 'oauth_timestamp', 
                                             'oauth_nonce', 'oauth_callback'])) { 
                                               
    callback( new errors.OAuthBadRequestError("Missing required parameter"), null); 
    return 
  };    

  // Make a note of this as it will screw stuff up later if we leave it in the parameters bag
  var oauth_signature= requestParameters['oauth_signature'];
  delete requestParameters['oauth_signature'];
  
  var self = this;
  // Fetch the secret and token for the user
  this.provider.applicationByConsumerKey(requestParameters['oauth_consumer_key'], function(err, user) {
    if(err) {
      callback(new errors.OAuthProviderError('Invalid Consumer Key'), null);        
    } else {       
      if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: applicationByConsumerKey must return a object with fields [consumer_key, secret]")); return;}
      // Ensure we don't have any hanging consumer keys
      self.provider.cleanRequestTokens(requestParameters['oauth_consumer_key'], function(err, result) {
        // If we have a user for this consumer key let's calculate the signature
        var oauthClient= new oauth.OAuth(null, null, requestParameters['oauth_consumer_key'], user.secret, null, null, 'HMAC-SHA1');
        parsedUrl.protocol= protocol+":";
        parsedUrl.host= host;
        var reconstructedUrl= url.format(parsedUrl);
        var reconstructedOauthParameters= oauthClient._normaliseRequestParams(requestParameters);
        var calculatedSignature= oauthClient._getSignature(method, reconstructedUrl, reconstructedOauthParameters , user.token );
        // Check if the signature is correct and return a request token
        if(calculatedSignature == oauth_signature /*|| self.calculateSignatureGoogleWay(method, protocol, url, path, requestParameters, user.token, user.secret) == requestParameters.oauth_signature */) {
          self.provider.generateRequestToken(requestParameters.oauth_consumer_key, requestParameters.oauth_callback, function(err, result) {
            if(err) {
              callback(new errors.OAuthProviderError("internal error"), null);
            } else {
              if(result.token == null || result.token_secret == null) { callback(new errors.OAuthProviderError("provider: generateRequestToken must return a object with fields [token, token_secret]"), null); return;}
              result['oauth_callback_confirmed'] = true;
              callback(null, result);                
            }
          });
        } else {
          callback(new errors.OAuthUnauthorizedError("Invalid signature"), null);          
        }
     }); 
   }
  });

  /**
    Verify if a token exists using the verifier number and the oauth_otken
  **/
exports.OAuthServices.prototype.verifyToken = function(token, verifier, callback) {
    this.provider.tokenByTokenAndVerifier(token, verifier, function(err, token) {
      if(token.token == null || token.verifier == null) { callback(new errors.OAuthProviderError("provider: tokenByTokenAndVerifier must return a token object with fields [token, verifier]"), null); return;}
      callback(err, token);
    });
  }  
};