var db = require('../libs/db')

var name_cache = null

function precache(callback) {
    if(name_cache === null) {
        var sql = 'SELECT * FROM platforms'
        db.query(sql, (error, rows) => {
            if(error) {
                console.error('Can\'t read platforms table')
                process.exit()
            }
            name_cache = {}
            rows.map((row) => {
                name_cache[row.name] = row
            })
            callback()
        })
    } else {
        callback()
    }
}


module.exports = {

    getByName: function(name, callback) {
        precache(() => {
            if(name in name_cache) {
                return callback(false, name_cache[name])
            }
            callback(new Error('Platform not found'))
        })
    }

}