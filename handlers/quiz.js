var tokens_api = require('../libs/tokens_api')
var grader_data = require('../repositories/grader_data')
var task_graders = require('../libs/task_graders')
var safeEval = require('safe-eval')

module.exports = {

    path: '/quiz',

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
        },

        versions: function(v, callback) {
            callback(!v, v)
        },

        score_settings: function(v, callback) {
            callback(false, v)
        }
    },


    params: {
        write: ['task_id', 'data'],
        delete: ['task_id'],
        grade: ['task', 'answer', 'versions', 'score_settings'],
        grade2: ['task', 'answer', 'versions', 'score_settings']
    },


    actions: {

        write: function(args, callback) {
            grader_data.write(args.task_id, args.data, callback)
        },


        delete: function(args, callback) {
            grader_data.delete(args.task_id, callback)
        },


        grade: function(args, callback) {
            grader_data.read(args.task, function(error, data) {
                if(error) return callback(error)
                callback(
                    false,
                    task_graders.quiz.gradeAnswer(data, args.answer, args.versions, args.score_settings)
                );
            })
        },

        grade2: function(args, callback) {
            grader_data.read(args.task, function(error, data) {
                if(error) return callback(error)
                callback(
                    false,
                    task_graders.quiz2.gradeAnswer(data, args.answer, args.versions, args.score_settings)
                );
            })
        }
    }
}
