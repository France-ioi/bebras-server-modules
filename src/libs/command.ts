var fs = require('fs')
var path = require('path')


function parseActionPath(p) {
    var tmp = p.split(':')
    return {
        command: tmp[0],
        action: tmp[1]
    }
}

function loadCommand(name) {
    var file = path.resolve(process.cwd(), 'commands/' + name + '.js')
    if(fs.existsSync(file)) {
        return require(file)
    }
    console.error(`Command ${name} not found.`)
    process.exit();
}


function runAction(command, action, params) {
    if(action in command) {
        command[action](params, function(error) {
            if(error) {
                console.error(error.message)
                return process.exit(1)
            }
            console.log('Done')
            process.exit(0)
        })
    } else {
        console.error(`Action ${action} not found.`)
    }

}


module.exports = function(params) {
    var action_path = parseActionPath(params._[0])
    var command = loadCommand(action_path.command)
    runAction(command, action_path.action, params)
}