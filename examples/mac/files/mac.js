// HTTP MAC Authentication Scheme
// Based on RFC-Draft: http://tools.ietf.org/html/draft-hammer-oauth-v2-mac-token
// Copyright(c) 2011 Eran Hammer-Lahav <eran@hueniverse.com>
// MIT Licensed


function getAuthorizationHeader(method, uri, token, secret, algorithm, content) {

    // Generate timestamp and nonce

    var timestamp = Math.floor((new Date()).getTime() / 1000);
    var nonce = getNonce(8);

    // Calculate body hash

    var bodyhash = '';
    if (content != null) {

        var hashFunc;

        switch (algorithm) {

            case 'hmac-sha-1': hashFunc = Crypto.SHA1; break;
            case 'hmac-sha-256': hashFunc = Crypto.SHA256; break;
            default: return "";                                         // Error: Unknown algorithm
        }

        bodyhash = Crypto.util.bytesToBase64(hashFunc(content, { asBytes: true }));
    }

    // Calculate signature

    var signature = signRequest(method, uri, token, secret, algorithm, timestamp, nonce, bodyhash);

    // Construct header

    var header = 'MAC token="' + token +
                 '", timestamp="' + timestamp +
                 '", nonce="' + nonce +
                 (bodyhash != '' ? '", bodyhash="' + bodyhash : '') +
                 '", signature="' + signature + '"';

    return header;
}


function signRequest(method, URI, token, secret, algorithm, timestamp, nonce, bodyhash) {

    // Parse request URI

    var uri = parseUri(URI);

    if (uri.pathname == null ||
        uri.host == null ||
        uri.port == null) {

        // Error: Bad request URI
        return "";
    }

    // Construct normalized request string

    var normalized = token + '\n' +
                     timestamp + '\n' +
                     nonce + '\n' +
                     bodyhash + '\n' +
                     method.toUpperCase() + '\n' +
                     uri.host.toLowerCase() + '\n' +
                     uri.port + '\n' +
                     uri.pathname + '\n';

    // Normalize parameters

    var params = new Array;

    if (uri.query) {

        var count = 0;
        for (var p in uri.query) {

            if (typeof uri.query[p] == 'string') {

                params[count++] = percentEscape(p) + "=" + percentEscape(uri.query[p]);
            }
            else {

                for (var i in uri.query[p]) {

                    params[count++] = percentEscape(p) + "=" + percentEscape(uri.query[p][i]);
                }
            }
        }

        params.sort();

        for (var i in params) {

            normalized += params[i] + '\n';
        }
    }

    // Set hash algorithm

    var hashFunc;

    switch (algorithm) {

        case 'hmac-sha-1': hashFunc = Crypto.SHA1; break;
        case 'hmac-sha-256': hashFunc = Crypto.SHA256; break;
        default: return "";                                         // Error: Unknown algorithm
    }

    // Sign normalized request string

    return Crypto.util.bytesToBase64(Crypto.HMAC(hashFunc, normalized, secret, { asBytes: true }));
}


function percentEscape(value) {

    // Percent-escape per specification

    var escapedString = '';

    for (var i = 0; i < value.length; i++) {

        var char = value.charCodeAt(i);

        if ((char >= 48 && char <= 57) ||       // 09
            (char >= 65 && char <= 90) ||       // AZ
            (char >= 97 && char <= 122) ||      // az
            char == 45 ||                       // -
            char == 95 ||                       // _
            char == 46 ||                       // .
            char == 126) {                      // ~

            escapedString += String.fromCharCode(char);
        }
        else {

            escapedString += '%' + char.toString(16).toUpperCase();
        }
    }

    return escapedString;
}


// Based on: Crypto-JS v2.0.0
// http://code.google.com/p/crypto-js/
// Copyright (c) 2009, Jeff Mott. All rights reserved.
// http://code.google.com/p/crypto-js/wiki/License

