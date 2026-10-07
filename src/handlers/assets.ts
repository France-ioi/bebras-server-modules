import uuid from 'uuid';
import storage from '../libs/storage';
import base64parser from '../libs/base64parser';
import tokens_api from '../libs/tokens_api';
import assets from '../repositories/assets';
import {AssetRow, GenericCallback, TaskArg} from "../types";

function get(args: {task: TaskArg, key: string}, callback: (row: AssetRow|null) => void) {
    assets.find(args.task.id, args.task.random_seed, args.key).then(callback)
}


export default {
    path: '/assets',

    static: storage.relativePath ? storage.relativePath() : null,

    validators: {
        key: function(v: string, callback: GenericCallback) {
            const valid = v && v.length && v.length < 255
            callback(!valid, v)
        },

        data: function(v: string, callback: GenericCallback) {
            const valid = v && v.length
            callback(!valid, v)
        },

        task: function(v: string, callback: GenericCallback) {
            tokens_api.verify(v, (error) => {
                if(error) return callback(error)
                tokens_api.decodeTask(v, callback)
            })
        }
    },
    params: {
        add: ['task', 'key', 'data'],
        url: ['task', 'key'],
        delete: ['task', 'key'],
        empty: ['task']
    },
    actions: {
        add: function(args: {task: TaskArg, key: string, data: string}, callback: GenericCallback) {
            get(args, (row) => {
                storage.remove(row ? row.path : null, () => {
                    base64parser.createBuffer(args.data, (error, file) => {
                        if(error || !file) {
                            return callback(error)
                        }
                        const path = args.task.id + '/' + uuid.v4() + '.' + file.ext

                        storage.write(path, file.buffer, (error: any) => {
                            if(error) {
                                return callback(error)
                            }
                            assets.upsert(args.task.id, args.task.random_seed, args.key, path)
                                .then(() => callback(false, storage.url(path)), callback)
                        })
                    })
                })
            })
        },
        url: function(args: {task: TaskArg, key: string}, callback: GenericCallback) {
            get(args, (row) => {
                if(row) {
                    callback(false, row ? storage.url(row.path) : null)
                } else {
                    callback(new Error('Data not found'))
                }
            })
        },
        delete: function(args: {task: TaskArg, key: string}, callback: GenericCallback) {
            get(args, (row) => {
                if(row) {
                    storage.remove(row.path, () => {
                        assets.delete(args.task.id, args.task.random_seed, args.key)
                            .then(() => callback(), callback)
                    })
                } else {
                    callback()
                }
            })
        },
        empty: function(args: {task: TaskArg}, callback: GenericCallback) {
            storage.remove(args.task.id, (error: Error|null) => {
                if(error) {
                    return callback(error)
                }
                assets.empty(args.task.id).then(() => callback(), callback)
            })
        }
    },
    custom: function() {

    }
}