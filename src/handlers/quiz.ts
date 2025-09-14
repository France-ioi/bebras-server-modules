import tokensApi from '../libs/tokens_api';
import graderData from '../repositories/grader_data';
import taskGraders from '../libs/task_graders';
// @ts-ignore
import safeEval from 'safe-eval';
import jwt from 'jsonwebtoken';
import config from '../config/tasks';
import {GenericCallback, ScoreSettings, TaskArg} from "../types";

function algoreaFormatDate(date: Date) {
    const d = date.getDate()
    const m = date.getMonth() + 1
    // Algorea TokenParser format: d-m-Y
    return (d < 10 ? '0' + d : d) + '-' + (m < 10 ? '0' + m : m) + '-' + date.getFullYear()
}

function makeGradeAnswer(gradeFunc: (data: string, answer: string, versions: string, score_settings: ScoreSettings) => any) {
    return function (args: { task: TaskArg, answer: string, versions: any, score_settings: ScoreSettings }, callback: GenericCallback) {
        graderData.read(args.task, function (error, data) {
            if (error) return callback(error)

            const gradingResult = gradeFunc(data, args.answer, args.versions, args.score_settings);

            const scoreToken = {
                score: gradingResult.score,
                idUser: args.task.payload.idUser,
                idTask: args.task.payload.idTask,
                itemUrl: args.task.payload.itemUrl,
                platformName: args.task.payload.platformName,
                randomSeed: args.task.payload.randomSeed,
                idAttempt: args.task.payload.idAttempt,
                date: algoreaFormatDate(new Date())
            };
            const result = {
                ...gradingResult,
                token: jwt.sign(scoreToken, config.grader_key, { algorithm: 'RS512' })
            };
            callback(false, result);
        })
    }
}

export default {
    path: '/quiz',

    validators: {

        task_id: function(v: string, callback: GenericCallback) {
            const valid = v.length
            callback(!valid, v)
        },


        data: function(v: string, callback: GenericCallback) {
            try {
                safeEval(v)
            } catch(e) {
                return callback(true, v)
            }
            callback(false, v)
        },

        task: function(v: string, callback: GenericCallback) {
            tokensApi.verify(v, (error) => {
                if(error) return callback(error)
                tokensApi.decodeTask(v, callback)
            })
        },

        answer: function(v: string, callback: GenericCallback) {
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

        versions: function(v: string, callback: GenericCallback) {
            callback(!v, v)
        },

        score_settings: function(v: string, callback: GenericCallback) {
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

        write: function(args: {task_id: string, data: string}, callback: GenericCallback) {
            graderData.write(args.task_id, args.data, callback)
        },


        delete: function(args: {task_id: string}, callback: GenericCallback) {
            graderData.delete(args.task_id, callback)
        },


        grade: makeGradeAnswer(taskGraders.quiz.gradeAnswer),
        grade2: makeGradeAnswer(taskGraders.quiz2.gradeAnswer)
    }
}
