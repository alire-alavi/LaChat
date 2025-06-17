import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err, user, info, context: ExecutionContext) {
        if (err || !user) {
            throw new UnauthorizedException({
                status_code: 401,
                error: { code: 'INVALID_TOKEN', details: 'Invalid or expired token' },
            });
        }
        return user;
    }
}
