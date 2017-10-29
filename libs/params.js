var parseArgs = require('mri');
var conf = require('../config/server');
var help = require('./help');

var params = parseArgs(process.argv.slice(2), {
    default: {
        port: 3000
    },
    alias: {
        p: 'port'
    },
    unknown(opt) {
        console.error(`Option "${opt}" is unknown.`)
        help.server()
        process.exit(1)
    }
})


if(!params._[0]) {
    console.error(`Handler param missed.`)
    help.server()
    process.exit(1)
}

module.exports = params;