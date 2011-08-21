/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmai.com>
 * MIT Licensed
 */

 // Silly little function nabbed from: http://www.irt.org/script/183.htm
function pad(number,length) {
     var str = '' + number;
     while (str.length < length)
         str = '0' + str;
     return str;
 }

// Dead end for when no tracing mechanism specified
module.exports.nullTrace= function() {}

/*
 * The standard tracing function, provides information in the form of:
 *
 * 17:54:40-647 [e78ocZ] (Scope) >>> Authenticating (testtwitter.com/?login_with=never)
 * 
 * Viewing these lines offer useful diagnostics to determine why authentication is failing (the session id within the square brackets
 * and the provided url giving the greatest clues!)
 */
module.exports.standardTrace= function( message, req, scope, linePrefix ) {
     var d= new Date();
     var id;
     if( req.sessionID ) {
       id= req.sessionID.substring(0,6);
     } else {
       id= req.socket.remoteAddress;
     }
     scope= (scope? " (" + scope +")" : "");
     linePrefix= (linePrefix? " " + linePrefix : "");
     message= message.replace(/\n/g, "\n                     " + linePrefix);
     console.log( pad(d.getHours(),2) + ":"+ pad(d.getMinutes(),2) + ':' + pad(d.getSeconds(),2) + '-' + pad(d.getMilliseconds(),3) + " ["+id+"]" + scope + linePrefix+ " "+ message);
 }
