# LaChat Group Chat Backend Nest Based

# API and Socket Docs

- For Rest api docs use swagger on localhost:3000/api
    - includes user registeration and user read APIs

---
### Socket Events

#### WebSocket Endpoint
- **URL:** `ws://<host>:3000/ws`
- **Protocol:** Socket.IO
- **Authorization** Use the JWT token from `POST /auth/me` endpoint

#### Event Table
| Event Name                  | Direction         | Auth Required | Purpose                        |
|-----------------------------|------------------|---------------|---------------------------------|
| `CHAT_JOIN`                 | Client → Server  | No            | Initial connection setup        |
| `CHAT_JOIN_RESULT`          | Server → Client  | No            | Join response or error          |
| `CHAT_SEND_MESSAGE`         | Client → Server  | Yes           | Send new message                |
| `CHAT_SEND_MESSAGE_RESULT`  | Server → Client  | Yes           | Message send result or error    |
| `CHAT_MESSAGE`              | Server → Client  | No            | New message broadcast           |
| `CHAT_STATUS`               | Server → Client  | No            | Online users & last message     |

---
#### Event Details

##### `CHAT_JOIN` (Client → Server)
- **Purpose:** Request initial chat history and status.
- **Payload:**
  ```json
  { "key": "string" }
  ```
- **Response:** `CHAT_JOIN_RESULT`
  ```json
  {
    "status_code": 200,
    "message": "OK",
    "key": "string",
    "result": {
      "last_message": "string",   // Timestamp
      "users": 10,                // Online users
      "messages": [
        ...
        {
          "id": 1,
          "user": {
            "user_id": 1,
            "user_name": "Alice",
            "user_avatar": "https://api.dicebear.com/7.x/identicon/svg?seed=Alice"
          },
          "message": "Hey There!",
          "date": "2025-02-04T13:20:00Z",
          "reply_to": null
        },
        ...
      ]
    }
  }
  ```
- **Error**: With the same event message -> `CHAT_JOIN_RESULT`
    - Server Error


##### `CHAT_SEND_MESSAGE` (Client → Server, Auth Required)
- **Purpose:** Send a new message (optionally as a reply).
- **Payload:**
  ```json
  { "key": "string", "message": "string", "reply_to": 1 }
  ```
- **Response:** `CHAT_SEND_MESSAGE_RESULT`
  ```json
  {
    "status_code": 200,
    "message": "OK",
    "key": "string",
    "result": {
      "id": 1,
      "user": {
        "user_id": 1,
        "user_name": "Alice",
        "user_avatar": "https://api.dicebear.com/7.x/identicon/svg?seed=Alice"
      },
      "message": "Hello world!",
      "date": "2024-06-03T12:00:00Z",
      "reply_to": null
  }
  }
  ```
  - **Errors:**  
  All errors are sent as `CHAT_SEND_MESSAGE_RESULT` with the following JSON formats:

  **Rate limit exceeded**
  ```json
  {
    "status_code": 429,
    "error": { "code": "RATE_LIMIT_EXCEEDED", "details": "Too many messages sent" },
    "key": "your-request-key"
  }
  ```

  **Invalid message format**
  ```json
  {
    "status_code": 400,
    "error": { "code": "INVALID_MESSAGE", "details": "Message must be at least 1 and at most 2000 characters" },
    "key": "your-request-key"
  }
  ```

  **Duplicate message**
  ```json
  {
    "status_code": 409,
    "error": { "code": "DUPLICATE_MESSAGE", "details": "Duplicate message detected" },
    "key": "your-request-key"
  }
  ```

  **Invalid reply_to reference**
  ```json
  {
    "status_code": 400,
    "error": { "code": "INVALID_REPLY_TO", "details": "Reply-to message does not exist" },
    "key": "your-request-key"
  }
  ```

  **Authentication failure**
  ```json
  {
    "status_code": 401,
    "error": { "code": "UNAUTHORIZED", "details": "Authentication required" },
    "key": "your-request-key"
  }
  ```

  **Server error**
  ```json
  {
    "status_code": 500,
    "error": { "code": "SERVER_ERROR", "details": "Could not send message" },
    "key": "your-request-key"
  }
  ```
##### `CHAT_MESSAGE` (Server → Client)
- **Purpose:** Broadcasts new messages to all clients.
- **Payload:**
  ```json
  {
    "id": 1,
    "user": { "user_id": 1, "user_name": "string", "user_avatar": "string" },
    "message": "string",
    "date": "string",
    "reply_to": null
  }
  ```

##### `CHAT_STATUS` (Server → Client)
- **Purpose:** Periodic updates about online users and last message.
- **Payload:**
  ```json
  { "last_message": "string", "users": 10 }
  ```

##### Error Format (for all RPC results same RESULT event message)
```json
{
  "status_code": 400,
  "error": { "code": "ERROR_CODE", "details": "Detailed error message" },
  "key": "original-rpc-key"
}
```

---
**Notes:**
- All client RPC requests must include a unique `key` echoed in the response.
- System messages are broadcast at intervals if there is user activity.
- Status updates are broadcast every minute (or other configured values in the settings i.e. config.(docker.)yml)
- See `src/chat/interfaces/events.data.ts` for full TypeScript interfaces.