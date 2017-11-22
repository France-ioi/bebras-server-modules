var data = require('../repositories/data')
var tokens_api = require('../libs/tokens_api')

module.exports = {

    path: '/data',

    validators: {
        key: function(v, callback) {
            var valid = v.length && v.length < 255
            callback(!valid, v)
        },

        value: function(v, callback) {
            var valid = v.length
            callback(!valid, v)
        },

        duration: function(v, callback) {
            var valid = v == parseInt(v, 10) && v >= 0
            callback(!valid, v)
        },

        task: function(v, callback) {
            tokens_api.verify(v, (error) => {
                if(error) return callback(error)
                tokens_api.decodeTask(v, callback)
            })
        }
    },


    params: {
        read: ['task', 'key'],
        write: ['task', 'key','value','duration'],
        delete: ['task', 'key'],
        empty: ['task']
    },


    actions: {

        read: function(args, callback) {
            data.read(args.task, args.key, callback)
        },


        write: function(args, callback) {
            data.write(args.task, args.key, args.value, args.duration, callback)
        },


        delete: function(args, callback) {
            data.delete(args.task, args.key, callback)
        },


        empty: function(args, callback) {
            data.empty(args.task, callback)
        }
    }
}