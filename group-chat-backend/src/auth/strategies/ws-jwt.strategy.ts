import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../user.entity';
import { UsersService } from '../users.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt.payload';
import { AppConfig } from 'src/config/app-config.schema';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'wsjwt') {
    constructor(
        private readonly userService: UsersService,
        private readonly configService: ConfigService<AppConfig>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromUrlQueryParameter('jwt'),
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET_KEY'),
        });
    }

    async validate(payload: JwtPayload): Promise<User | undefined> {
        try {
            const user = await this.userService.findById(payload.sub);
            if (!user) return;
            return user;
        } catch (error) {
            throw new WsException('Unauthorized access');
        }
    }
}