(function () { var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; var d = window.Crypto = {}; var a = d.util = { rotl: function (h, g) { return (h << g) | (h >>> (32 - g)) }, rotr: function (h, g) { return (h << (32 - g)) | (h >>> g) }, endian: function (h) { if (h.constructor == Number) { return a.rotl(h, 8) & 16711935 | a.rotl(h, 24) & 4278255360 } for (var g = 0; g < h.length; g++) { h[g] = a.endian(h[g]) } return h }, randomBytes: function (h) { for (var g = []; h > 0; h--) { g.push(Math.floor(Math.random() * 256)) } return g }, bytesToWords: function (h) { for (var k = [], j = 0, g = 0; j < h.length; j++, g += 8) { k[g >>> 5] |= h[j] << (24 - g % 32) } return k }, wordsToBytes: function (i) { for (var h = [], g = 0; g < i.length * 32; g += 8) { h.push((i[g >>> 5] >>> (24 - g % 32)) & 255) } return h }, bytesToHex: function (g) { for (var j = [], h = 0; h < g.length; h++) { j.push((g[h] >>> 4).toString(16)); j.push((g[h] & 15).toString(16)) } return j.join("") }, hexToBytes: function (h) { for (var g = [], i = 0; i < h.length; i += 2) { g.push(parseInt(h.substr(i, 2), 16)) } return g }, bytesToBase64: function (h) { if (typeof btoa == "function") { return btoa(e.bytesToString(h)) } for (var g = [], l = 0; l < h.length; l += 3) { var m = (h[l] << 16) | (h[l + 1] << 8) | h[l + 2]; for (var k = 0; k < 4; k++) { if (l * 8 + k * 6 <= h.length * 8) { g.push(c.charAt((m >>> 6 * (3 - k)) & 63)) } else { g.push("=") } } } return g.join("") }, base64ToBytes: function (h) { if (typeof atob == "function") { return e.stringToBytes(atob(h)) } h = h.replace(/[^A-Z0-9+\/]/ig, ""); for (var g = [], j = 0, k = 0; j < h.length; k = ++j % 4) { if (k == 0) { continue } g.push(((c.indexOf(h.charAt(j - 1)) & (Math.pow(2, -2 * k + 8) - 1)) << (k * 2)) | (c.indexOf(h.charAt(j)) >>> (6 - k * 2))) } return g } }; d.mode = {}; var b = d.charenc = {}; var f = b.UTF8 = { stringToBytes: function (g) { return e.stringToBytes(unescape(encodeURIComponent(g))) }, bytesToString: function (g) { return decodeURIComponent(escape(e.bytesToString(g))) } }; var e = b.Binary = { stringToBytes: function (j) { for (var g = [], h = 0; h < j.length; h++) { g.push(j.charCodeAt(h)) } return g }, bytesToString: function (g) { for (var j = [], h = 0; h < g.length; h++) { j.push(String.fromCharCode(g[h])) } return j.join("") } } })(); (function () { var f = Crypto, a = f.util, b = f.charenc, e = b.UTF8, d = b.Binary; var c = f.SHA1 = function (i, g) { var h = a.wordsToBytes(c._sha1(i)); return g && g.asBytes ? h : g && g.asString ? d.bytesToString(h) : a.bytesToHex(h) }; c._sha1 = function (o) { if (o.constructor == String) { o = e.stringToBytes(o) } var v = a.bytesToWords(o), x = o.length * 8, p = [], r = 1732584193, q = -271733879, k = -1732584194, h = 271733878, g = -1009589776; v[x >> 5] |= 128 << (24 - x % 32); v[((x + 64 >>> 9) << 4) + 15] = x; for (var z = 0; z < v.length; z += 16) { var E = r, D = q, C = k, B = h, A = g; for (var y = 0; y < 80; y++) { if (y < 16) { p[y] = v[z + y] } else { var u = p[y - 3] ^ p[y - 8] ^ p[y - 14] ^ p[y - 16]; p[y] = (u << 1) | (u >>> 31) } var s = ((r << 5) | (r >>> 27)) + g + (p[y] >>> 0) + (y < 20 ? (q & k | ~q & h) + 1518500249 : y < 40 ? (q ^ k ^ h) + 1859775393 : y < 60 ? (q & k | q & h | k & h) - 1894007588 : (q ^ k ^ h) - 899497514); g = h; h = k; k = (q << 30) | (q >>> 2); q = r; r = s } r += E; q += D; k += C; h += B; g += A } return [r, q, k, h, g] }; c._blocksize = 16 })();
(function () { var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; var d = window.Crypto; var a = d.util = { rotl: function (h, g) { return (h << g) | (h >>> (32 - g)) }, rotr: function (h, g) { return (h << (32 - g)) | (h >>> g) }, endian: function (h) { if (h.constructor == Number) { return a.rotl(h, 8) & 16711935 | a.rotl(h, 24) & 4278255360 } for (var g = 0; g < h.length; g++) { h[g] = a.endian(h[g]) } return h }, randomBytes: function (h) { for (var g = []; h > 0; h--) { g.push(Math.floor(Math.random() * 256)) } return g }, bytesToWords: function (h) { for (var k = [], j = 0, g = 0; j < h.length; j++, g += 8) { k[g >>> 5] |= h[j] << (24 - g % 32) } return k }, wordsToBytes: function (i) { for (var h = [], g = 0; g < i.length * 32; g += 8) { h.push((i[g >>> 5] >>> (24 - g % 32)) & 255) } return h }, bytesToHex: function (g) { for (var j = [], h = 0; h < g.length; h++) { j.push((g[h] >>> 4).toString(16)); j.push((g[h] & 15).toString(16)) } return j.join("") }, hexToBytes: function (h) { for (var g = [], i = 0; i < h.length; i += 2) { g.push(parseInt(h.substr(i, 2), 16)) } return g }, bytesToBase64: function (h) { if (typeof btoa == "function") { return btoa(e.bytesToString(h)) } for (var g = [], l = 0; l < h.length; l += 3) { var m = (h[l] << 16) | (h[l + 1] << 8) | h[l + 2]; for (var k = 0; k < 4; k++) { if (l * 8 + k * 6 <= h.length * 8) { g.push(c.charAt((m >>> 6 * (3 - k)) & 63)) } else { g.push("=") } } } return g.join("") }, base64ToBytes: function (h) { if (typeof atob == "function") { return e.stringToBytes(atob(h)) } h = h.replace(/[^A-Z0-9+\/]/ig, ""); for (var g = [], j = 0, k = 0; j < h.length; k = ++j % 4) { if (k == 0) { continue } g.push(((c.indexOf(h.charAt(j - 1)) & (Math.pow(2, -2 * k + 8) - 1)) << (k * 2)) | (c.indexOf(h.charAt(j)) >>> (6 - k * 2))) } return g } }; d.mode = {}; var b = d.charenc = {}; var f = b.UTF8 = { stringToBytes: function (g) { return e.stringToBytes(unescape(encodeURIComponent(g))) }, bytesToString: function (g) { return decodeURIComponent(escape(e.bytesToString(g))) } }; var e = b.Binary = { stringToBytes: function (j) { for (var g = [], h = 0; h < j.length; h++) { g.push(j.charCodeAt(h)) } return g }, bytesToString: function (g) { for (var j = [], h = 0; h < g.length; h++) { j.push(String.fromCharCode(g[h])) } return j.join("") } } })(); (function () { var g = Crypto, b = g.util, c = g.charenc, f = c.UTF8, e = c.Binary; var a = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298]; var d = g.SHA256 = function (j, h) { var i = b.wordsToBytes(d._sha256(j)); return h && h.asBytes ? i : h && h.asString ? e.bytesToString(i) : b.bytesToHex(i) }; d._sha256 = function (q) { if (q.constructor == String) { q = f.stringToBytes(q) } var y = b.bytesToWords(q), z = q.length * 8, r = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225], s = [], K, J, I, G, F, E, D, C, B, A, p, o; y[z >> 5] |= 128 << (24 - z % 32); y[((z + 64 >> 9) << 4) + 15] = z; for (var B = 0; B < y.length; B += 16) { K = r[0]; J = r[1]; I = r[2]; G = r[3]; F = r[4]; E = r[5]; D = r[6]; C = r[7]; for (var A = 0; A < 64; A++) { if (A < 16) { s[A] = y[A + B] } else { var n = s[A - 15], u = s[A - 2], M = ((n << 25) | (n >>> 7)) ^ ((n << 14) | (n >>> 18)) ^ (n >>> 3), L = ((u << 15) | (u >>> 17)) ^ ((u << 13) | (u >>> 19)) ^ (u >>> 10); s[A] = M + (s[A - 7] >>> 0) + L + (s[A - 16] >>> 0) } var t = F & E ^ ~F & D, k = K & J ^ K & I ^ J & I, x = ((K << 30) | (K >>> 2)) ^ ((K << 19) | (K >>> 13)) ^ ((K << 10) | (K >>> 22)), v = ((F << 26) | (F >>> 6)) ^ ((F << 21) | (F >>> 11)) ^ ((F << 7) | (F >>> 25)); p = (C >>> 0) + v + t + (a[A]) + (s[A] >>> 0); o = x + k; C = D; D = E; E = F; F = G + p; G = I; I = J; J = K; K = p + o } r[0] += K; r[1] += J; r[2] += I; r[3] += G; r[4] += F; r[5] += E; r[6] += D; r[7] += C } return r }; d._blocksize = 16 })();
(function () { var e = Crypto, a = e.util, b = e.charenc, d = b.UTF8, c = b.Binary; e.HMAC = function (l, m, k, h) { if (m.constructor == String) { m = d.stringToBytes(m) } if (k.constructor == String) { k = d.stringToBytes(k) } if (k.length > l._blocksize * 4) { k = l(k, { asBytes: true }) } var g = k.slice(0), n = k.slice(0); for (var j = 0; j < l._blocksize * 4; j++) { g[j] ^= 92; n[j] ^= 54 } var f = l(g.concat(l(n.concat(m), { asBytes: true })), { asBytes: true }); return h && h.asBytes ? f : h && h.asString ? c.bytesToString(f) : a.bytesToHex(f) } })();


