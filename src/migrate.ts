import path from 'path';
import 'node-env-file';
import db from './libs/db';
import migrations from 'mysql-migrations';

require('node-env-file')(path.join(__dirname, '.env'));
migrations.init(db.pool(), path.join(__dirname, 'migrations'));