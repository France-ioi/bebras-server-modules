import db from "../libs/db";
import {AiGenerationCacheRow} from "../types";

export type CachedGenerationWithTaskDir = AdminGenerationRow & {task_dir: string|null};

export type AdminGenerationRow = AiGenerationCacheRow & {platform_name: string|null};

export interface TaskUsage {
    users: number;
    generations: number;
    last_generation_date: string|null;
}

const COLUMN_NAMES = [
    'id', 'generation_id', 'generation_result', 'expires_at',
    'task_id', 'user_id', 'platform_id', 'prompt', 'model', 'generation_type', 'created_at',
]

/* BIGINT ids above 2^53 lose precision as JS numbers : read them back as strings. */
const BIGINT_COLUMNS = ['generation_id', 'user_id', 'platform_id']

/* Cache columns under the `c` alias, with the platform name joined in from `platforms` (alias `p`). */
const COLUMNS = COLUMN_NAMES.map(name => BIGINT_COLUMNS.includes(name)
    ? 'CAST(c.`' + name + '` AS CHAR) AS `' + name + '`'
    : 'c.`' + name + '`').join(', ') + ', p.`name` AS `platform_name`'

const FROM = '`ai_generations_cache` c LEFT JOIN `platforms` p ON p.`id` = c.`platform_id`'

export default {
    findByTaskId: function(task_id: string, limit: number): Promise<AdminGenerationRow[]> {
        const sql = 'SELECT ' + COLUMNS + ' FROM ' + FROM + '\
            WHERE c.`task_id`=?\
            ORDER BY c.`created_at` DESC, c.`id` DESC\
            LIMIT ?'
        return db.queryAsync<AdminGenerationRow[]>(sql, [task_id, limit])
    },

    /* Every generation cached by one user of one platform on one task. */
    findBySet: function(task_id: string, user_id: string, platform_id: string, limit: number): Promise<AdminGenerationRow[]> {
        const sql = 'SELECT ' + COLUMNS + ' FROM ' + FROM + '\
            WHERE c.`task_id`=? AND c.`user_id`=? AND c.`platform_id`=?\
            ORDER BY c.`created_at` DESC, c.`id` DESC\
            LIMIT ?'
        return db.queryAsync<AdminGenerationRow[]>(sql, [task_id, user_id, platform_id, limit])
    },

    /* No expiry filter here: the panel shows expired entries as expired, rather than as missing. */
    findByGenerationId: async function(generation_id: string): Promise<AdminGenerationRow|null> {
        const sql = 'SELECT ' + COLUMNS + ' FROM ' + FROM + ' WHERE c.`generation_id`=? LIMIT 1'
        const rows = await db.queryAsync<AdminGenerationRow[]>(sql, [generation_id])

        return rows.length ? rows[0] : null
    },

    /* Latest generations across all tasks, with the task dir joined in from `graders`. */
    recent: function(limit: number): Promise<CachedGenerationWithTaskDir[]> {
        const sql = 'SELECT ' + COLUMNS + ', g.`task_dir`\
            FROM ' + FROM + '\
            LEFT JOIN `graders` g ON g.`task_id` = c.`task_id`\
            ORDER BY c.`created_at` DESC, c.`id` DESC\
            LIMIT ?'
        return db.queryAsync<CachedGenerationWithTaskDir[]>(sql, [limit])
    },

    /* Quota accounting, from the separate `ai_generations` table. */
    usageForTask: async function(task_id: string): Promise<TaskUsage> {
        const sql = 'SELECT COUNT(*) AS `users`, COALESCE(SUM(`generations`), 0) AS `generations`,\
            MAX(`last_generation_date`) AS `last_generation_date`\
            FROM `ai_generations` WHERE `task_id`=?'
        const rows = await db.queryAsync<TaskUsage[]>(sql, [task_id])

        return rows.length ? rows[0] : {users: 0, generations: 0, last_generation_date: null}
    },
}
