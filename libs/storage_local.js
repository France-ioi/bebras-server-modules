var conf = require('../config/storage')
var fs = require('fs-extra')
var path = require('path')

module.exports = {

    relativePath: function() {
        return conf.local.path
    },

    absolutePath: function(file) {
        return path.resolve(process.cwd(), conf.local.path + '/' + file)
    },


    url: function(file) {
        return conf.url + '/' + file
    },


    write: function(file, content, callback) {
        var absolute_path = this.absolutePath(file)
        fs.ensureDir(path.dirname(absolute_path), (error) => {
            if(error) {
                return callback(error)
            }
            fs.writeFile(absolute_path, content, callback)
        })
    },


    remove: function(file, callback) {
        if(path) {
            return fs.remove(this.absolutePath(file), callback)
        }
        callback()
    }

}