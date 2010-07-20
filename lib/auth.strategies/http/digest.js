/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var Base= require("./base");
var crypto= require('crypto');

var md5= function(str) {
  return crypto.createHash('md5').update(str).digest('hex');
};

Digest= module.exports= function (options) {
  options= options || {}
  var that= Base(options);
  var my= {};
  my._realm= options.realm || "secure"
  my._getPasswordForUser= options.getPasswordForUser;
  
  that.authenticate= function(req, res, callback) {
    var self= this;
    var authHeader= req.headers.authorization;
    var isDigest=  /^[D]igest\s.+"/.exec(authHeader)
    if(authHeader) {
      var credentials= this._splitAuthorizationHeader(authHeader);   
      var method= req.method
      var href= req.url
      my._getPasswordForUser(credentials.username, function(error, password){
        if(error) callback(error);
        else {
          var HA1= md5( credentials.username+":"+ my._realm + ":"+ password) 
          var HA2= md5( method+ ":" + href )
          var myResponse= md5(HA1 + ":"+ credentials.nonce + ":"+ HA2 )
          
          if( myResponse == credentials.response ) {
            self.success({ username : credentials.username}, callback);
          }
          else {
            self._unAuthenticated(req, res, callback)
          }
        }
      })
    }
    else {
      self._unAuthenticated(req, res, callback)
    }
  }; 
  
  that.getAuthenticateResponseHeader= function( request ) {
    return "Digest realm=\"" + my._realm.replace("\"","\\\"") + "\", nonce=\""+ this._getNonce(32)+"\"";
  };
  
  /**
   * Given a valid Digest Authorization HTTP Header will return an object literal
   * that contains the passed credentials.
   *
   * @return {object} The digest credentials, un-encoded and un-quoted.
   * @api private
   */
  that._splitAuthorizationHeader= function( authorizationHeader ) {

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
      var pair= /^(.+)?=(.+)/.exec(parameterPairs[key])

      //de-code quotes and un-escape inter-stitial quotes if appropriate
      // I'm lost as to the correct behaviour of this bit tbh, the rfcs don't seem to be specifc
      // around whether quoted strings need to quote the quotes or not!! (that I can find anyway :) ) 
      var value= pair[2].replace(/^"|"$/g, '')
      value= value.replace(/\\"/g, '"')

      results[pair[1]]= value
    }

    return results;
  }
  
  return that;
};