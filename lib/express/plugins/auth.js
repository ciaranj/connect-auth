exports.merge(require('./auth.core')) 
Auth= exports.Auth
exports.merge(require('./auth.basic'))
exports.merge(require('./auth.digest'))