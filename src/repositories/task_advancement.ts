import {DataRow, PlatformRow} from "../types";
import db from "../libs/db";

export default {
    read: async function (userId: string, platform: PlatformRow, key: string) {
        const sql = 'SELECT `value` FROM `task_advancement` WHERE `user_id`=? AND `platform_id`=? AND `key`=? LIMIT 1';
        const values = [userId, platform.id, key];

        const rows = await db.queryAsync<DataRow[]>(sql, values);
        if (!rows.length) {
            return null;
        }

        return rows[0].value;
    },
    write: async function (userId: string, platform: PlatformRow, key: string, value: string, duration: number) {
        const sql = 'INSERT INTO `task_advancement`\
            (`user_id`, `platform_id`, `key`, `value`, `duration`,`updated_at`)\
            VALUES\
            (?, ?, ?, ?, ?, NOW())\
            ON DUPLICATE KEY UPDATE\
            `value` = ?, `duration` = ?, `updated_at` = NOW()'

        const values = [
            userId, platform.id, key, value, duration,
            value, duration
        ];

        await db.queryAsync(sql, values);
    },
}
