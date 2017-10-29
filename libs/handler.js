var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var jwt = require('jsonwebtoken')
var platforms = require('../repositories/platform')


function load(name) {
    var file = path.resolve(process.cwd(), 'handlers/' + name + '.js')
    if(fs.existsSync(file)) {
        return require(file)
    }
    console.log(`Handler ${name} not found.`)
    process.exit();
}


function resultSuccess(data) {
    return _.extend({
        success: true
    }, data)
}


function resultError(error) {
    return {
        success: false,
        error: error.message
    }
}


function actionParams(body, handler, callback) {
    var params = handler.params[body.action] || []
    var validators = handler.validators || {}
    var res = {}
    for(var i=0; i<params.length; i++) {
        var p = params[i];
        if(!(p in body)) {
            return callback(new Error('Missed param: ' + p))
        }
        if(validators[p]) {
            var validation = validators[p](body[p])
            if(validation !== true) {
                return callback(validation)
            }
        }
        res[p] = body[p]
    }
    callback(false, res)
}


function verifyBody(body, handler, callback) {
    var args = {}

    platforms.get(body.platform_id, (error, platform) => {
        if(error) {
            return callback(error)
        }
        jwt.verify(body.token, platform.public_key, (error, task) => {
            if(error) {
                return callback(error)
            }


            if(!Number.isInteger(task.task_id) || task.task_id < 0) {
                return callback(new Error('token.task_id must be an integer, greater than 0'))
            }
            args.task_id = task.task_id

            if(!Number.isInteger(task.random_seed) || task.random_seed < 0) {
                return callback(new Error('token.random_seed must be an integer, greater than 0'))
            }
            args.random_seed = task.random_seed

            if(!handler.actions[body.action]) {
                return callback(new Error('Invalid action'))
            }

            actionParams(body, handler, (error, params) => {
                if(error) {
                    return callback(error)
                }
                args = _.extend(args, params)
                callback(false, body.action, args)
            })
        })
    })
}


module.exports = function(app, name) {
    var handler = load(name)
    app.post(handler.path, (req, res) => {
        verifyBody(req.body, handler, (error, action, args) => {
            if(error) {
                return res.json(resultError(error))
            }
            handler.actions[action](args, (error, data) => {
                if(error) {
                    return res.json(resultError(error))
                }
                res.json(resultSuccess(data))
            })
        })
    })
}