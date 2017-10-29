var conf = require('../config/storage')
var fs = require('fs-extra')


module.exports = {

    localPath: function(path) {
        return process.cwd() + '/' + conf.local.path + '/' + path
    },


    url: function(path) {
        return conf.url + '/' + path
    },


    write: function(path, content, callback) {
        var local_path = this.localPath(path)
        fs.ensureDir(require('path').dirname(local_path), (error) => {
            if(error) {
                return callback(error)
            }
            fs.writeFile(local_path, content, callback)
        })
    },


    remove: function(path, callback) {
        if(path) {
            return fs.remove(this.localPath(path), callback)
        }
        callback()
    }

}