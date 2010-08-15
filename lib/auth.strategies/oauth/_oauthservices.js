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
  
  // Check if this is sent by headers or parameters
  if(method == 'GET' && query && query['oauth_consumer_key'] != null) {
    return query;
  } else if(body != null && body['oauth_consumer_key'] != null) {
    return body;    
  } else if(headers['authorization'] != null && headers['authorization'].indexOf('OAuth') != -1) {
    var result= authutils.splitAuthorizationHeader(headers['authorization']);
    delete result.type;
    return result;
  }    
}

function validateParameters(parameters, requiredParameters) {
  if( !parameters ) return false;
  var legalParameters = true;
  requiredParameters.forEach(function(requiredParameter) {
    if(parameters[requiredParameter] == null) legalParameters = false;
  });
  return legalParameters;
}

exports.OAuthServices= function(provider, protocol) {
  this.provider= provider;
  /**
    Ensure the provider has the correct functions
  **/
  ['previousRequestToken', 'tokenByConsumer', 'applicationByConsumerKey', 'validToken', 'authenticateUser', 'generateRequestToken', 'generateAccessToken', 'cleanRequestTokens', 'validateNotReplay', 'associateTokenToUser', 'tokenByTokenAndVerifier', 'userIdByToken'].forEach(function(method) {
    if(!(Object.prototype.toString.call(provider[method]) === "[object Function]")) throw Error("Data provider must provide the methods ['previousRequestToken', 'tokenByConsumer', 'applicationByConsumerKey', 'validToken', 'authenticateUser', 'generateRequestToken', 'generateAccessToken', 'cleanRequestTokens', 'validateNotReplay', 'associateTokenToUser', 'tokenByTokenAndVerifier']");
  });  
};

exports.OAuthServices.prototype.requestToken= function(request, protocol, callback) {
  var parsedUrl= url.parse(request.url, true);
  var method= request.method;
  var headers= request.headers;
  var host= headers['host'];
  var path= parsedUrl.pathname;
  var query= parsedUrl.query;
  
  var requestParameters = parseParameters(method, headers, query, request.body);
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
}