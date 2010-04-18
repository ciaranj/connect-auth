var sha1= require('./sha1'),
    base64= require('support/ext/lib/ext/base64')
exports.OAuth= AuthStrategy.extend({
   constructor: function(options){
     AuthStrategy.prototype.constructor.call(this, options)

     this._requestUrl= options.requestUrl;
     this._accessUrl= options.accessUrl;
     this._authorizeUrl= options.authorizeUrl;
     this._consumerKey= options.consumerKey;
     this._consumerSecret= this._encodeData( options.consumerSecret );
     this._version= options.oauthVersion;
     this._signatureMethod= options.signatureMethod;
   },
   
   authenticate: function(request, callback) {
     this.fail(callback);
   },
   
   _getTimestamp: function() {
     return Math.floor( (new Date()).getTime() / 1000 );
   },
  
   _encodeData: function(toEncode){
    if( toEncode == null || toEncode == "" ) return ""
    else {
       var result= encodeURIComponent(toEncode);

       // Fix the mismatch between OAuth's  RFC2396's and Javascript's beliefs in what is right and wrong ;)
       return result.replace(/\!/g, "%21")
                    .replace(/\'/g, "%27")
                    .replace(/\(/g, "%28")
                    .replace(/\)/g, "%29")
                    .replace(/\*/g, "%2A");
    }
   },

   _decodeData: function(toDecode) {
     if( toDecode != null ) {
       toDecode = toDecode.replace(/\+/g, " ");
     }
     return decodeURIComponent( toDecode);
   },

   // Takes a literal in, then returns a sorted array
   _sortRequestParams: function(argumentsHash) {
     var argument_pairs= [];
     for(var key in argumentsHash ) {   
         argument_pairs[argument_pairs.length]= [key, argumentsHash[key]];
     }
     // Sort by name, then value.
     argument_pairs.sort(function(a,b) {
         if ( a[0]== b[0] )  {
           return a[1] < b[1] ? -1 : 1; 
         }
         else return a[0] < b[0] ? -1 : 1;  
     });

     return argument_pairs;
   },
   
   _normaliseRequestParams: function(arguments) {
     var argument_pairs= this._sortRequestParams( arguments );
     var args= "";
     for(var i=0;i<argument_pairs.length;i++) {
         args+= argument_pairs[i][0];
         args+= "="
         args+= argument_pairs[i][1];
         if( i < argument_pairs.length-1 ) args+= "&";
     }     
     return args;
   },

   _createSignatureBase: function(method, url, parameters) {
     url= this._encodeData(url);
     parameters= this._encodeData(parameters);
     return method.toUpperCase() + "&" + url + "&" + parameters;
   },

   _createSignature: function(signatureBase, tokenSecret) {
      if( tokenSecret === undefined ) var tokenSecret= "";
      else tokenSecret= this._encodeData( tokenSecret ); 

      var key= this._consumerSecret + "&" + tokenSecret;

      //TODO: whilst we support different signature methods being passed
      // we currenting only do SHA1-HMAC
      var hash= sha1.HMACSHA1(key, signatureBase);
      signature = this._encodeData(hash);

      return signature;
   },
   
   getOAuthRequestToken: function(callback) {
     var oauthParameters= {
         "oauth_callback":         "oob",
         "oauth_timestamp":        this._getTimestamp(),
         "oauth_nonce":            this._getNonce(32),
         "oauth_version":          this._version,
         "oauth_signature_method": this._signatureMethod,
         "oauth_consumer_key":     this._consumerKey
     };
     var method= "POST";

     var sig= this._getSignature( method,  this._requestUrl,  this._normaliseRequestParams(oauthParameters));


     var orderedParameters= this._sortRequestParams( oauthParameters );  
     require('sys').p(orderedParameters)
     orderedParameters[orderedParameters.length]= ["oauth_signature", sig];
     require('sys').p(orderedParameters) 
     var headers= {};

     // build request authorization header
     var authHeader="OAuth "; 
/*     for(var key in oauthParameters)
     {
         var pair = key + "=\"" + oauthParameters[key] + "\"";
         authHeader+= pair +",";  
     }*/
     
     for( var i= 0 ; i < orderedParameters.length; i++) {
       authHeader+= orderedParameters[i][0]+"=\""+orderedParameters[i][1] +"\",";
     }
     authHeader= authHeader.substring(0, authHeader.length-1);
     require('sys').puts(authHeader);
     headers["Authorization"]= authHeader;
     headers["Host"] = "twitter.com"
     headers["Accept"]= "*/*"
     headers["Connection"]= "close"
     headers["User-Agent"]= "Express authentication"
     headers["Content-length"]= 0
     headers["Content-Type"]= "application/x-www-form-urlencoded"
       var sys= require('sys');
       sys.p(headers)
     var google = require('http').createClient(80, 'twitter.com');
     var request = google.request(method, "/oauth/request_token", headers);
     request.addListener('response', function (response) {
       sys.puts('STATUS: ' + response.statusCode);
       sys.puts('HEADERS: ' + JSON.stringify(response.headers));
       response.setEncoding('utf8');
       response.addListener('data', function (chunk) {
         sys.puts('BODY: ' + chunk);
       });
     });
     request.end();
   },
   
   _getSignature: function(method, url, parameters) {

     var signatureBase= this._createSignatureBase(method, url, parameters);
     return this._createSignature(signatureBase); 
   }
   
});
