import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WsJwtStrategy } from './strategies/ws-jwt.strategy';
import { AppConfig } from 'src/config/app-config.schema';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        PassportModule,
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService<AppConfig>],
            useFactory: (configService: ConfigService<AppConfig>) => ({
                secret: configService.getOrThrow<string>('JWT_SECRET_KEY'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_LIFETIME', '1d'),
                    issuer: configService.get<string>('JWT_ISSUER', 'example.com'),
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, UsersService, JwtStrategy, WsJwtStrategy],
    exports: [UsersService, JwtModule],
})
export class AuthModule {}
