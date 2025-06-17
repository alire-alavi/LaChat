import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { Message } from './chat.entity';
import { User } from '../auth/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Message, User]), AuthModule],
    providers: [ChatService, ChatGateway],
    exports: [ChatService],
})
export class ChatModule {}
