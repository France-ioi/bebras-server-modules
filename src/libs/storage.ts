import conf from '../config/storage';

type Callback = (err: Error | null) => void;

export interface Storage {
    url(file: string): string,
    write(file: string, content: string | Buffer, callback: Callback): void,
    remove(file: string|null, callback: Callback): void,
    relativePath(): string|undefined,
    absolutePath(file: string): string,
}

let storage: Storage;
if (conf.default === 'local') {
    storage = require('./storage_local').default;
} else if (conf.default === 's3') {
    storage = require('./storage_s3').default;
} else {
    throw new Error(`Unsupported storage type: ${conf.default}`);
}

export default storage;
