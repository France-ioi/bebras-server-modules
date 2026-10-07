import {DataRow, GenericCallback, TaskArg} from "../types";
import db from "../libs/db";

export type TaskDataSummaryRow = Omit<DataRow, 'value'> & {value_length: number};

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
    listByTaskId: function(task_id: string, key: string, limit: number): Promise<TaskDataSummaryRow[]> {
        const sql = 'SELECT `id`, `task_id`, `random_seed`, `key`, `duration`, `updated_at`,\
            CHAR_LENGTH(`value`) AS `value_length`\
            FROM `data` WHERE `task_id`=? AND `key`=?\
            ORDER BY `updated_at` DESC LIMIT ?'
        return db.queryAsync<TaskDataSummaryRow[]>(sql, [task_id, key, limit])
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
    readAsync: async function(task_id: string, random_seed: number, key: string): Promise<any> {
        const sql = 'SELECT `value` FROM `data` WHERE `task_id`=? AND `random_seed`=? AND `key`=? LIMIT 1'
        const rows = await db.queryAsync<DataRow[]>(sql, [task_id, random_seed, key])

        return rows.length ? JSON.parse(rows[0].value) : null
    },
    writeAsync: async function(task_id: string, random_seed: number, key: string, value: any, duration: number = 0): Promise<void> {
        const sql = 'INSERT INTO `data`\
            (`task_id`, `random_seed`, `key`, `value`, `duration`)\
            VALUES\
            (?, ?, ?, ?, ?)\
            ON DUPLICATE KEY UPDATE\
            `value` = ?, `duration` = ?'
        const value_str = JSON.stringify(value)
        await db.queryAsync(sql, [task_id, random_seed, key, value_str, duration, value_str, duration])
    },
    deleteAsync: async function(task_id: string, random_seed: number, key: string): Promise<void> {
        const sql = 'DELETE FROM `data` WHERE `task_id`=? AND `random_seed`=? AND `key`=? LIMIT 1'
        await db.queryAsync(sql, [task_id, random_seed, key])
    },
    empty: function(task: TaskArg, callback: GenericCallback) {
        const sql = 'DELETE FROM `data` WHERE `task_id`=?'
        const values = [task.id]
        db.query(sql, values, () => {
            callback()
        })
    }
}