import db from '../libs/db';

export default {
    help(): void {
        console.log('data:clear - clear expired data');
    },

    clear(params: Record<string, any>, callback: () => void): void {
        const sql = 'DELETE FROM `data` WHERE duration > 0 AND DATE_ADD(updated_at, INTERVAL `duration` SECOND) < NOW()';
        db.query<{affectedRows: number}>(sql, [], (res) => {
            console.log(`${res.affectedRows} rows deleted.`);
            callback();
        });
    }
}
