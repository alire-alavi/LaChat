import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Conversation, Message, Participant } from './chat.entity';
import { User } from '../auth/user.entity';
import { UsersService } from '../auth/users.service';
import { ConfigService } from '@nestjs/config';
import { ChatMessageResult } from './interfaces/events.data';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    private readonly historyLimit: number;
    private readonly rateLimitCount: number;
    private readonly rateLimitWindowMs: number;
    private readonly systemMsgInterval: number;
    private readonly statusUpdateInterval: number;
    private readonly systemMsgText: string;

    // For system message activity check
    private lastUserMessageDate?: Date;

    constructor(
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Participant)
        private readonly participantRepo:Repository<Participant>,
        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
    ) {
        this.historyLimit = this.configService.get<number>('CHAT_HISTORY', 50);
        this.rateLimitCount = this.configService.get<number>('CHAT_MAX_MESSAGES_PER_MINUTE', 10);
        this.rateLimitWindowMs = 60_000;
        this.systemMsgInterval = this.configService.get<number>('SYSTEM_MESSAGE_INTERVAL', 300_000);
        this.statusUpdateInterval = this.configService.get<number>(
            'STATUS_UPDATE_INTERVAL',
            60_000,
        );
        this.systemMsgText = this.configService.get<string>(
            'SYSTEM_MESSAGE',
            'Welcome to the chat!',
        );
    }

    /**
     * Return the most recent N messages for history.
     */
    async getRecentMessages(): Promise<ChatMessageResult[]> {
        const messages = await this.messageRepo.find({
            order: { date: 'DESC' },
            take: this.historyLimit,
            relations: ['user'],
        });
        // Return in chronological order
        return messages.reverse().map((msg) => this.mapMessageToResult(msg));
    }

    /**
     * Return the timestamp of the last message.
     */
    // TODO: remove null
    async getLastMessageDate(): Promise<string | undefined> {
        const last = await this.messageRepo.find({
            order: { date: 'DESC' },
            select: ['date'],
        });
        return last[0]?.date?.toISOString();
    }

    async getUserParticipants(userId: string): Promise<Participant[] | undefined> {
        const results = await this.participantRepo.find({
            where: { user: { id: Number(userId) } },
            relations: ['conversation'],
        });
        return results.map((participant: Participant) => ({
            ...participant,
            conversation: {
                ...participant.conversation,
                id: participant.conversation.id,
                name: participant.conversation.name,
            },
        }));
    }

    async getConversationMessages(conversationId: string, pageSize: number = 20, page: number = 1): Promise<Message[]> {
        const results = await this.messageRepo
            .createQueryBuilder("message")
            .leftJoinAndSelect("message.sender", "user")
            .where("message.conversationId = :conversationId", { conversationId  })
            .orderBy("message.sentAt", "DESC") // for reverse chronological
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .select([
              "message.id",
              "message.content",
              "message.sentAt",
              "user.id",
              "user.username"
            ])
            .getMany();
        return results;
    }

    /**
     * Store a user message and update lastUserMessageDate.
     */
    async createUserMessage(
        userId: number,
        conversationId: string,
        message: string,
        replyTo?: number,
    ): Promise<ChatMessageResult> {
        const result = await this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.participants', 'participant')
            .leftJoinAndSelect('participant.conversation', 'conversation')
            .where('user.id = :userId', { userId })
            .andWhere('conversation.id = :conversationId', { conversationId })
            .getOne();

        if (!result || !result.participants.some((p) => p.conversation.id === conversationId)) {
            throw new Error('User or conversation not found, or user is not a participant');
        }

        const user = result;
        const conv = result.participants.some((p) => p.conversation);

        const participant = await this.participantRepo.findOne({
            where: { user: { id: userId }, conversation: { id: conversationId } },
        });

        if (!participant) {
            throw new Error('User is not a participant in the conversation');
        }

        let replyMsg: Message | undefined = undefined;
        if (replyTo) {
            const msgRepoResponse = await this.messageRepo.findOne({ where: { id: replyTo } });
            if (msgRepoResponse) {
                replyMsg = msgRepoResponse;
            } else {
                throw new Error('Reply message does not exist');
            }
        }

        const msg = this.messageRepo.create({
            user: user,
            message: message,
            date: new Date(),
            reply_to: replyMsg,
        });
        await this.messageRepo.save(msg);
        this.lastUserMessageDate = msg.date;
        return this.mapMessageToResult(msg);
    }

    /**
     * Store a system message (sent by the server, not a user).
     */
    async createSystemMessage(): Promise<ChatMessageResult> {
        const msg = this.messageRepo.create({
            user: undefined,
            message: this.systemMsgText,
            date: new Date(),
            reply_to: undefined,
        });
        await this.messageRepo.save(msg);
        // Do not update lastUserMessageDate for system messages
        return this.mapMessageToResult(msg);
    }

    /**
     * Check if a user has exceeded the rate limit of messages per minute.
     */
    async checkRateLimit(userId: number): Promise<{ ok: boolean }> {
        const since = new Date(Date.now() - this.rateLimitWindowMs);
        const count = await this.messageRepo.count({
            where: {
                user: { id: userId },
                date: MoreThan(since),
            },
        });
        if (count >= this.rateLimitCount) {
            return { ok: false };
        }
        return { ok: true };
    }

    /**
     * Prevent duplicate messages (same user, same message, last 5 min).
     */
    async isDuplicateMessage(userId: number, message: string): Promise<boolean> {
        const since = new Date(Date.now() - 5 * 60_000);
        const existing = await this.messageRepo.findOne({
            where: {
                user: { id: userId },
                message,
                date: MoreThan(since),
            },
        });
        return !!existing;
    }

    /**
     * Check if a message exists by ID.
     */
    async messageExists(messageId: number): Promise<boolean> {
        const msg = await this.messageRepo.findOne({ where: { id: messageId } });
        return !!msg;
    }

    /**
     * Whether to send a system message (activity since last system message).
     */
    async shouldSendSystemMessage(): Promise<boolean> {
        if (!this.lastUserMessageDate) {
            // No user message since start
            return false;
        }
        const sinceLastSystemMsg = new Date(Date.now() - this.systemMsgInterval);
        return this.lastUserMessageDate > sinceLastSystemMsg;
    }

    /**
     * Map a Message entity to the API response format.
     */
    private mapMessageToResult(msg: Message): ChatMessageResult {
        return {
            id: msg.id,
            user: msg.user
                ? {
                      user_id: msg.user.id,
                      user_name: msg.user.user_name,
                  }
                : undefined,
            message: msg.message,
            date: msg.date.toISOString(),
            reply_to: msg.reply_to ? msg.reply_to.id : undefined,
        };
    }
}
