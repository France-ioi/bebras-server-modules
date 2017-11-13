var jwt = require('jsonwebtoken')
var path = require('path')
var fs = require('fs')
var config = require('../config/tasks')


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
            callTask('taskData', args, callback)
        },


        taskHintData: function(args, callback) {
            callTask('taskHintData', args, callback)
        },


        gradeAnswer: function(args, callback) {
            callTask('gradeAnswer', args, callback)
        }

    }
}