import db from "../libs/db"
import {GenericCallback, GraderRow, TaskArg} from "../types";

export default {
    read: function(task: TaskArg, callback: GenericCallback) {
        const sql = 'SELECT `data` FROM `graders` WHERE `task_id`=? LIMIT 1'
        const values = [task.id]
        db.query<GraderRow[]>(sql, values, (rows) => {
            if(rows.length) {
                callback(false, rows[0].data)
            } else {
                callback(new Error('Data not found'))
            }
        })
    },
    write: function(task_id: string, data: string, callback: GenericCallback) {
        const sql = 'INSERT INTO `graders`\
            (`task_id`, `data`)\
            VALUES\
            (?, ?)\
            ON DUPLICATE KEY UPDATE\
            `data` = ?'
        const values = [task_id, data, data]
        db.query(sql, values, () => {
            callback()
        })
    },
    delete: function(task_id: string, callback: GenericCallback) {
        const sql = 'DELETE FROM `graders` WHERE `task_id`=? LIMIT 1'
        const values = [task_id]
        db.query(sql, values, () => {
            callback()
        })
    }
}
