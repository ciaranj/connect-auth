exports.merge(require('./auth.strategy.base'))
AuthStrategy= exports.AuthStrategy
BaseHttpStrategy= require('./auth.strategies/http/base').BaseHttpStrategy
exports.merge(require('./auth.strategies/http/digest'))
exports.merge(require('./auth.strategies/http/basic'))
exports.merge(require('./auth.strategies/http/http'))
exports.merge(require('./auth.strategies/anonymous'))  
exports.merge(require('./auth.strategies/never'))  
exports.merge(require('./auth.strategies/twitter'))  

exports.merge(require('./strategies')) 
exports.merge(require('./strategyExecutor')) 

Http= exports.Http
Never= exports.Never
Anonymous= exports.Anonymous
exports.merge(require('./auth.core')) 
