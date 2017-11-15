var data = require('../repositories/data')

module.exports = {

    path: '/data',

    validators: {
        key: function(v) {
            return v && v.length && v.length < 255 ? v : new Error('Invalid key format')
        },

        value: function(v) {
            return v && v.length ? v : new Error('Invalid value format')
        },

        duration: function(v) {
            return v == parseInt(v, 10) && v >= 0 ? v : new Error('Invalid duration format')
        }
    },


    params: {
        read: ['key'],
        write: ['key','value','duration'],
        delete: ['key'],
        empty: []
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