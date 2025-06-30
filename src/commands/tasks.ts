import fs from 'fs';
import path from 'path';
import {GenericCallback} from "../types";

const file = path.resolve(process.cwd(), 'tasks.json');
let data: any = {};
if (fs.existsSync(file)) {
    data = require(file);
}

function save(callback: GenericCallback) {
    fs.writeFile(file, JSON.stringify(data, null, '  '), 'utf8', callback)
}

export default {
    help: function(params: any, callback: GenericCallback) {
        console.log('task:add id path')
    },
    add: function(params: any, callback: GenericCallback) {
        if(!params._[1]) {
            return callback(new Error('Task id missed'))
        }
        if(!params._[2]) {
            return callback(new Error('Task path missed'))
        }
        if(!fs.existsSync(params._[2])) {
            return callback(new Error('Wrong task path, file not found'))
        }
        data[params._[1]] = params._[2]
        save(callback)
    },
    remove: function(params: any, callback: GenericCallback) {
        if(!params._[1]) {
            callback(new Error('Task id missed'))
        }
        if(params._[1] in data) {
            delete(data[params._[1]])
            return save(callback)
        }
        callback(new Error('Task not found'))
    },
    list: function(params: any, callback: GenericCallback) {
        console.log(`ID\tPath`)
        for(let id in data) {
            console.log(`${id}\t${data[id]}`)
        }
        callback()
    },
    clear: function(params: any, callback: GenericCallback) {
        data = {}
        save(callback)
    }
}
