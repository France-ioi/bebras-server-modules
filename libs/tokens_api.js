var fetch = require('isomorphic-fetch')
var config = require('../config')
var jwt = require('jsonwebtoken')


function parseTaskId(url) {
    var params = require('querystring').parse(require('url').parse(url).query)
    return params.taskID ? params.taskID : null
}


module.exports = {

    decodeTask: function(token, callback) {
        var payload = jwt.decode(token)
        var id = parseTaskId(payload.itemUrl)
        if(!id) {
            return callback(new Error('Task token error: taskID missed in itemUrl'))
        }
        var random_seed = parseInt(payload.randomSeed, 10)
        if(!Number.isInteger(random_seed) || random_seed < 0) {
            return callback(new Error('Task token error: randomSeed missed or incorrect'))
        }
        callback(null, {
            id,
            random_seed,
            hints_requested: payload.hintsRequested
        })
    },


    decodeAnswer: function(token, callback) {
        var payload = jwt.decode(token)
        var task_id = parseTaskId(payload.itemUrl)
        if(!task_id) {
            return callback(new Error('Answer token error: taskID missed in itemUrl'))
        }
        var random_seed = parseInt(payload.randomSeed, 10)
        if(!Number.isInteger(random_seed) || random_seed < 0) {
            return callback(new Error('Answer token error: randomSeed missed or incorrect'))
        }
        callback(null, {
            idUserAnswer: payload.idUserAnswer,
            value: payload.sAnswer,
            task_id,
            random_seed
        })
    },


    verify: function(token, callback) {
        if(config.server.dev_mode) {
            return callback()
        }
        var body = JSON.stringify({
            action: 'verify',
            token
        })
        fetch(
            config.tokens.service_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        }).then((response) => {
            return response.json()
        }).then((json) => {
            callback(json.success ? null : new Error('Token verification failed'))
        }).catch((error) => {
            callback(error)
        })
    }

}