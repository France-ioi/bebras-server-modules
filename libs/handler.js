var express = require('express')
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
    return {
        success: true,
        data
    }
}


function resultError(error) {
    return {
        success: false,
        error: error.message
    }
}


function actionParams(body, handler, platform, callback) {
    var params = handler.params[body.action] || []
    var validators = handler.validators || {}
    var res = {}
    for(var i=0; i<params.length; i++) {
        var p = params[i];
        if(!(p in body)) {
            return callback(new Error('Missed param: ' + p))
        }
        if(validators[p]) {
            var value = validators[p](body[p], platform)
            if(value instanceof Error) {
                return callback(value)
            }
            res[p] = value
        } else {
            res[p] = body[p]
        }
    }
    callback(false, res)
}


function validateTask(task, callback) {
    if(!task.id) {
        return callback(new Error('Task id missed'))
    }
    task.id = task.id.toString()
    task.random_seed = parseInt(task.random_seed, 10)
    if(!Number.isInteger(task.random_seed) || task.random_seed < 0) {
        return callback(new Error('Task random_seed must be an integer, greater than 0'))
    }
    callback()
}


function verifyBody(body, handler, callback) {
    var args = {}

    platforms.get(body.platform_id, (error, platform) => {
        if(error) {
            return callback(error)
        }

        args.platform = platform

        jwt.verify(body.token, platform.public_key, (error, task) => {
            if(error) {
                return callback(error)
            }

            validateTask(task, (error) => {
                if(error) {
                    return callback(error)
                }

                args.task = task

                if(!handler.actions[body.action]) {
                    return callback(new Error('Invalid action'))
                }

                actionParams(body, handler, platform, (error, params) => {
                    if(error) {
                        return callback(error)
                    }
                    args = _.extend(args, params)
                    callback(false, body.action, args)
                })

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
    if(handler.static) {
        app.use('/' + handler.static, express.static(handler.static))
    }
}