var kiwi= require('kiwi');
kiwi.require('express') 
require.paths.unshift('spec', 'lib', 'spec/lib')

require("jspec")
require("express")
require("express/spec")
require("express/plugins") 

print = require('util').puts
quit = process.exit
readFile = require('fs').readFileSync

function run(specs) {
  specs.forEach(function(spec){
    JSpec.exec('spec/spec.' + spec + '.js')
  })
}

specs = {
  independant: [
/*    'auth.core',  */
    'strategies',
    'auth.strategies.anonymous',
    'auth.strategies.never',
    'auth.strategy.base',
    'auth.strategies.http.digest'
    ]
}

switch (process.ARGV[2]) {
  case 'all':
    run(specs.independant)
    break
  default: 
    run([process.ARGV[2]])
}

Express.environment = 'test'
JSpec.run({ reporter: JSpec.reporters.Terminal, failuresOnly: true }).report()