import express, {Express} from 'express'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'
import async from 'async'
import {GenericCallback} from "../types";

function load(name: string) {
    const file = path.resolve(process.cwd(), 'dist/handlers/' + name + '.js')
    if(fs.existsSync(file)) {
        return require(file).default
    }
    console.log(`Handler ${name} not found.`)
    process.exit();
}


function resultSuccess(data: string) {
    return {
        success: true,
        data
    }
}


function resultError(error: any) {
    return {
        success: false,
        error: error.message
    }
}


function actionParams(body: any, handler: any, callback: GenericCallback) {
    const params = handler.params[body.action] || []
    const validators = handler.validators || {}
    const res: any = {}

    async.each(
        params,
        (p: any, callback) => {
            if(!(p in body)) {
                return callback(new Error('Missed param: ' + p))
            }
            if(validators[p]) {
                validators[p](body[p], (error: any, value: any) => {
                    if(error) {
                        return callback(error instanceof Error ? error : new Error(`Invalid parameter: ${p}`))
                    }
                    res[p] = value
                    callback()
                })
            } else {
                res[p] = body[p]
                callback()
            }
        },
        (error) => {
            callback(error, res)
        }
    )
}



function validateTask(task: {id: string, random_seed: any}, callback: GenericCallback) {
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


function verifyBody(body: any, handler: any, callback: any) {
    let args: any = {}
/*
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
*/
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
/*
            })

        })

    })
*/
}


export default function(app: Express, name: string) {
    const handler = load(name)
    app.post(handler.path, (req, res) => {
        verifyBody(req.body, handler, (error: any, action: string, args: any) => {
            if(error) {
                return res.json(resultError(error))
            }
            handler.actions[action](args, (error: any, data: string) => {
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