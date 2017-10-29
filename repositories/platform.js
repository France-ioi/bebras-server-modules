var db = require('../libs/db')

var cache = null

function precache(callback) {
    if(cache === null) {
        var sql = 'SELECT * FROM platforms'
        db.query(sql, (error, rows) => {
            if(error) {
                console.error('Can\'t read platforms table')
                process.exit()
            }
            cache = {}
            rows.map((row) => {
                cache[row.id] = row
            })
            callback()
        })
    } else {
        callback()
    }
}


module.exports = {

    get: function(id, callback) {
        precache(() => {
            if(id in cache) {
                return callback(false, cache[id])
            }
            callback(new Error('Platform not found'))
        })
    }

}