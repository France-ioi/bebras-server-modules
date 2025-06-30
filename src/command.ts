require('node-env-file')(__dirname + '/.env')
var params = require('./libs/params')
require('./libs/command')(params)