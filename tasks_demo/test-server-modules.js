module.exports = {

    config: {
        cache_task_data: true,
    },

    taskData: (args, callback) => {
        callback(false, {
            task_id: args.task.id,
            random_seed: args.task.random_seed
        })
    },

    taskHintData: (args, callback) => {
        callback(false, {
            hints_requested: args.task.hints_requested
        })
    },

    gradeAnswer: (args, callback) => {
        callback(false, {
            score: args.answer_token,
            message: 'Your answer was ' + args.answer_token
        })
    }
}