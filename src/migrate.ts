/// <reference path="./types/shim.d.ts" />

import 'dotenv/config';
import path from 'path';
import db from './libs/db';
import migrations from 'mysql-migrations';

migrations.init(db.pool(), path.join(__dirname, 'migrations'));
