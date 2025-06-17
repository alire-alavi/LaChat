import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class AppConfig {
    @IsString()
    JWT_SECRET_KEY!: string;

    @IsString()
    SECRET_PASSPHRASE!: string;

    @IsString()
    @IsOptional()
    JWT_LIFETIME: string = '1d';

    @IsString()
    @IsOptional()
    JWT_ISSUER: string = 'example.com';

    @IsString()
    @IsOptional()
    DATABASE_URL?: string;

    @IsString()
    DATABASE_HOST!: string;

    @IsBoolean()
    DATABASE_SYNC!: boolean;

    @IsNumber()
    DATABASE_PORT!: number;

    @IsString()
    DATABASE_NAME!: string;

    @IsString()
    DATABASE_PASSWORD!: string;

    @IsString()
    DATABASE_USER!: string;

    @IsNumber()
    @IsOptional()
    APP_PORT: number = 3000;

    @IsNumber()
    @IsOptional()
    SYSTEM_MESSAGE_INTERVAL: number = 60000;

    @IsString()
    @IsOptional()
    SYSTEM_MESSAGE: string = 'Welcome to the Group Chat!';

    @IsNumber()
    STATUS_UPDATE_INTERVAL: number = 120000;

    @IsNumber()
    @IsOptional()
    CHAT_HISTORY: number = 100;

    @IsNumber()
    @IsOptional()
    CHAT_MAX_MESSAGES_PER_MINUTE: number = 10;
}
