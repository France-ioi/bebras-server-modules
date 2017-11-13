module.exports = {

    taskData: (args) => {
        return {
            task_id: args.task.id,
            random_seed: args.task.random_seed
        }
    },

    taskHintData: (args) => {
        return {
            hintsRequested: args.hintsRequested
        }
    },

    gradeAnswer: (args) => {
        return {
            score: args.answer,
            message: 'Your answer was ' + args.answer
        }
    }
}