import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from 'src/auth/guards/ws-jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChatJoinDto, ChatMessageResult, ChatSendMessageDto } from './interfaces/events.data';
import { ServerToClientEvents, ClientToServerEvents } from './interfaces/chat.events';
import { AppConfig } from 'src/config/app-config.schema';

@WebSocketGateway({
    path: '/ws',
    cors: { origin: '*' },
})
@Injectable()
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private logger = new Logger('ChatGateway');
    private onlineUsers: Map<number, number> = new Map(); // userId -> socket count
    private guestSockets: Set<string> = new Set();
    private socketUserMap: Map<string, number | undefined> = new Map();

    private statusInterval?: NodeJS.Timeout;
    private systemMessageInterval?: NodeJS.Timeout;

    constructor(
        private readonly chatService: ChatService,
        private readonly authService: JwtService,
        private readonly configService: ConfigService<AppConfig>,
    ) {}

    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
        this.startStatusBroadcast();
        this.startSystemMessageBroadcast();
    }

    async handleConnection(socket: Socket) {
        try {
            const jwt = socket.handshake.query?.jwt as string | undefined;
            if (jwt) {
                const user = await this.authService.verifyAsync(jwt);
                if (user) {
                    this.socketUserMap.set(socket.id, user.sub);
                    this.incrementOnlineUser(user.sub);
                    const participants = await this.chatService.getUserParticipants(user.sub);
                    socket.emit('CONVERSATIONS', participants);
                    this.logger.debug(
                        `User #${user.name} connected: sockets=${this.onlineUsers.get(user.sub)}`,
                    );
                } else {
                    this.socketUserMap.set(socket.id, undefined);
                    this.guestSockets.add(socket.id);
                    this.logger.debug('Invalid JWT: connected as guest');
                }
            } else {
                this.socketUserMap.set(socket.id, undefined);
                this.guestSockets.add(socket.id);
                this.logger.debug('Guest connected');
            }
        } catch (err) {
            this.socketUserMap.set(socket.id, undefined);
            this.guestSockets.add(socket.id);
            this.logger.debug('Error verifying JWT: connected as guest');
        }
    }

    async handleDisconnect(socket: Socket) {
        const userId = this.socketUserMap.get(socket.id);
        if (userId) {
            this.decrementOnlineUser(userId);
        } else {
            this.guestSockets.delete(socket.id);
        }
        this.socketUserMap.delete(socket.id);
    }

    /**
     * Client connects and requests initial chat history and status.
     */
    @SubscribeMessage('ONLINE')
    async handlOnlineStatus(
        @MessageBody() data: ChatJoinDto,
        @ConnectedSocket() socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    ): Promise<void> {
        const key = data.key;
        try {
            const history = await this.chatService.getRecentMessages();
            const users = this.getOnlineUserCount();
            const lastMsgDate = history.length > 0 ? history[history.length - 1].date : '';
            socket.emit('CHAT_JOIN_RESULT', {
                status_code: 200,
                message: 'OK',
                key,
                result: {
                    last_message: lastMsgDate,
                    participants: users,
                    messages: history,
                },
            });
        } catch (e) {
            socket.emit(
                'CHAT_JOIN_RESULT',
                this.buildWsError('SERVER_ERROR', 'Could not fetch chat history', key, 500),
            );
        }
    }

    /**
     * Client connects and requests initial chat history and status.
     */
    @SubscribeMessage('CHAT_JOIN')
    async handleChatJoin(
        @MessageBody() data: ChatJoinDto,
        @ConnectedSocket() socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    ): Promise<void> {
        const key = data.key;
        const conversationId = data.conversationId;
        try {
            const userId = this.socketUserMap.get(socket.id) || undefined;
            const history = await this.chatService.getConversationMessages(conversationId);
            // const participants = await this.chatService.getConversationParticipants(conversationId);
            const lastMsgDate = history.length > 0 ? history[history.length - 1].date : '';
            const messages = history.map((item) => ({
                id: item.id,
                message: item.message,
                reply_to: item.reply_to ? item.reply_to.id : undefined,
                user: item.user,
                date: item.date.toString(),
            }))
            socket.emit('CHAT_JOIN_RESULT', {
                status_code: 200,
                message: 'OK',
                key,
                result: {
                    last_message: lastMsgDate.toString(),
                    // participants,
                    messages: messages,
                },
            });
        } catch (e) {
            socket.emit(
                'CHAT_JOIN_RESULT',
                this.buildWsError('SERVER_ERROR', 'Could not fetch chat history', key, 500),
            );
        }
    }

    /**
     * Authenticated users send a chat message.
     */
    @UseGuards(WsAuthGuard)
    @SubscribeMessage('CHAT_SEND_MESSAGE')
    async handleChatSendMessage(
        @MessageBody() data: ChatSendMessageDto,
        @ConnectedSocket() socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    ): Promise<void> {
        const key = data.key;
        const message = data.message?.trim();
        const replyTo = data.reply_to;
        const conversationId = data.conversationId;
        const userId = this.socketUserMap.get(socket.id);

        if (!message || message.length < 1 || message.length > 2000) {
            socket.emit(
                'CHAT_SEND_MESSAGE_RESULT',
                this.buildWsError(
                    'INVALID_MESSAGE',
                    'Message must be at least 1 and at most 2000 characters',
                    key,
                    400,
                ),
            );
        }

        // Rate limiting
        const rateStatus = await this.chatService.checkRateLimit(userId!);
        if (!rateStatus.ok) {
            socket.emit(
                'CHAT_SEND_MESSAGE_RESULT',
                this.buildWsError('RATE_LIMIT_EXCEEDED', 'Too many messages sent', key, 429),
            );
        }

        // Prevent duplicate
        if (await this.chatService.isDuplicateMessage(userId!, message)) {
            socket.emit(
                'CHAT_SEND_MESSAGE_RESULT',
                this.buildWsError('DUPLICATE_MESSAGE', 'Duplicate message detected', key, 409),
            );
        }

        // If replying, ensure message exists
        if (replyTo) {
            const exists = await this.chatService.messageExists(replyTo);
            if (!exists) {
                socket.emit(
                    'CHAT_SEND_MESSAGE_RESULT',
                    this.buildWsError(
                        'INVALID_REPLY_TO',
                        'Reply-to message does not exist',
                        key,
                        400,
                    ),
                );
            }
        }

        try {
            const msg = await this.chatService.createUserMessage(userId!, message, conversationId, replyTo);
            this.server.to(conversationId).emit('CHAT_MESSAGE', msg);
            socket.emit('CHAT_SEND_MESSAGE_RESULT', {
                status_code: 200,
                message: 'OK',
                key,
                result: msg,
            });
        } catch (e) {
            this.logger.error(
                `Failed to send message: ${e instanceof Error ? e.message : String(e)}`,
            );
            socket.emit(
                'CHAT_SEND_MESSAGE_RESULT',
                this.buildWsError('SERVER_ERROR', 'Could not send message', key, 500),
            );
        }
    }

    // ---- Helper methods for Online Users ----

    private incrementOnlineUser(userId: number) {
        const cnt = this.onlineUsers.get(userId) || 0;
        this.onlineUsers.set(userId, cnt + 1);
    }

    private decrementOnlineUser(userId: number) {
        const cnt = this.onlineUsers.get(userId) || 0;
        if (cnt > 1) {
            this.onlineUsers.set(userId, cnt - 1);
        } else {
            this.onlineUsers.delete(userId);
        }
    }

    private getOnlineUserCount(): number {
        // Each user counted once, plus all guests
        return this.onlineUsers.size + this.guestSockets.size;
    }

    // ---- Status & System Message Broadcasting ----

    private startStatusBroadcast() {
        const intervalMs = this.configService.get<number>('STATUS_UPDATE_INTERVAL', 60000);
        this.statusInterval = setInterval(() => this.broadcastStatus(), intervalMs);
    }

    private async broadcastStatus() {
        const lastMsg = await this.chatService.getLastMessageDate();
        const users = this.getOnlineUserCount();
        this.server.emit('CHAT_STATUS', {
            last_message: lastMsg,
            users,
        });
    }

    private startSystemMessageBroadcast() {
        const intervalMs = this.configService.get<number>('SYSTEM_MESSAGE_INTERVAL', 300_000);
        this.systemMessageInterval = setInterval(async () => {
            if (await this.chatService.shouldSendSystemMessage()) {
                const msg = await this.chatService.createSystemMessage();
                this.server.emit('CHAT_MESSAGE', msg);
            }
        }, intervalMs);
    }

    // ---- Error formatting ----

    private buildWsError(code: string, details: string, key: string, status = 400) {
        if (status > 500) {
            this.logger.fatal(details);
        }
        return {
            status_code: status,
            error: { code, details },
            key,
        };
    }
}
