import {DataRow, GenericCallback, TaskArg} from "../types";
import db from "../libs/db";

export default {
    read: function(task: TaskArg, key: string, callback: GenericCallback) {
        const sql = 'SELECT `value` FROM `data` WHERE `task_id`=? AND `random_seed`=? AND `key`=? LIMIT 1'
        const values = [task.id, task.random_seed, key]
        db.query<DataRow[]>(sql, values, (rows) => {
            if(rows.length) {
                callback(false, JSON.parse(rows[0].value))
            } else {
                callback(new Error('Data not found'))
            }
        })
    },
    write: function(task: TaskArg, key: string, value: string, duration: number, callback: GenericCallback) {
        const sql = 'INSERT INTO `data`\
            (`task_id`, `random_seed`, `key`, `value`, `duration`)\
            VALUES\
            (?, ?, ?, ?, ?)\
            ON DUPLICATE KEY UPDATE\
            `value` = ?, `duration` = ?'

        const value_str = JSON.stringify(value)
        const values = [
            task.id, task.random_seed, key, value_str, duration,
            value_str, duration
        ]
        db.query(sql, values, () => {
            callback()
        })
    },
    delete: function(task: TaskArg, key: string, callback: GenericCallback) {
        const sql = 'DELETE FROM `data` WHERE `task_id`=? AND `random_seed`=? AND `key`=? LIMIT 1'
        const values = [task.id, task.random_seed, key]
        db.query(sql, values, () => {
            callback()
        })
    },
    empty: function(task: TaskArg, callback: GenericCallback) {
        const sql = 'DELETE FROM `data` WHERE `task_id`=?'
        const values = [task.id]
        db.query(sql, values, () => {
            callback()
        })
    }
}