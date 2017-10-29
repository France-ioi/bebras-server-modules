var conf = require('../config/storage')
var AWS = require('aws-sdk')
var s3 = new AWS.S3({
    accessKeyId: conf.s3.key,
    secretAccessKey: conf.s3.secret,
    region: conf.s3.region,
    params: {
        Bucket: conf.s3.bucket
    }
})


module.exports = {

    url: function(path) {
        return conf.url + '/' + path
    },


    write: function(path, content, callback) {
        params = {
            Key: path,
            Body: content
        }
        s3.putObject(params, callback);
    },


    remove: function(path, callback) {
        params = {
            Key: path
        }
        s3.deleteObject(params, callback)
    }

}