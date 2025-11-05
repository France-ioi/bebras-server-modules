import db from '../libs/db';
import uuid from 'uuid';
import storage from '../libs/storage';
import base64parser from '../libs/base64parser';
import tokens_api from '../libs/tokens_api';
import {AssetRow, GenericCallback, TaskArg} from "../types";

function get(args: {task: TaskArg, key: string}, callback: (row: AssetRow|null) => void) {
    const sql = 'SELECT * FROM `assets` WHERE `task_id`=? AND `random_seed` = ? AND `key`=? LIMIT 1'
    const values = [args.task.id, args.task.random_seed, args.key]
    db.query<AssetRow[]>(sql, values, (rows) => {
        callback(rows.length ? rows[0] : null)
    })
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
                            const sql = 'INSERT INTO `assets`\
                                (`task_id`, `random_seed`, `key`, `path`)\
                                VALUES\
                                (?, ?, ?, ?)\
                                ON DUPLICATE KEY UPDATE\
                                `path` = ?'
                            const values = [args.task.id, args.task.random_seed, args.key, path, path]
                            db.query(sql, values, () => {
                                callback(false, storage.url(path))
                            })
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
                        const sql = 'DELETE FROM `assets` WHERE `task_id`=? AND `random_seed`=? AND `key`=? LIMIT 1'
                        const values = [args.task.id, args.task.random_seed, args.key]
                        db.query(sql, values, () => {
                            callback()
                        })
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
                const sql = 'DELETE FROM `assets` WHERE `task_id`=?'
                const values = [args.task.id]
                db.query(sql, values, () => {
                    callback()
                })
            })
        }
    },
    custom: function() {

    }
}