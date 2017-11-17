var fs = require('fs')
var path = require('path')

var file = path.resolve(process.cwd(), 'tasks.json')
var data = fs.existsSync(file) ? require(file) : {}


function save(callback) {
    fs.writeFile(file, JSON.stringify(data, null, '  '), 'utf8', callback)
}


module.exports = {

    help: function(params, callback) {
        console.log('task:add id path')
    },


    add: function(params, callback) {
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


    remove: function(params, callback) {
        if(!params._[1]) {
            callback(new Error('Task id missed'))
        }
        if(params._[1] in data) {
            delete(data[params._[1]])
            return save(callback)
        }
        callback(new Error('Task not found'))
    },


    list: function(params, callback) {
        console.log(`ID\tPath`)
        for(var id in data) {
            console.log(`${id}\t${data[id]}`)
        }
        callback()
    },


    clear: function(params, callback) {
        data = {}
        save(callback)
    }

}