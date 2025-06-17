import { ApiProperty } from '@nestjs/swagger';

export class GetMeResponseDto {
    @ApiProperty({
        example: 12,
        description: 'User ID',
    })
    user_id!: number;

    @ApiProperty({
        example: 'alireza123',
        description: 'Username',
    })
    user_name!: string;

    @ApiProperty({
        example: '2025-03-11T21:35:00.000Z',
        description: 'Timestamp of user creation',
    })
    created!: string;
}
