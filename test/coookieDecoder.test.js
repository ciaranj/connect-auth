var connect = require('connect');

exports['test something'] = function(assert) {
  console.log(require('util').inspect(assert))
}
