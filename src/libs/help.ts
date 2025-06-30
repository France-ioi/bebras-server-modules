var conf = require('../config/server')
var fs = require('fs')
var path = require('path')

function formatDir(dir) {
    var items = []
    fs.readdirSync(process.cwd() + dir).map((file) => {
        items.push(file.replace('.js', ''))
    })
    return items.join(', ')
}


function mainFile() {
    return path.basename(process.mainModule.filename)
}


module.exports =  {
    server: function() {
        var text = `
Usage:
    nodejs ${mainFile()} HANDLER [options]
Handlers:
    ${formatDir('/handlers')}
Options:
    -p, --port <n>  Port to listen on (default port ${conf.port})
`
        console.log(text);
    },


    console: function() {
        var text = `
Usage:
    nodejs ${mainFile()} COMMAND
Commands:
    ${formatDir('/commands')}
`
        console.log(text);
    }

}