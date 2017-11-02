var db = require('../libs/db')
var uuid = require('uuid')
var storage = require('../libs/storage')
var base64parser = require('../libs/base64parser')


function get(args, callback) {
    var sql = 'SELECT * FROM `assets` WHERE `task_id`=? AND `random_seed` = ? AND `key`=? LIMIT 1'
    var values = [args.task_id, args.random_seed, args.key]
    db.query(sql, values, (rows) => {
        callback(rows.length ? rows[0] : null)
    })
}


module.exports = {

    path: '/asset',

    validators: {
        key: function(v) {
            return v && v.length && v.length < 255 ? true : new Error('Invalid key format')
        },

        data: function(v) {
            return v && v.length ? true : new Error('Invalid data format')
        }
    },


    params: {
        add: ['key', 'data'],
        url: ['key'],
        delete: ['key'],
        empty: []
    },


    actions: {

        add: function(args, callback) {
            get(args, (row) => {
                storage.remove(row ? row.path : null, () => {
                    base64parser.createBuffer(args.data, (error, file) => {
                        if(error) {
                            return callback(error)
                        }
                        var path = args.task_id + '/' + uuid.v4() + '.' + file.ext

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
                            var values = [args.task_id, args.random_seed, args.key, path, path]
                            db.query(sql, values, () => {
                                callback(false, {
                                    data: storage.url(path)
                                })
                            })
                        })
                    })
                })
            })
        },


        url: function(args, callback) {
            get(args, (row) => {
                if(row) {
                    callback(false, {
                        data: row ? storage.url(row.path) : null
                    })
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
                        var values = [args.task_id, args.random_seed, args.key]
                        db.query(sql, values, () => {
                            callback(false, {})
                        })
                    })
                } else {
                    callback(false, {});
                }
            })
        },


        empty: function(args, callback) {
            storage.remove(args.task_id, (error) => {
                if(error) {
                    return callback(error)
                }
                var sql = 'DELETE FROM `assets` WHERE `task_id`=?'
                var values = [args.task_id]
                db.query(sql, values, () => {
                    callback(false, {})
                })
            })
        }
    }
}