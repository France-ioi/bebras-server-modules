import fs from 'fs';

const graderKeyFile = process.env.TASKS_GRADER_KEY_FILE;

if (!graderKeyFile) {
    throw new Error('TASKS_GRADER_KEY_FILE environment variable is not set');
}

const config = {
    grader_key: fs.readFileSync(graderKeyFile, 'utf8'),
};

export default config;
