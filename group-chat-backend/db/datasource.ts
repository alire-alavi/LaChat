import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as yaml from 'yaml';

const YAML_CONF = yaml.parse(fs.readFileSync('config.yaml', 'utf8'));

export default new DataSource({
    type: 'postgres',
    // url: YAML_CONF['DATABASE_URL'],
    host: YAML_CONF['DATABASE_HOST'],
    username: YAML_CONF['DATABASE_USER'],
    password: YAML_CONF['DATABASE_PASSWORD'],
    database: YAML_CONF['DATABASE_NAME'],
    port: YAML_CONF['DATABASE_PORT'],
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/db/migrations/*.js'],
    migrationsTableName: 'migrations',
    migrationsRun: false,
    synchronize: YAML_CONF['DATABASE_SYNC'],
    logging: process.env.ENV !== 'production',
    extra: {
        connectionLimit: 10,
    },
});
