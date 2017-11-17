var db = require('../libs/db')

module.exports = {


    help: function() {
        console.log('data:clear - clear expired data')
    },

    clear: function(params, callback) {
        var sql = 'DELETE FROM `data` WHERE duration > 0 AND DATE_ADD(updated_at, INTERVAL `duration` SECOND) < NOW()'
        db.query(sql, [], (res) => {
            console.log(res.affectedRows + ' rows deleted.')
            callback()
        })
    }

}