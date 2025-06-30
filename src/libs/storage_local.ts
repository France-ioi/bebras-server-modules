import fs from 'fs-extra';
import path from 'path';
import conf from '../config/storage';

type Callback = (err?: Error | null) => void;

export default {
    relativePath(): string|undefined {
        return conf.local.path;
    },

    absolutePath(file: string): string {
        return path.resolve(process.cwd(), `${conf.local.path}/${file}`);
    },

    url(file: string): string {
        return `${conf.url}/${file}`;
    },

    write(file: string, content: string | Buffer, callback: Callback): void {
        const absolutePath = this.absolutePath(file);
        fs.ensureDir(path.dirname(absolutePath), (error) => {
            if (error) {
                return callback(error);
            }
            fs.writeFile(absolutePath, content, callback);
        });
    },

    remove(file: string, callback: Callback): void {
        fs.remove(this.absolutePath(file), callback);
    }
}
