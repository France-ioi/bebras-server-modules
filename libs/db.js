var mysql = require('mysql')
var conf = require('../config/mysql')

var pool = mysql.createPool(conf)

module.exports = {

    pool: function() {
        return pool
    },

    query: function(sql, values, callback) {
        pool.getConnection((error, connection) => {
            if(error) {
                throw error
            }
            connection.query(sql, values, (error, results, fields) => {
                connection.release();
                if(error) {
                    throw error
                } else {
                    callback(results, fields)
                }
            })
        })
    }
}