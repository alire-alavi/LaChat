interface ChatJoinDto {
    key: string;
}

interface ChatSendMessageDto {
    key: string;
    message: string;
    reply_to?: number;
}

interface ChatMessageResult {
    id: number;
    user?: {
        user_id?: number;
        user_name?: string;
    };
    message: string;
    date: string;
    reply_to?: number;
}

interface ChatJoinResponse {
    status_code: number;
    message: string;
    key: string;
    result: {
        last_message: string;
        users: number;
        messages: ChatMessageResult[];
    };
}

interface ChatSendMessageResponse {
    status_code: number;
    message: string;
    key: string;
    result: ChatMessageResult;
}

interface ChatWsErrorResponse {
    status_code: number;
    error: {
        code: string;
        details: string;
    };
    key: string;
}

export {
    ChatWsErrorResponse,
    ChatJoinDto,
    ChatSendMessageDto,
    ChatSendMessageResponse,
    ChatJoinResponse,
    ChatMessageResult,
};
