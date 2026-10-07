import db from "../libs/db";
import {AssetRow} from "../types";

export default {
    find: async function(task_id: string, random_seed: number|string, key: string): Promise<AssetRow|null> {
        const sql = 'SELECT * FROM `assets` WHERE `task_id`=? AND `random_seed` = ? AND `key`=? LIMIT 1'
        const rows = await db.queryAsync<AssetRow[]>(sql, [task_id, random_seed, key])

        return rows.length ? rows[0] : null
    },
    upsert: async function(task_id: string, random_seed: number|string, key: string, path: string): Promise<void> {
        const sql = 'INSERT INTO `assets`\
            (`task_id`, `random_seed`, `key`, `path`)\
            VALUES\
            (?, ?, ?, ?)\
            ON DUPLICATE KEY UPDATE\
            `path` = ?'
        await db.queryAsync(sql, [task_id, random_seed, key, path, path])
    },
    delete: async function(task_id: string, random_seed: number|string, key: string): Promise<void> {
        const sql = 'DELETE FROM `assets` WHERE `task_id`=? AND `random_seed`=? AND `key`=? LIMIT 1'
        await db.queryAsync(sql, [task_id, random_seed, key])
    },
    empty: async function(task_id: string): Promise<void> {
        const sql = 'DELETE FROM `assets` WHERE `task_id`=?'
        await db.queryAsync(sql, [task_id])
    },
}
