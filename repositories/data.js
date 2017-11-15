var db = require('../libs/db')

module.exports = {

    read: function(task, key, callback) {
        var sql = 'SELECT `value` FROM `data` WHERE `task_id`=? AND `random_seed`=? AND `key`=? LIMIT 1'
        var values = [task.id, task.random_seed, key]
        db.query(sql, values, (rows) => {
            if(rows.length) {
                callback(false, JSON.parse(rows[0].value))
            } else {
                callback(new Error('Data not found'))
            }
        })
    },


    write: function(task, key, value, duration, callback) {
        var sql = 'INSERT INTO `data`\
            (`task_id`, `random_seed`, `key`, `value`, `duration`)\
            VALUES\
            (?, ?, ?, ?, ?)\
            ON DUPLICATE KEY UPDATE\
            `value` = ?, `duration` = ?'

        var value_str = JSON.stringify(value)
        var values = [
            task.id, task.random_seed, key, value_str, duration,
            value_str, duration
        ]
        db.query(sql, values, () => {
            callback()
        })
    },


    delete: function(task, key, callback) {
        var sql = 'DELETE FROM `data` WHERE `task_id`=? AND `random_seed`=? AND `key`=? LIMIT 1'
        var values = [task.id, task.random_seed, key]
        db.query(sql, values, () => {
            callback()
        })
    },


    empty: function(task, callback) {
        var sql = 'DELETE FROM `data` WHERE `task_id`=?'
        var values = [task.id]
        db.query(sql, values, () => {
            callback()
        })
    }

}