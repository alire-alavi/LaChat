import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterResponseDto, RegisterUserRequestDto } from './dto/authentication.dto';
import { GetMeResponseDto } from './dto/user.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) {}

    @ApiResponse({
        status: 201,
        description: 'The user has successfully created.',
        type: RegisterResponseDto,
    })
    @Post('me')
    async register(@Body() dto: RegisterUserRequestDto): Promise<RegisterResponseDto> {
        return this.authService.register(dto.user_name ?? '');
    }

    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiOkResponse({
        type: GetMeResponseDto,
    })
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@Req() req): Promise<GetMeResponseDto> {
        // req.user is populated by JwtStrategy
        const user = req.user;
        return {
            user_id: user.id,
            user_name: user.user_name,
            created: user.created.toISOString(),
        };
    }
}
