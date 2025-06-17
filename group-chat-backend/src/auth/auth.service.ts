import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { AppConfig } from 'src/config/app-config.schema';
import { RegisterResponseDto } from './dto/authentication.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<AppConfig>,
    ) {}

    async login(username: string, pass: string): Promise<> {
        const user = await this.usersService.findByName(username);
        if (!user) {
            throw new UnauthorizedException({
                status_code: 401,
                error: { code: 'INCORRECT_CREDENTIALS', detail: 'Incorrect pass or username' },
            });
        }
        if (pass)
    }

    async register(user_name: string, pass: string): Promise<RegisterResponseDto> {
        const existing = await this.usersService.findByName(user_name);
        if (existing) {
            throw new ConflictException({
                status_code: 409,
                error: { code: 'USER_NAME_EXISTS', details: 'user_name already exists' },
            });
        }

        const secretPassphrase = this.configService.get<string>('SECRET_PASSPHRASE', '1234');
        if (pass != secretPassphrase) {
            throw new UnauthorizedException({
                status_code: 401,
                error: { code: 'INCORRECT_PASSPHRASE', detail: 'Incorrect passphrase' },
            });
        }

        const user = await this.usersService.createUser(user_name);
        const payload = {
            sub: user.id,
            uid: user.id,
            name: user.user_name,
        };
        const token = this.jwtService.sign(payload);
        return {
            token,
            user: {
                user_id: user.id,
                user_name: user.user_name,
                created: user.created.toISOString(),
            },
        };
    }

    async getUserFromToken(token: string): Promise<any> {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.getOrThrow<string>('JWT_SECRET_KEY'),
                issuer: this.configService.get<string>('JWT_ISSUER', 'example.com'),
            });
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new UnauthorizedException({
                    status_code: 404,
                    error: { code: 'USER_NOT_FOUND', details: 'User not found' },
                });
            }
            return {
                user_id: user.id,
                user_name: user.user_name,
                created: user.created.toISOString(),
            };
        } catch (err) {
            throw new UnauthorizedException({
                status_code: 401,
                error: { code: 'INVALID_TOKEN', details: 'Invalid or expired token' },
            });
        }
    }
}
