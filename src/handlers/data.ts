import {GenericCallback} from "../types";
import data from "../repositories/task_data";
import tokens_api from "../libs/tokens_api";
import task_advancement from "../repositories/task_advancement";

export default {
    path: '/data',

    validators: {
        key: function(v: string, callback: GenericCallback<string>) {
            const valid = v.length && v.length < 255
            callback(!valid, v)
        },

        value: function(v: string, callback: GenericCallback<string>) {
            const valid = v.length
            callback(!valid, v)
        },

        duration: function(v: any, callback: GenericCallback<string>) {
            const valid = v === parseInt(v, 10) && v >= 0;
            callback(!valid, v)
        },

        task: function(v: string, callback: GenericCallback<string>) {
            tokens_api.verify(v, (error) => {
                if(error) return callback(error)
                tokens_api.decodeTask(v, callback)
            })
        }
    },


    params: {
        read: ['task', 'key'],
        write: ['task', 'key','value','duration'],
        readTaskAdvancement: ['task', 'key'],
        writeTaskAdvancement: ['task', 'key','value','duration'],
        delete: ['task', 'key'],
        empty: ['task']
    },


    actions: {

        read: function(args: {task: any, key: string}, callback: GenericCallback) {
            data.read(args.task, args.key, callback)
        },


        write: function(args: {task: any, key: string, value: string, duration: number}, callback: GenericCallback) {
            data.write(args.task, args.key, args.value, args.duration, callback)
        },


        delete: function(args: {task: any, key: string}, callback: GenericCallback) {
            data.delete(args.task, args.key, callback)
        },


        empty: function(args: {task: any}, callback: GenericCallback) {
            data.empty(args.task, callback)
        },

        readTaskAdvancement: async function(args: {task: any, key: string}, callback: GenericCallback) {
            const {userId, platform} = await tokens_api.extractUserAndPlatform(args.task);
            try {
                const value = await task_advancement.read(userId, platform, args.key);
                callback(null, value);
            } catch (error) {
                callback(error);
            }
        },

        writeTaskAdvancement: async function(args: {task: any, key: string, value: string, duration: number}, callback: GenericCallback) {
            const {userId, platform} = await tokens_api.extractUserAndPlatform(args.task);
            await task_advancement.write(userId, platform, args.key, args.value, args.duration);
            callback();
        },
    }
}