import { ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        example: 'alireza',
        description: 'The username of the new user, cannot exist already',
    })
    user_name?: string;
}

export class UserResponseDto {
    user_id!: number;

    @ApiProperty({ example: 'alireza', description: 'Username' })
    user_name!: string;

    created!: string;
}

export class RegisterUserRequestDto {
    @ApiProperty({ example: 'alireza', description: 'Username' })
    @IsString()
    @Length(4, 16)
    @Matches(/^[a-zA-Z0-9\-_.(){}\[\]\\]+$/, {
        message: 'Usename cannot inlcude special characters',
    })
    user_name!: string;
    passphrase!: string;
}

export class RegisterResponseDto {
    @ApiProperty({ description: 'JWT Authorization token for registered user' })
    token!: string;

    @ApiProperty({ type: UserResponseDto })
    user!: UserResponseDto;
}
