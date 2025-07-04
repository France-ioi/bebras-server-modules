import fetch from 'isomorphic-fetch';
import config from '../config';
import jwt from 'jsonwebtoken';
import qs from 'querystring';
import Url from 'url';
import {AnswerTokenPayload, GenericCallback, TaskTokenPayload} from "../types";

function getTaskParams(itemUrl: string) {
    return qs.parse(Url.parse(itemUrl).query!)
}

function getTaskID(params: {taskID?: string}): string|null {
    return params.taskID ? params.taskID : null;
}

export default {
    decodeTask: function(token: string, callback: GenericCallback) {
        let payload: TaskTokenPayload;
        if(typeof token == 'object' && config.server.dev_mode) {
            // Devel option : we send an object instead of a token
            payload = token;
        } else {
            payload = jwt.decode(token) as TaskTokenPayload
        }
        if(!payload) {
            return callback(new Error('Task token error: unparseable token'))
        }
        const params = getTaskParams(payload.itemUrl)
        const task_id = getTaskID(params)
        if(!task_id) {
            return callback(new Error('Task token error: taskID missing from itemUrl'))
        }
        /* XXX No good reason to parse and check random_seed? */
        const random_seed = parseInt(payload.randomSeed, 10)
        if(!Number.isInteger(random_seed) || random_seed < 0) {
            return callback(new Error('Task token error: randomSeed missing or incorrect'))
        }
        callback(null, {
            task_id, /* added for for consistency */
            id: task_id, /* obsolete, kept for compatibility */
            random_seed,
            hints_requested: payload.sHintsRequested,
            params,
            payload,
            token,
            /* Is there a good reason not to pass the full token? */
        })
    },


    decodeAnswer: function(token: string, callback: GenericCallback) {
        let payload: AnswerTokenPayload;
        if(typeof token == 'object' && config.server.dev_mode) {
            // Devel option : we send an object instead of a token
            payload = token;
        } else {
            payload = jwt.decode(token) as AnswerTokenPayload
        }
        const params = getTaskParams(payload.itemUrl)
        const task_id = getTaskID(params)
        if(!task_id) {
            return callback(new Error('Answer token error: taskID missed in itemUrl'))
        }
        const random_seed = parseInt(payload.randomSeed, 10)
        if(!Number.isInteger(random_seed) || random_seed < 0) {
            return callback(new Error('Answer token error: randomSeed missed or incorrect'))
        }
        callback(null, {
            idUserAnswer: payload.idUserAnswer,
            value: payload.sAnswer,
            task_id,
            random_seed,
            hints_requested: payload.sHintsRequested,
            params,
            payload
        })
    },
    verify: function(token: string, callback: GenericCallback) {
        if(config.server.dev_mode) {
            return callback()
        }
        const body = JSON.stringify({
            action: 'verify',
            token
        })
        fetch(
            config.tokens.service_url!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        }).then((response) => {
            return response.json()
        }).then((json) => {
            callback(json.success ? null : new Error('Token verification failed'))
        }).catch((error) => {
            callback(error)
        })
    }
}
