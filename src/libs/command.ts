import fs from 'fs';
import path from 'path';

function parseActionPath(p: string) {
    const tmp = p.split(':')
    return {
        command: tmp[0],
        action: tmp[1]
    }
}

async function loadCommand(name: string) {
    // @ts-ignore
    const filePath = process[Symbol.for("ts-node.register.instance")] ? 'src/commands/' + name + '.ts' : 'dist/commands/' + name + '.js'
    const file = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(file)) {
        return (await import(file)).default;
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


export default async function(params: any) {
    const action_path = parseActionPath(params._[0])
    const command = await loadCommand(action_path.command)
    runAction(command, action_path.action, params)
}
