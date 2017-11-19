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

    url: function(file) {
        return conf.url + '/' + file
    },


    write: function(file, content, callback) {
        params = {
            Key: file,
            Body: content
        }
        s3.putObject(params, callback);
    },


    remove: function(file, callback) {
        params = {
            Key: file
        }
        s3.deleteObject(params, callback)
    }

}