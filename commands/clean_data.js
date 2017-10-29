var db = require('../libs/db')

module.exports = function(callback) {
    var sql = 'DELETE FROM `data` WHERE duration > 0 AND DATE_ADD(updated_at, INTERVAL `duration` SECOND) < NOW()'
    db.query(sql, [], (res) => {
        console.log(res.affectedRows + ' rows deleted.')
        callback(false)
    })

}