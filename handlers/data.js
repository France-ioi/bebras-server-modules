var db = require('../libs/db')

module.exports = {

    path: '/data',

    validators: {
        key: function(v) {
            return v && v.length && v.length < 255 ? true : 'Invalid key format'
        },

        value: function(v) {
            return v && v.length ? true : 'Invalid value format'
        },

        duration: function(v) {
            return v == parseInt(v, 10) && v >= 0 ? true : 'Invalid duration format'
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
            var sql = 'SELECT `value` FROM `data` WHERE `task_id`=? AND `random_seed`=? AND `key`=? LIMIT 1'
            var values = [args.task_id, args.random_seed, args.key]
            db.query(sql, values, (rows) => {
                callback(false, {
                    value: rows.length ? rows[0].value : null
                })
            })
        },


        write: function(args, callback) {
            var sql = 'INSERT INTO `data`\
                (`task_id`, `random_seed`, `key`, `value`, `duration`)\
                VALUES\
                (?, ?, ?, ?, ?)\
                ON DUPLICATE KEY UPDATE\
                `value` = ?, `duration` = ?'
            var values = [args.task_id, args.random_seed, args.key, args.value, args.duration, args.value, args.duration]
            db.query(sql, values, () => {
                callback(false, {})
            })
        },


        delete: function(args, callback) {
            var sql = 'DELETE FROM `data` WHERE `task_id`=? AND `random_seed`=? AND `key`=? LIMIT 1'
            var values = [args.task_id, args.random_seed, args.key]
            db.query(sql, values, () => {
                callback(false, {})
            })
        },


        empty: function(args, callback) {
            var sql = 'DELETE FROM `data` WHERE `task_id`=?'
            var values = [args.task_id]
            db.query(sql, values, () => {
                callback(false, {})
            })
        }
    }
}