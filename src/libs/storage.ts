var conf = require('../config/storage')

if(conf.default == 'local') {
    var storage = require('./storage_local')
} else if(conf.default == 's3') {
    var storage = require('./storage_s3')
}


module.exports = storage