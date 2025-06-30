import {GenericCallback, TaskArg} from "../types";

export default {
    config: {
        cache_task_data: true,
    },

    taskData: (args: {task: TaskArg}, callback: GenericCallback) => {
        callback(false, {
            task_id: args.task.id,
            random_seed: args.task.random_seed
        })
    },

    taskHintData: (args: {task: TaskArg}, task_data: any, callback: GenericCallback) => {
        callback(false, {
            task_data,
            hints_requested: args.task.hints_requested
        })
    },

    gradeAnswer: (args: {task: TaskArg, answer: {value: string}}, task_data: any, callback: GenericCallback) => {
        callback(false, {
            task_data,
            score: args.answer.value,
            message: 'Your answer was ' + args.answer.value
        })
    }
}