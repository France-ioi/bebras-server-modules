import path from 'path';
import nodeEnvFile from 'node-env-file';
import params from './libs/params';
import command from './libs/command';

// Load environment variables from .env file
nodeEnvFile(path.join(__dirname, '.env'));

command(params);
