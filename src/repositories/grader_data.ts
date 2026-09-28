import db from "../libs/db"
import {GenericCallback, GraderRow, TaskArg} from "../types";

const TASK_DIR_MAX_LENGTH = 500

function normalizeTaskDir(task_dir: any): string|null {
    if ('string' !== typeof task_dir) {
        return null
    }
    const trimmed = task_dir.trim()

    return trimmed.length ? trimmed.slice(0, TASK_DIR_MAX_LENGTH) : null
}

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
    /* Matches either the task id or the task dir. */
    search: function(query: string, limit: number): Promise<GraderRow[]> {
        const sql = 'SELECT `task_id`, `task_dir` FROM `graders`\
            WHERE `task_id` LIKE ? OR `task_dir` LIKE ?\
            ORDER BY `task_id` LIMIT ?'
        const like = '%' + query + '%'
        return db.queryAsync<GraderRow[]>(sql, [like, like, limit])
    },

    findByTaskDir: async function(task_dir: string): Promise<GraderRow|null> {
        const sql = 'SELECT `task_id`, `task_dir` FROM `graders` WHERE `task_dir`=? LIMIT 1'
        const rows = await db.queryAsync<GraderRow[]>(sql, [task_dir])

        return rows.length ? rows[0] : null
    },

    readByTaskId: async function(task_id: string): Promise<GraderRow|null> {
        const sql = 'SELECT `task_id`, `data`, `task_dir` FROM `graders` WHERE `task_id`=? LIMIT 1'
        const rows = await db.queryAsync<GraderRow[]>(sql, [task_id])

        return rows.length ? rows[0] : null
    },
    write: function(task_id: string, data: string, task_dir: string|null, callback: GenericCallback) {
        const sql = 'INSERT INTO `graders`\
            (`task_id`, `data`, `task_dir`)\
            VALUES\
            (?, ?, ?)\
            ON DUPLICATE KEY UPDATE\
            `data` = ?, `task_dir` = COALESCE(?, `task_dir`)'
        const dir = normalizeTaskDir(task_dir)
        const values = [task_id, data, dir, data, dir]
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
