import jwt from 'jsonwebtoken';
import config from '../config/tasks';
import data_repo from '../repositories/task_data';
import tokens_api from '../libs/tokens_api';
import {GenericCallback, TaskArg} from "../types";
import {loadTask} from "../libs/tasks";

//TODO: watch tasks dir and reset modules cache?
/*
function requireUncached(module){
    delete require.cache[require.resolve(module)]
    return require(module)
}
*/
const TASK_DATA_KEY = '___TASK_DATA'


async function loadTaskData(obj: any, args: {task: TaskArg}, callback: GenericCallback) {
    if(!obj.config || !obj.config.cache_task_data) {
        try {
            await obj.taskData(args, callback)
        } catch (ex) {
            callback(ex);
        }
        return;
    }

    data_repo.read(args.task, TASK_DATA_KEY, async (error, data) => {
        if(!error) return callback(null, data)
        try {
            await obj.taskData(args, (error: Error|null, data: any) => {
                if (error) return callback(error)
                data_repo.write(args.task, TASK_DATA_KEY, data, 0, (error) => {
                    callback(error, data)
                })
            });
        } catch (ex) {
            callback(ex);
        }
    })
}

function algoreaFormatDate(date: Date) {
    const d = date.getDate()
    const m = date.getMonth() + 1
    // Algorea TokenParser format: d-m-Y
    return (d < 10 ? '0' + d : d) + '-' + (m < 10 ? '0' + m : m) + '-' + date.getFullYear()
}


export default {

    path: '/tasks',

    validators: {

        task: function(v: string, callback: GenericCallback) {
            tokens_api.verify(v, (error) => {
                if(error) return callback(error)
                tokens_api.decodeTask(v, callback)
            })
        },

        answer: function(v: string, callback: GenericCallback) {
            tokens_api.verify(v, (error) => {
                if(error) return callback(error)
                tokens_api.decodeAnswer(v, callback)
            })
        },

        min_score: function(v: any, callback: GenericCallback) {
            const valid = v == parseInt(v, 10) && v >= 0
            callback(!valid, v)
        },

        max_score: function(v: any, callback: GenericCallback) {
            const valid = v == parseInt(v, 10) && v >= 0
            callback(!valid, v)
        },

        no_score: function(v: any, callback: GenericCallback) {
            const valid = v == parseInt(v, 10) && v >= 0
            callback(!valid, v)
        },

        request: function(v: string, callback: GenericCallback) {
            callback(null, v);
        },
    },
    params: {
        taskData: ['task'],
        taskHintData: ['task'],
        gradeAnswer: ['task', 'answer', 'min_score', 'max_score', 'no_score'],
        requestHint: ['task', 'request'],
    },
    actions: {
        taskData: function(args: {task: TaskArg}, callback: GenericCallback) {
            loadTask(args.task.id, 'taskData', (error, obj) => {
                if(error) return callback(error)
                loadTaskData(obj, args, function (error, result) {
                    if(error) return callback(error)

                    callback(null, result.publicData ? result.publicData : result);
                });
            })
        },
        taskHintData: function(args: {task: TaskArg}, callback: GenericCallback) {
            loadTask(args.task.id, 'taskHintData', (error, obj) => {
                if (error) return callback(error)
                loadTaskData(obj, args, async (error, task_data) => {
                    if(error) return callback(error)
                    try {
                        await obj!.taskHintData(args, task_data, callback)
                    } catch (ex) {
                        return callback(ex);
                    }
                })
            })
        },
        gradeAnswer: function(args: {task: TaskArg, answer: {payload: any}}, callback: GenericCallback) {
            loadTask(args.task.id, 'gradeAnswer', (error, obj) => {
                if (error) return callback(error)
                loadTaskData(obj, args, async (error, task_data) => {
                    if(error) return callback(error)
                    try {
                        await obj!.gradeAnswer(args, task_data, (error, data: any) => {
                            if (error) return callback(error);
                            for (let key of ['idUser', 'idItem', 'itemUrl', 'idUserAnswer', 'idItemLocal']) {
                                data[key] = args.answer.payload[key];
                            }
                            data.date = algoreaFormatDate(new Date)
                            data.token = jwt.sign(data, config.grader_key, {algorithm: 'RS512'})
                            callback(false, data)
                        })
                    } catch (ex) {
                        return callback(ex);
                    }
                })
            })
        },
        requestHint: function(args: {task: TaskArg}, callback: GenericCallback) {
            loadTask(args.task.id, 'taskData', async (error, obj) => {
                if(error) return callback(error)
                /* Task's requestHint is expected to return the askedHint*/
                try {
                    await obj!.requestHint(args, (error, askedHint: any) => {
                        if(error) return callback(error);
                        const payload = {askedHint: askedHint, date: algoreaFormatDate(new Date)};
                        const hintToken = jwt.sign(payload, config.grader_key, {algorithm: 'RS512'});
                        callback(null, {hintToken: hintToken});
                    });
                } catch (ex) {
                    callback(ex);
                }
            })
       },
    }
}