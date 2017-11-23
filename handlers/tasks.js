var jwt = require('jsonwebtoken')
var path = require('path')
var fs = require('fs')
var config = require('../config/tasks')
var data_repo = require('../repositories/data')
var tokens_api = require('../libs/tokens_api')

//TODO: watch tasks dir and reset modules cache?
/*
function requireUncached(module){
    delete require.cache[require.resolve(module)]
    return require(module)
}
*/
var TASK_DATA_KEY = '___TASK_DATA'

//TODO: move to repositories
var file = path.resolve(process.cwd(), 'tasks.json')
var data = fs.existsSync(file) ? require(file) : {}


function getFile(task_id) {
    if(!(task_id in data)) {
        return null;
    }
    return path.resolve(process.cwd(), data[task_id])
}


function loadTask(task_id, method, callback) {
    var file = getFile(task_id)
    if(!file) {
        return callback(new Error('Task not found'))
    }

    function obj() {
        var obj = require(file)
        if(method in obj) {
            return callback(false, obj)
        }
        return callback(new Error('Task does not support ${method} method'))
    }

    var id = require.resolve(file)
    if(require.cache[id]) {
        return obj()
    }

    fs.access(file, (fs.constants || fs).R_OK, (error) => {
        if(error) {
            return callback(new Error('Task file not found'))
        }
        obj()
    })
}



function loadTaskData(obj, args, callback) {
    if(!obj.config || !obj.config.cache_task_data) {
        callback(null, obj.taskData(args, callback))
    }
    data_repo.read(args.task, TASK_DATA_KEY, (error, data) => {
        if(!error) return callback(null, data)
        obj.taskData(args, (error, data) => {
            if(error) return callback(error)
            data_repo.write(args.task, TASK_DATA_KEY, data, 0, (error) => {
                callback(error, data)
            })
        })
    })
}

function today() {
    var now = new Date
    var d = now.getDate()
    var m = now.getMonth() + 1
    // Algorea TokenParser format: d-m-Y
    return (d < 10 ? '0' + d : d) + '-' + (m < 10 ? '0' + m : m) + '-' + now.getFullYear()
}


module.exports = {

    path: '/tasks',

    validators: {

        task: function(v, callback) {
            tokens_api.verify(v, (error) => {
                if(error) return callback(error)
                tokens_api.decodeTask(v, callback)
            })
        },

        answer: function(v, callback) {
            tokens_api.verify(v, (error) => {
                if(error) return callback(error)
                tokens_api.decodeAnswer(v, callback)
            })
        },

        min_score: function(v, callback) {
            var valid = v == parseInt(v, 10) && v >= 0
            callback(!valid, v)
        },

        max_score: function(v, callback) {
            var valid = v == parseInt(v, 10) && v >= 0
            callback(!valid, v)
        },

        no_score: function(v, callback) {
            var valid = v == parseInt(v, 10) && v >= 0
            callback(!valid, v)
        }
    },


    params: {
        taskData: ['task'],
        taskHintData: ['task'],
        gradeAnswer: ['task', 'answer', 'min_score', 'max_score', 'no_score'],
    },


    actions: {

        taskData: function(args, callback) {
            loadTask(args.task.id, 'taskData', (error, obj) => {
                if(error) return callback(error)
                loadTaskData(obj, args, callback)
            })
        },


        taskHintData: function(args, callback) {
            loadTask(args.task.id, 'taskHintData', (error, obj) => {
                if(error) return callback(error)
                loadTaskData(obj, args, (error, task_data) => {
                    if(error) return callback(error)
                    obj.taskHintData(args, task_data, callback)
                })
            })
        },


        gradeAnswer: function(args, callback) {
            loadTask(args.task.id, 'gradeAnswer', (error, obj) => {
                if(error) return callback(error)
                loadTaskData(obj, args, (error, task_data) => {
                    if(error) return callback(error)
                    obj.gradeAnswer(args, task_data, (error, data) => {
                        if(error) return callback(error)
                        data.idUserAnswer = args.answer.idUserAnswer
                        data.date = today()
                        data.token = jwt.sign(data, config.grader_key, {algorithm: 'RS512'})
                        callback(false, data)
                    })
                })
            })
        }

    }
}