exports.merge(require('./auth.strategy.base'))
AuthStrategy= exports.AuthStrategy
//exports.merge(require('./auth.strategies/basic'))
exports.merge(require('./auth.strategies/http/http'))
HttpStrategy= exports.HttpStrategy

exports.merge(require('./auth.core')) 
