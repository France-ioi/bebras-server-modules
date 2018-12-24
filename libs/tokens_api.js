var fetch = require('isomorphic-fetch')
var config = require('../config')
var jwt = require('jsonwebtoken')
var qs = require('querystring')
var Url = require('url')

function getTaskParams(itemUrl) {
    return qs.parse(Url.parse(itemUrl).query)
}
function getTaskID(params) {
    return params.taskID ? params.taskID : null;
}

module.exports = {

    decodeTask: function(token, callback) {
        if(typeof token == 'object' && config.server.dev_mode) {
            // Devel option : we send an object instead of a token
            var payload = token;
        } else {
            var payload = jwt.decode(token)
        }
        if(!payload) {
            return callback(new Error('Task token error: unparseable token'))
        }
        var params = getTaskParams(payload.itemUrl)
        var task_id = getTaskID(params)
        if(!task_id) {
            return callback(new Error('Task token error: taskID missing from itemUrl'))
        }
        /* XXX No good reason to parse and check random_seed? */
        var random_seed = parseInt(payload.randomSeed, 10)
        if(!Number.isInteger(random_seed) || random_seed < 0) {
            return callback(new Error('Task token error: randomSeed missing or incorrect'))
        }
        callback(null, {
            task_id, /* added for for consistency */
            id: task_id, /* obsolete, kept for compatibility */
            random_seed,
            hints_requested: payload.sHintsRequested,
            params,
            payload
            /* Is there a good reason not to pass the full token? */
        })
    },


    decodeAnswer: function(token, callback) {
        if(typeof token == 'object' && config.server.dev_mode) {
            // Devel option : we send an object instead of a token
            var payload = token;
        } else {
            var payload = jwt.decode(token)
        }
        var params = getTaskParams(payload.itemUrl)
        var task_id = getTaskID(params)
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
            random_seed,
            params,
            payload
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
