require('node-env-file')(__dirname + '/.env')
var db = require('./libs/db')
var migrations = require('mysql-migrations')
migrations.init(db.pool(), __dirname + '/migrations')