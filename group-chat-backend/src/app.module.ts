import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { loadConfig } from './config/load-config';
import { AppConfig } from './config/app-config.schema';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [loadConfig],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AppConfig>) => ({
                type: 'postgres',
                // url: configService.get<string>('DATABASE_URL'),
                database: configService.get<string>('DATABASE_NAME'),
                port: configService.get<number>('DATABASE_PORT'),
                host: configService.get<string>('DATABASE_HOST'),
                username: configService.get<string>('DATABASE_USER'),
                password: configService.get<string>('DATABASE_PASSWORD'),
                autoLoadEntities: true,
                synchronize: configService.get<boolean>('DATABASE_SYNC', true),
                ssl: false,
            }),
        }),
        ChatModule,
        AuthModule,
    ],
    providers: [Logger],
})
export class AppModule {}
