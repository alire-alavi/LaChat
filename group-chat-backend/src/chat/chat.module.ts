import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { Message, Conversation, Participant } from './chat.entity';
import { User } from '../auth/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Message, User, Participant, Conversation]), AuthModule],
    providers: [ChatService, ChatGateway, ChatController],
    exports: [ChatService],
})
export class ChatModule {}