// Based on: connect-auth
// https://github.com/ciaranj/connect-auth
// Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
// MIT Licensed

var NONCE_CHARS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
                'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B',
                'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
                'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3',
                '4', '5', '6', '7', '8', '9'];

function getNonce(nonceSize) {

    var result = [];
    var chars = NONCE_CHARS;
    var char_pos;
    var nonce_chars_length = chars.length;

    for (var i = 0; i < nonceSize; i++) {
        char_pos = Math.floor(Math.random() * nonce_chars_length);
        result[i] = chars[char_pos];
    }
    return result.join('');
};


// Based on: parseURI 1.2.2
// http://blog.stevenlevithan.com/archives/parseuri
// (c) Steven Levithan <stevenlevithan.com>
// MIT License

function parseUri(URI) {

    var keys = ["source", "scheme", "authority", "userInfo", "user", "password", "host", "port", "relative", "pathname", "directory", "file", "rawQuery", "fragment"];

    var uriRegex = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;
	var	uriByNumber = uriRegex.exec(URI);
    var uri = {};

    var i = 14;
    while (i--) {
        uri[keys[i]] = uriByNumber[i] || "";
    }

    uri.query = parseQuery(uri.rawQuery);

    if (uri.port == null ||
        uri.port == '') {

        uri.port = (uri.scheme.toLowerCase() == 'http' ? '80' : (uri.scheme.toLowerCase() == 'https' ? '443' : ''));
    }

    return uri;
};


function parseQuery(query) {

    result = {};
    var queryRegex = /(?:^|&)([^&=]*)=?([^&]*)/g;
    query.replace(queryRegex, function ($0, $1, $2) {
        if ($1) {

            var key = decodeURIComponent($1.replace(/\+/g, ' '));
            var value = ($2 ? decodeURIComponent($2.replace(/\+/g, ' ')) : '');

            if (result[key] == null) {

                result[key] = value;
            }
            else {

                if (typeof result[key] == 'string') {

                    result[key] = [result[key], value];
                }
                else {

                    result[key].push(value);
                }
            }
        }
    });

    return result;
}
