import { Controller, Get, Param, Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { Participant } from './chat.entity';

@Controller('chat')
export class ChatController {
    private readonly logger = new Logger(ChatController.name);

    constructor(private readonly chatService: ChatService) {}

    @UseGuards(JwtAuthGuard)
    @Get('participants/:userId')
    async getUserParticipants(@Param('userId') userId: string): Promise<Participant[] | undefined> {
        this.logger.log(`Fetching participants for user ID: ${userId}`);
        return this.chatService.getUserParticipants(userId);
    }
}
