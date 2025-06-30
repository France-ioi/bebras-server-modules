import db from '../libs/db';
import {PlatformRow} from "../types";

type Callback<T = any> = (error: Error | false | null, result?: T) => void;

let nameCache: Record<string, PlatformRow> | null = null;

function precache(callback: () => void): void {
    if (nameCache === null) {
        const sql = 'SELECT * FROM platforms';
        db.query<PlatformRow[]>(sql, [], (rows) => {
            nameCache = {};
            rows.forEach(row => {
                nameCache![row.name] = row;
            });
            callback();
        });
    } else {
        callback();
    }
}

export default {
    getByName(name: string, callback: Callback<PlatformRow>): void {
        precache(() => {
            if (nameCache && name in nameCache) {
                return callback(false, nameCache[name]);
            }
            callback(new Error('Platform not found'));
        });
    },
};
