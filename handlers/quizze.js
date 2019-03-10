var tokens_api = require('../libs/tokens_api')
var graders = require('../repositories/graders')
var grader = require('../libs/grader')
var safeEval = require('safe-eval')

module.exports = {

    path: '/quizze',

    validators: {

        task_id: function(v, callback) {
            var valid = v.length
            callback(!valid, v)
        },


        data: function(v, callback) {
            try {
                safeEval(v)
            } catch(e) {
                return callback(true, v)
            }
            callback(false, v)
        },

        task: function(v, callback) {
            tokens_api.verify(v, (error) => {
                if(error) return callback(error)
                tokens_api.decodeTask(v, callback)
            })
        },

        answer: function(v, callback) {
            if(v.length) {
                return callback(false, v)
            }
            try {
                v = JSON.parse(v)
            } catch(e) {
                return callback(true, v)
            }
            callback(false, v)
        }
    },


    params: {
        write: ['task_id', 'data'],
        delete: ['task_id'],
        grade: ['task', 'answer']
    },


    actions: {

        write: function(args, callback) {
            graders.write(args.task_id, args.data, callback)
        },


        delete: function(args, callback) {
            graders.delete(args.task_id, callback)
        },


        grade: function(args, callback) {
            graders.read(args.task, function(error, data) {
                if(error) return callback(error)
                callback(
                    false,
                    grader.gradeAnswer(data, args.answer, callback)
                );
            })
        }
    }
}