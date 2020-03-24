var db = require('../libs/db')

module.exports = {

    read: function(task, callback) {
        console.log(task)
        var sql = 'SELECT `data` FROM `graders` WHERE `task_id`=? LIMIT 1'
        var values = [task.id]
        db.query(sql, values, (rows) => {
            if(rows.length) {
                callback(false, rows[0].data)
            } else {
                callback(new Error('Data not found'))
            }
        })
    },


    write: function(task_id, data, callback) {
        var sql = 'INSERT INTO `graders`\
            (`task_id`, `data`)\
            VALUES\
            (?, ?)\
            ON DUPLICATE KEY UPDATE\
            `data` = ?'
        var values = [task_id, data, data]
        db.query(sql, values, () => {
            callback()
        })
    },


    delete: function(task_id, callback) {
        var sql = 'DELETE FROM `graders` WHERE `task_id`=? LIMIT 1'
        var values = [task_id]
        db.query(sql, values, () => {
            callback()
        })
    }

}