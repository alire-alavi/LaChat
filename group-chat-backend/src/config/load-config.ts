import * as yaml from 'yaml';
import * as fs from 'fs';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AppConfig } from './app-config.schema';

export function loadConfig(): AppConfig {
    const configPath = 'config.yaml';
    const raw = yaml.parse(fs.readFileSync(configPath, 'utf8'));
    const config = plainToInstance(AppConfig, raw, { enableImplicitConversion: true });
    const errors = validateSync(config, { skipMissingProperties: false });
    if (errors.length > 0) {
        throw new Error('Config yaml file error: ' + JSON.stringify(errors));
    }
    return config;
}
