import path from 'path';
import nodeEnvFile from 'node-env-file';
import params from './libs/params';
import express, { Express } from 'express';
import handler from './libs/handler';
import bodyParser from 'body-parser';
import cors from './middleware/cors';
import conf from './config/server';

// Load environment variables from .env file
nodeEnvFile(path.join(__dirname, '.env'));

const app: Express = express();

app.use(bodyParser.urlencoded({ extended: true, limit: conf.request_max_size }));
app.use(bodyParser.json({ limit: conf.request_max_size }));
app.use(cors);

handler(app, params._[0]);

app.listen(params.port, () => {
  console.log(`Serving handler ${params._[0]} on port ${params.port}`);
});
