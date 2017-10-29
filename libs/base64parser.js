var mime = require('mime')

module.exports = {
    createBuffer: function(data, callback) {
        var regex = /^data:(.+);base64,(.*)$/
        var m = data.match(regex)
        if(m.length != 3) {
            callback(new Error('Can\'t parse base64 data'))
        }
        callback(false, {
            ext: mime.getExtension(m[1]),
            buffer: new Buffer(m[2], 'base64')
        })
    }
}