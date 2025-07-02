import mysql, { Pool, PoolConnection, FieldInfo } from 'mysql';
import conf from '../config/mysql';

const pool: Pool = mysql.createPool(conf);

type QueryCallback<T> = (results: T, fields: FieldInfo[] | undefined) => void;

const db = {
    pool(): Pool {
        return pool;
    },

    query<T>(sql: string, values: any[], callback: QueryCallback<T>): void {
        pool.getConnection((error: mysql.MysqlError | null, connection: PoolConnection | undefined) => {
            if (error) {
                throw error;
            }

            connection!.query(
              sql,
              values,
              (error: mysql.MysqlError | null, results: any, fields: FieldInfo[] | undefined) => {
                  connection!.release();

                  if (error) {
                      throw error;
                  } else {
                      callback(results, fields);
                  }
              }
            );
        });
    },
};

export default db;
