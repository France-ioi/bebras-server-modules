import conf from '../config/storage';

let storage: any;
if (conf.default === 'local') {
    storage = require('./storage_local').default;
} else if (conf.default === 's3') {
    storage = require('./storage_s3').default;
} else {
    throw new Error(`Unsupported storage type: ${conf.default}`);
}

export default storage;
