require('node-env-file')(__dirname + '/.env')
var help = require('./libs/help')
var fs = require('fs')
var path = require('path')

var name = process.argv[2];
if(!name) {
    help.console()
    process.exit()
}

function load(name) {
    var file = path.resolve(process.cwd(), 'commands/' + name + '.js')
    if(fs.existsSync(file)) {
        return require(file)
    }
    console.log(`Command ${name} not found.`)
    process.exit()
}

console.log(`Running ${name} ...`)

load(name)((error) => {
    if(error) {
        console.error(error)
    } else {
        console.log('Done.')
    }
    process.exit()
})