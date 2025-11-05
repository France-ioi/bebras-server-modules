import fs from 'fs';
import path from 'path';
import conf from '../config/server';

function formatDir(dir: string): string {
    const items: string[] = [];
    fs.readdirSync(process.cwd() + '/dist' + dir).forEach(file => {
        items.push(file.replace('.js', ''));
    });
    return items.join(', ');
}

function mainFile(): string {
    // `process.mainModule` is deprecated, using `require.main`
    return path.basename(require.main?.filename ?? '').replace(/\.ts/, '.js');
}

export default {
    server(): void {
        const text = `
Usage:
    node dist/${mainFile()} HANDLER [options]
Handlers:
    ${formatDir('/handlers')}
Options:
    -p, --port <n>  Port to listen on (default port ${conf.port})
`;
        console.log(text);
    },

    console(): void {
        const text = `
Usage:
    node dist/${mainFile()} COMMAND
Commands:
    ${formatDir('/commands')}
`;
        console.log(text);
    },
}
