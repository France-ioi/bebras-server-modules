const fs = require('fs')
const path = require('path')


function parseActionPath(p: string) {
    const tmp = p.split(':')
    return {
        command: tmp[0],
        action: tmp[1]
    }
}

function loadCommand(name: string) {
    const file = path.resolve(process.cwd(), 'commands/' + name + '.js')
    if(fs.existsSync(file)) {
        return require(file)
    }
    console.error(`Command ${name} not found.`)
    process.exit();
}


function runAction(command: any, action: string, params: any) {
    if(action in command) {
        command[action](params, function(error: any) {
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


export default function(params: any) {
    const action_path = parseActionPath(params._[0])
    const command = loadCommand(action_path.command)
    runAction(command, action_path.action, params)
}
