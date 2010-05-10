Object.merge(exports, require('./auth.strategy.base'))
AuthStrategy= exports.AuthStrategy
BaseHttpStrategy= require('./auth.strategies/http/base').BaseHttpStrategy
Object.merge(exports, require('./auth.strategies/http/digest'))
Object.merge(exports, require('./auth.strategies/http/basic'))
Object.merge(exports, require('./auth.strategies/http/http'))
Object.merge(exports, require('./auth.strategies/anonymous'))  
Object.merge(exports, require('./auth.strategies/never'))  
Object.merge(exports, require('./auth.strategies/twitter'))  
Object.merge(exports, require('./auth.strategies/facebook'))  
Object.merge(exports, require('./auth.strategies/yahoo'))  

Object.merge(exports, require('./strategies')) 
Object.merge(exports, require('./strategyExecutor')) 

Http= exports.Http
Never= exports.Never
Anonymous= exports.Anonymous
Object.merge(exports, require('./auth.core')) 
