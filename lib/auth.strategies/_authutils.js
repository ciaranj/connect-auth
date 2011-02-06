/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var NONCE_CHARS= ['a','b','c','d','e','f','g','h','i','j','k','l','m','n',
                'o','p','q','r','s','t','u','v','w','x','y','z','A','B',
                'C','D','E','F','G','H','I','J','K','L','M','N','O','P',
                'Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3',
                '4','5','6','7','8','9'];
                
exports.getNonce= function(nonceSize) {
    var result = [];
    var chars= NONCE_CHARS;
    var char_pos;
    var nonce_chars_length= chars.length;

    for (var i = 0; i < nonceSize; i++) {
        char_pos= Math.floor(Math.random() * nonce_chars_length);
        result[i]=  chars[char_pos];
    }
    return result.join('');
};
 
 /**
 * Given a valid HTTP Authorization HTTP will return an object literal
 * that contains the passed credentials.
 *
 * @return {object} The Authorization credentials, un-encoded and un-quoted.
 * @api private
 */
exports.splitAuthorizationHeader= function( authorizationHeader ) {

  var results= {};
  
  var parameterPairs= [];
  var isInQuotes= false;
  var lastStringStartingBoundary= 0;
  
   //Need to pull off authentication type first
  results.type= /^([a-zA-Z]+)\s/.exec(authorizationHeader)[1];  
  authorizationHeader= authorizationHeader.substring( results.type.length + 1 ) // type + 1 whitespace

  for(var i=0;i< authorizationHeader.length;i++) {
    if( authorizationHeader[i] == "\""  && authorizationHeader[i-1] != "\\" ) {
      // WE've found an un-escaped quote (do escaped quotes exist, need to check the RFC)
      isInQuotes= !isInQuotes;
    }
    if( authorizationHeader[i] == "," && !isInQuotes ) {
      var credentialsPart= authorizationHeader.substr(lastStringStartingBoundary, (i-lastStringStartingBoundary));
      //Strip whitespace..
      credentialsPart= credentialsPart.replace(/^\s+|\s+$/g,'')
      
      
      parameterPairs[parameterPairs.length]= credentialsPart;
      lastStringStartingBoundary= i+1;  // skip the comma.
    }
  }

  // Refactor this code. 
  if( lastStringStartingBoundary < authorizationHeader.length ) {
    var credentialsPart= authorizationHeader.substr(lastStringStartingBoundary, (authorizationHeader.length-lastStringStartingBoundary));
    //Strip whitespace..
    credentialsPart= credentialsPart.replace(/^\s+|\s+$/g,'')
    parameterPairs[parameterPairs.length]= credentialsPart;
    lastStringStartingBoundary= i+1;  // skip the comma.
  }
  

  for(var key in parameterPairs) {
    var pair= /^([^=]+)?=(.+)/.exec(parameterPairs[key])

    //de-code quotes and un-escape inter-stitial quotes if appropriate
    // I'm lost as to the correct behaviour of this bit tbh, the rfcs don't seem to be specifc
    // around whether quoted strings need to quote the quotes or not!! (that I can find anyway :) ) 
    var value= pair[2].replace(/^"|"$/g, '')
    value= value.replace(/\\"/g, '"')
    value= unescape(value)

    results[pair[1]]= value
  }

  return results;
}