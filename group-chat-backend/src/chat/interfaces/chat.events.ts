import { ChatWsErrorResponse, ChatJoinResponse, ChatSendMessageResponse } from './events.data';

export interface ServerToClientEvents {
    CHAT_SEND_MESSAGE_RESULT: (data: ChatSendMessageResponse | ChatWsErrorResponse) => void;
    CHAT_JOIN_RESULT: (data: ChatJoinResponse | ChatWsErrorResponse) => void;
}

export interface ClientToServerEvents {
    joinRoom: (room: string) => void;
    sendMessage: (data: string) => void;
}
