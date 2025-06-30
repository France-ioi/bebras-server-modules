var db = require('../libs/db')
var uuid = require('uuid')
var storage = require('../libs/storage')
var base64parser = require('../libs/base64parser')
var tokens_api = require('../libs/tokens_api')


function get(args, callback) {
    var sql = 'SELECT * FROM `assets` WHERE `task_id`=? AND `random_seed` = ? AND `key`=? LIMIT 1'
    var values = [args.task.id, args.task.random_seed, args.key]
    db.query(sql, values, (rows) => {
        callback(rows.length ? rows[0] : null)
    })
}


module.exports = {

    path: '/assets',

    static: storage.relativePath ? storage.relativePath() : null,

    validators: {
        key: function(v, callback) {
            var valid = v && v.length && v.length < 255
            callback(!valid, v)
        },

        data: function(v, callback) {
            var valid = v && v.length
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
        add: ['task', 'key', 'data'],
        url: ['task', 'key'],
        delete: ['task', 'key'],
        empty: ['task']
    },


    actions: {

        add: function(args, callback) {
            get(args, (row) => {
                storage.remove(row ? row.path : null, () => {
                    base64parser.createBuffer(args.data, (error, file) => {
                        if(error) {
                            return callback(error)
                        }
                        var path = args.task.id + '/' + uuid.v4() + '.' + file.ext

                        storage.write(path, file.buffer, (error) => {
                            if(error) {
                                return callback(error)
                            }
                            var sql = 'INSERT INTO `assets`\
                                (`task_id`, `random_seed`, `key`, `path`)\
                                VALUES\
                                (?, ?, ?, ?)\
                                ON DUPLICATE KEY UPDATE\
                                `path` = ?'
                            var values = [args.task.id, args.task.random_seed, args.key, path, path]
                            db.query(sql, values, () => {
                                callback(false, storage.url(path))
                            })
                        })
                    })
                })
            })
        },


        url: function(args, callback) {
            get(args, (row) => {
                if(row) {
                    callback(false, row ? storage.url(row.path) : null)
                } else {
                    callback(new Error('Data not found'))
                }
            })
        },


        delete: function(args, callback) {
            get(args, (row) => {
                if(row) {
                    storage.remove(row.path, () => {
                        var sql = 'DELETE FROM `assets` WHERE `task_id`=? AND `random_seed`=? AND `key`=? LIMIT 1'
                        var values = [args.task.id, args.task.random_seed, args.key]
                        db.query(sql, values, () => {
                            callback()
                        })
                    })
                } else {
                    callback()
                }
            })
        },


        empty: function(args, callback) {
            storage.remove(args.task.id, (error) => {
                if(error) {
                    return callback(error)
                }
                var sql = 'DELETE FROM `assets` WHERE `task_id`=?'
                var values = [args.task.id]
                db.query(sql, values, () => {
                    callback()
                })
            })
        }
    },

    custom: function(app) {

    }
}