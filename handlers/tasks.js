var jwt = require('jsonwebtoken')
var path = require('path')
var fs = require('fs')
var config = require('../config/tasks')
var data_repo = require('../repositories/data')

//TODO: watch tasks dir and reset modules cache?
/*
function requireUncached(module){
    delete require.cache[require.resolve(module)]
    return require(module)
}
*/


function callTask(method, args, callback) {
    var file = path.resolve(process.cwd(), config.path + '/' + args.task.id + '.js')
    fs.access(file, (fs.constants || fs).R_OK, (error) => {
        if(error) {
            return callback(new Error('Task not found'))
        }
        var task = require(file)
        if(method in task) {
            try {
                var data = task[method](args)
                if(method == 'gradeAnswer') {
                    data.token = jwt.sign(data, config.answer_key)
                }
                return callback(false, { data })
            } catch(error) {
                return callback(error)
            }
        }
        return callback(new Error('Task does not support ${method} method'))
    })

}


function loadTask(task_id, method, callback) {
    var file = path.resolve(process.cwd(), config.path + '/' + task_id + '.js')
    fs.access(file, (fs.constants || fs).R_OK, (error) => {
        if(error) {
            return callback(new Error('Task not found'))
        }
        var obj = require(file)
        if(method in obj) {
            return callback(false, obj)
        }
        return callback(new Error('Task does not support ${method} method'))
    })
}


function taskDataCache(task, callback) {
    data.read(task, 'taskData', function(error, data) {
        if(error) {
            task.taskData()
            // return callback(error)
        }
    })
}



module.exports = {

    path: '/tasks',

    validators: {
        answer_token: function(v, platform) {
            try {
                var answer = jwt.verify(v, platform.public_key)
            } catch(error) {
                return new Error('Invalid answer_token')
            }
            return answer
        },

        min_score: function(v) {
            return v == parseInt(v, 10) ? v : new Error('Invalid min_score format')
        },

        max_score: function(v) {
            return v == parseInt(v, 10) ? v : new Error('Invalid max_score format')
        },

        no_score: function(v) {
            return v == parseInt(v, 10) ? v : new Error('Invalid no_score format')
        }
    },


    params: {
        taskData: [],
        taskHintData: [],
        gradeAnswer: ['answer_token', 'min_score', 'max_score', 'no_score'],
    },


    actions: {

        taskData: function(args, callback) {
            loadTask(args.task.id, 'taskData', (error, obj) => {
                if(error) {
                    return callback(error)
                }
                if(!obj.config.cache_task_data) {
                    return obj.taskData(args, callback)
                }
                data_repo.read(args.task, '___TASK_DATA', (error, data) => {
                    if(!error) {
                        return callback(false, data)
                    }
                    obj.taskData(args, (error, data) => {
                        if(error) {
                            callback(error)
                        }
                        data_repo.write(args.task, '___TASK_DATA', data, 0, (error) => {
                            callback(error, data)
                        })
                    })
                })
            })
        },


        taskHintData: function(args, callback) {
            loadTask(args.task.id, 'taskHintData', (error, obj) => {
                if(error) return callback(error)
                obj.taskHintData(args, callback)
            })
        },


        gradeAnswer: function(args, callback) {
            loadTask(args.task.id, 'gradeAnswer', (error, obj) => {
                if(error) return callback(error)
                obj.gradeAnswer(args, (error, data) => {
                    if(error) return callback(error)
                    data.token = jwt.sign(data, config.answer_key)
                    callback(false, data)
                })
            })
        }

    }
}