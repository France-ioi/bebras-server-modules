import parseArgs from 'mri';
import conf from '../config/server';
import help from './help';

type Params = {
    port: number;
    _: string[];
    [key: string]: any;
};

const params: Params = parseArgs(process.argv.slice(2), {
    default: {
        port: conf.port || 3000,
    },
    alias: {
        p: 'port',
    },
    unknown(opt: string): boolean {
        console.error(`Option "${opt}" is unknown.`);
        help.server();
        process.exit(1);
    },
});

if (!params._[0]) {
    console.error(`Handler param missed.`);
    help.server();
    process.exit(1);
}

export default params;
