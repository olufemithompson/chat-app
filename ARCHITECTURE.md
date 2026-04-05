# Shipper Chat — Architecture Guide

> Written in plain English. No jargon. If you're lost, start here.

---

## What is this app?

Shipper Chat is a real-time messaging app — think WhatsApp or Slack but built from scratch. You can:

- Sign in with Google or email/password
- Chat with other users in real time
- Send images, documents, and links
- See who is online
- Get AI replies from a built-in Claude AI assistant
- Switch between light and dark themes

---

## The Big Picture — How Everything Fits Together

Think of the app as having **4 main layers**:

```
┌─────────────────────────────────────────────────────────────┐
│  1. BROWSER (what the user sees and clicks)                  │
│     React components, Tailwind CSS, Zustand state            │
├─────────────────────────────────────────────────────────────┤
│  2. NEXT.JS SERVER (the brain — handles requests)            │
│     API routes, authentication, file uploads                 │
├─────────────────────────────────────────────────────────────┤
│  3. SOCKET.IO SERVER (the real-time pipeline)                │
│     Instant message delivery, typing indicators, presence    │
├─────────────────────────────────────────────────────────────┤
│  4. DATABASE (the memory — stores everything permanently)    │
│     PostgreSQL + Prisma ORM                                  │
└─────────────────────────────────────────────────────────────┘
```

When a user sends a message, here's the journey it takes:

1. User types and hits Enter in the browser
2. The browser sends the message to the Socket.io server instantly
3. Socket.io saves it to the database
4. Socket.io pushes it to the recipient's browser in real time
5. Both browsers update their UI immediately

---

## Folder Structure — Where to Find What

```
chat-app/
│
├── app/                        ← All pages and API routes (Next.js App Router)
│   ├── (app)/                  ← Pages only logged-in users can see
│   │   ├── page.tsx            ← THE MAIN CHAT PAGE (start here to understand the UI)
│   │   └── layout.tsx          ← Wraps all app pages (adds SocketContext)
│   │
│   ├── (auth)/                 ← Pages for logged-out users
│   │   └── login/page.tsx      ← Login + signup form
│   │
│   ├── api/                    ← Backend API endpoints
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  ← Handles Google OAuth callbacks
│   │   │   └── signup/route.ts         ← Create new user with email/password
│   │   │
│   │   ├── conversations/
│   │   │   ├── route.ts                ← GET list of chats / POST create new chat
│   │   │   └── [id]/
│   │   │       ├── route.ts            ← GET/PATCH/DELETE a single conversation
│   │   │       ├── messages/route.ts   ← GET message history / POST send message
│   │   │       ├── media/route.ts      ← GET images shared in this chat
│   │   │       ├── docs/route.ts       ← GET documents shared in this chat
│   │   │       └── links/route.ts      ← GET links shared in this chat
│   │   │
│   │   ├── users/
│   │   │   ├── route.ts                ← GET all users (for new conversation modal)
│   │   │   └── me/route.ts             ← GET/PATCH your own profile
│   │   │
│   │   └── upload/route.ts             ← POST upload a file (image/document)
│   │
│   ├── layout.tsx              ← Root HTML shell — theme flash fix lives here
│   └── globals.css             ← ALL CSS variables (colors, dark mode, bubble styles)
│
├── components/                 ← Every reusable UI piece
│   ├── layout/
│   │   ├── Sidebar/index.tsx   ← Left icon navigation bar
│   │   └── TopNavbar.tsx       ← Top bar with search and theme toggle
│   │
│   ├── conversation/           ← The left panel (list of chats)
│   │   ├── ConversationList.tsx        ← Renders the full list
│   │   ├── ConversationItem.tsx        ← One row in the list (avatar, name, preview)
│   │   ├── ConversationSearch.tsx      ← The search/filter input
│   │   ├── ConversationContextMenu.tsx ← Right-click popup menu
│   │   └── NewConversationModal.tsx    ← "Start new chat" modal
│   │
│   ├── chat/                   ← The right panel (the actual conversation)
│   │   ├── ChatThread.tsx      ← Puts header + messages + input together
│   │   ├── ChatHeader.tsx      ← Shows contact name, online status, action buttons
│   │   ├── MessageList.tsx     ← Scrollable list of all messages
│   │   ├── MessageGroup.tsx    ← Groups of consecutive messages from same person
│   │   └── MessageInput.tsx    ← Text box, emoji picker, file attachment, send button
│   │
│   ├── contact/                ← Right panel (contact info, media, links, docs)
│   │   ├── ContactPanel.tsx    ← The sliding panel container
│   │   ├── ContactCard.tsx     ← Avatar, name, email at the top
│   │   ├── ContactTabs.tsx     ← Media / Link / Docs tab selector
│   │   ├── ContactMediaTab.tsx ← Grid of images
│   │   ├── ContactDocsTab.tsx  ← List of documents
│   │   └── ContactLinksTab.tsx ← List of detected URLs
│   │
│   ├── ThemeSync.tsx           ← Saves theme choice to DB when changed
│   └── ThemeModal.tsx          ← The theme picker popup
│
├── contexts/
│   └── SocketContext.tsx       ← Creates the WebSocket connection + distributes events
│                                  (this is how the browser stays connected in real time)
│
├── store/
│   └── chatStore.ts            ← Global memory for the browser
│                                  (conversations, messages, who's online, who's typing)
│
├── lib/                        ← Shared utility code used in multiple places
│   ├── auth.ts                 ← NextAuth setup (Google OAuth + password login)
│   ├── prisma.ts               ← Database client (use this to query the DB anywhere)
│   ├── socket-server.ts        ← ALL real-time logic (message send, typing, AI reply)
│   ├── upload.ts               ← File saving utility (saves files to /public/uploads/)
│   └── env.ts                  ← Environment variable helpers (never hardcode secrets)
│
├── types/
│   └── index.ts                ← TypeScript type definitions (Contact, ContactTab etc.)
│
├── prisma/
│   └── schema.prisma           ← The database blueprint (tables, columns, relations)
│
├── middleware.ts               ← Runs on every request — redirects if not logged in
├── server.ts                   ← The app's entry point — starts Next.js + Socket.io together
└── public/
    ├── logo.png                ← App logo (light version)
    ├── logo_dark.png           ← App logo (dark version, used on login page)
    └── uploads/                ← All uploaded files live here (served as static files)
        ├── images/
        └── documents/
```

---

## The Database — What Gets Stored

File: `prisma/schema.prisma`

Think of the database as having 5 main tables:

### Users table
Stores everyone who has an account.
```
id, name, email, passwordHash, image (avatar URL),
theme (light/dark preference), isOnline, lastSeen,
creditsUsed, creditsTotal (for AI messages)
```

### Conversations table
Each row is one chat thread (e.g. "Chat between Alice and Bob").
```
id, lastMessage (preview text), lastMessageAt (for sorting)
```

### ConversationParticipant table
Links users to conversations. Alice is in conversation X, Bob is in conversation X.
```
userId, conversationId, unreadCount, isArchived, isMuted
```

### Messages table
Every single message ever sent.
```
id, conversationId, senderId, text, type (TEXT/IMAGE/DOCUMENT/LINK),
readBy (array of user IDs who've seen it), createdAt
```

### Uploads table
Every file or link attached to a message.
```
id, messageId, userId, filename (UUID.ext), originalName,
mimeType, size, url (public path), uploadType (IMAGE/DOCUMENT/LINK),
linkUrl, linkTitle
```

> **Note about links:** When you send a message containing `https://...`, the message stays as type TEXT but the server automatically creates an Upload row with `uploadType: LINK`. This is how the "Links" tab in the contact panel gets populated.

---

## Authentication — How Login Works

File: `lib/auth.ts`, `app/api/auth/signup/route.ts`

There are two ways to log in:

**Option 1 — Google OAuth**
1. User clicks "Continue with Google"
2. Google redirects back with an auth code
3. NextAuth exchanges it for a user profile
4. User is created in DB if first time
5. JWT token issued — stored in browser cookie

**Option 2 — Email + Password**
1. User fills the form
2. If signing up: POST `/api/auth/signup` → password hashed with bcrypt (12 rounds) → user created
3. If signing in: NextAuth checks the hash matches
4. JWT token issued — stored in browser cookie

**Route Protection** (file: `middleware.ts`)

The middleware runs on every page load. Rules:
- Not logged in → redirect to `/login`
- Logged in + visiting `/login` → redirect to `/`
- Public files (logos, uploads) → pass through freely

---

## Real-time Messaging — How Socket.io Works

File: `lib/socket-server.ts`, `contexts/SocketContext.tsx`, `server.ts`

This is the most important part to understand. Normal web requests (REST API) are like sending a letter — you send, wait, get a reply. Socket.io is like a phone call — the connection stays open and both sides can talk any time.

### How the connection is set up

`server.ts` starts a custom Node.js HTTP server. Attached to the same server is:
- Next.js (handles pages and API routes)
- Socket.io (handles real-time events)

This means both live on the same port (3000).

### Personal Rooms — The Key Concept

When a user connects, they join a "room" named `user:{theirId}`. Think of it like a mailbox. No matter which chat they have open, the server can always deliver a message to `user:alice` and Alice's browser will receive it.

```
Alice connects → joins room "user:alice123"
Bob connects   → joins room "user:bob456"

Bob sends a message to Alice:
  Server looks up Alice's userId
  Server emits to room "user:alice123"
  Alice's browser receives it instantly
```

### Events the server listens for (browser → server)

| Event | What it does |
|-------|-------------|
| `message:send` | Save message to DB, broadcast to recipients, trigger AI if needed |
| `typing:start` | Tell the other person "Alice is typing..." |
| `typing:stop` | Tell the other person "Alice stopped typing" |
| `messages:read` | Reset unread count to 0 for this conversation |
| `join:conversation` | Join the room for a specific conversation |
| `disconnect` | Mark user offline, update lastSeen |

### Events the server sends (server → browser)

| Event | What it means |
|-------|--------------|
| `message:received` | New message arrived — add it to the chat |
| `conversation:updated` | Last message or timestamp changed — update the list |
| `typing:start` | Show "typing..." indicator in chat |
| `typing:stop` | Hide the typing indicator |
| `user:online` | Someone came online — update their status |
| `user:offline` | Someone went offline |
| `users:online-list` | Full list of who's online right now (sent on connect) |
| `messages:read` | The other person read the messages |

### How the browser handles these events

File: `contexts/SocketContext.tsx`

This file creates the socket connection when you log in and stays connected the whole time you're using the app. It listens to all the events above and updates the Zustand store (the browser's memory) when things happen.

---

## State Management — The Browser's Memory

File: `store/chatStore.ts`

Zustand is like a global variable that all components can read and update. It holds:

```
conversations      → The list of chats in the left panel
messages           → All messages, grouped by conversationId
activeConversationId → Which chat you currently have open
onlineUsers        → Set of userIds who are currently online
typingUsers        → Who is typing in which conversation
```

When a socket event comes in (e.g. `message:received`), `SocketContext.tsx` calls a store action like `appendMessage()`. All components watching that data re-render automatically.

---

## The Main Page Layout

File: `app/(app)/page.tsx`

The entire app is one page. The layout looks like this:

```
┌──────┬─────────────────────────────────────────────────────┐
│      │ TopNavbar (search, theme toggle, credits)            │
│      ├───────────────────────┬─────────────────────────────┤
│Side  │                       │                             │
│bar   │  ConversationList     │   ChatThread                │
│      │  (left panel)         │   (right panel)             │
│      │                       │                             │
│      │  - Search bar         │   - ChatHeader              │
│icons │  - List of chats      │   - MessageList             │
│      │  - Each shows:        │   - MessageInput            │
│      │    avatar, name,      │                             │
│      │    last message,      │   ContactPanel slides in    │
│      │    time, unread count │   from the right when you   │
│      │                       │   click a contact's name    │
└──────┴───────────────────────┴─────────────────────────────┘
```

---

## How a Message is Sent — Step by Step

1. User types in `MessageInput.tsx`
2. Each keystroke triggers `typing:start` (debounced — only fires once)
3. User presses Enter → `sendMessage()` is called in `ChatThread.tsx`
4. Browser emits `message:send` to Socket.io server with `{ conversationId, text }`
5. `socket-server.ts` receives it:
   - Creates a `Message` row in the database
   - If the text contains URLs, creates `Upload` rows with `uploadType: LINK`
   - Updates `Conversation.lastMessage`
   - Increments `unreadCount` for everyone except the sender
   - Looks up all participants of the conversation
   - Emits `message:received` to `user:{participantId}` for each participant
   - Emits `conversation:updated` to each participant too
6. Both sender and recipient receive `message:received`
7. `SocketContext.tsx` calls `appendMessage()` on the store
8. `MessageList.tsx` re-renders with the new message

---

## How File Uploads Work

1. User clicks the paperclip icon in `MessageInput.tsx`
2. File picker opens — accepts images and documents
3. On file select, `handleFileUpload()` posts to `POST /api/upload`
4. `app/api/upload/route.ts`:
   - Reads the file bytes
   - Generates a UUID filename
   - Saves to `public/uploads/images/` or `public/uploads/documents/`
   - Creates an `Upload` row in the DB with the public URL
   - Returns the `uploadId`
5. The browser then calls `sendMessage()` with the `uploadId`
6. The message is created in DB linked to that Upload
7. In the chat, `MessageGroup.tsx` renders:
   - Images inline with `<img>`
   - Documents as a download link with a file icon

---

## The AI Assistant — How Claude Integration Works

Files: `lib/socket-server.ts`, `app/api/conversations/[id]/messages/route.ts`

When you create a conversation with the AI Bot user (seeded via `prisma/seed-bot.ts`):

1. You send a message normally
2. In `socket-server.ts`, after saving your message, the server checks: "Is the other participant the AI bot?"
3. If yes:
   - Emits `typing:start` with the bot's userId → you see "typing..." in the chat
   - Checks your credits (you get 25/day, resets every 24 hours)
   - If no credits left: sends a "You've used all credits" message instead
   - If credits available:
     - Fetches the last 20 messages from the conversation as context
     - Sends them to the Claude API (`claude-sonnet-4-6` model)
     - System prompt: "You are a helpful AI assistant inside Shipper Chat. Be concise, friendly. No markdown."
     - Saves Claude's reply as a new message from the bot user
     - Emits `typing:stop` then `message:received` back to you
     - Increments your `creditsUsed` by 1

---

## Themes — Light and Dark Mode

Files: `app/globals.css`, `app/layout.tsx`, `components/ThemeSync.tsx`

All colors in the app use CSS variables, not hardcoded values. Example:
```css
/* Instead of background: white; */
background: var(--panel-bg);
```

In `globals.css`:
```css
/* Light mode defaults */
:root {
  --app-bg: #f3f3ed;
  --panel-bg: #ffffff;
  --text-primary: #111827;
  --bubble-me: #effdf4;
}

/* Dark mode overrides */
html.dark {
  --app-bg: #0f172a;
  --panel-bg: #1e293b;
  --text-primary: #f1f5f9;
  --bubble-me: #1a3d2e;
}
```

When you toggle dark mode, the app adds/removes the `dark` class on `<html>`. Every component automatically updates because they all use variables.

**Preventing the flash on reload:** The `app/layout.tsx` has an inline `<script>` that runs before React even loads. It reads `localStorage` and adds the `dark` class immediately — so you never see a flash of the wrong theme.

---

## API Routes — Quick Reference

| Method | URL | What it does | File |
|--------|-----|-------------|------|
| POST | `/api/auth/signup` | Register new user | `app/api/auth/signup/route.ts` |
| GET | `/api/conversations` | Get your conversation list | `app/api/conversations/route.ts` |
| POST | `/api/conversations` | Start a new conversation | `app/api/conversations/route.ts` |
| GET | `/api/conversations/:id` | Get one conversation | `app/api/conversations/[id]/route.ts` |
| PATCH | `/api/conversations/:id` | Archive/mute/rename | `app/api/conversations/[id]/route.ts` |
| DELETE | `/api/conversations/:id` | Delete a conversation | `app/api/conversations/[id]/route.ts` |
| GET | `/api/conversations/:id/messages` | Load chat history | `app/api/conversations/[id]/messages/route.ts` |
| POST | `/api/conversations/:id/messages` | Send a message (REST fallback) | `app/api/conversations/[id]/messages/route.ts` |
| DELETE | `/api/conversations/:id/messages` | Clear all messages | `app/api/conversations/[id]/messages/route.ts` |
| GET | `/api/conversations/:id/media` | Get shared images | `app/api/conversations/[id]/media/route.ts` |
| GET | `/api/conversations/:id/docs` | Get shared documents | `app/api/conversations/[id]/docs/route.ts` |
| GET | `/api/conversations/:id/links` | Get shared links | `app/api/conversations/[id]/links/route.ts` |
| POST | `/api/upload` | Upload a file | `app/api/upload/route.ts` |
| GET | `/api/users` | List all users | `app/api/users/route.ts` |
| GET | `/api/users/me` | Your own profile | `app/api/users/me/route.ts` |
| PATCH | `/api/users/me` | Update name or theme | `app/api/users/me/route.ts` |

---

## Environment Variables

File: `lib/env.ts`, `.env.local`

```
DATABASE_URL              → PostgreSQL connection string
AUTH_SECRET               → Random secret for signing JWT tokens
GOOGLE_CLIENT_ID          → From Google Cloud Console
GOOGLE_CLIENT_SECRET      → From Google Cloud Console
NEXT_PUBLIC_APP_URL       → Your app's public URL (e.g. http://localhost:3000)
ANTHROPIC_API_KEY         → From console.anthropic.com (for AI features)
AI_BOT_USER_ID            → The DB id of the seeded AI bot user
```

---

## CSS Classes You'll See Everywhere

Defined in `app/globals.css`:

| Class | What it does |
|-------|-------------|
| `themed-panel` | White in light mode, dark slate in dark mode |
| `themed-input` | Input field that adapts to theme |
| `bubble-me` | Message bubble for messages YOU sent (green tint) |
| `bubble-them` | Message bubble for messages THEY sent (grey tint) |
| `icon-btn` | Icon button that shows hover background |
| `conv-item` | Conversation list row with hover effect |
| `nav-active-bg` | Background for the selected sidebar icon |

---

## Key Components — What Each One Does

### `SocketContext.tsx`
The most important non-visible component. Creates and maintains the WebSocket connection. Every real-time feature depends on this. It reads the user's session to get their `userId` and passes it in the socket handshake so the server knows who connected.

### `chatStore.ts`
The single source of truth for the browser. If you want to know what conversations exist, what messages are loaded, who's online — look here. All components read from this store and all socket events write to it.

### `ConversationItem.tsx`
One row in the conversation list. Handles unread badge, archive badge, the hover state, and clicking to open the chat.

### `MessageGroup.tsx`
Groups consecutive messages from the same person together (like WhatsApp). Also handles rendering images inline, document links, and clickable URLs inside text.

### `ChatThread.tsx`
The main coordinator for the right panel. Fetches message history when you switch conversations, handles sending messages, delegates to `ChatHeader`, `MessageList`, and `MessageInput`.

---

## What Could Be Improved

These are things that work but could be made better:

1. **Group chats** — The DB schema supports multiple participants but the UI only does 1:1 chats
2. **Message editing and deletion** — Once sent, messages can't be edited or deleted individually
3. **Push notifications** — No browser notifications when the tab is in the background
4. **Message search** — You can filter conversations by name but can't search message content
5. **Pagination** — Messages load the last 50 only; there's no "load older messages" button
6. **AI credits UI** — Credits are tracked in the DB but not prominently shown to users
7. **Image compression** — Files up to 50MB are accepted but no compression before saving
8. **Conversation read status** — The double-check marks show but don't distinguish "delivered" vs "read"
9. **Error recovery** — If a message fails to send over socket, there's no automatic retry with visible feedback

---

## Development Quick Start

```bash
# Install dependencies
npm install

# Set up the database
npm run db:push

# Seed the AI bot user (required for AI chat to work)
npx tsx prisma/seed-bot.ts

# Start the dev server (Next.js + Socket.io together)
npm run dev

# Open Prisma Studio to browse the database
npm run db:studio
```

The app runs on `http://localhost:3000`.

---

## Debugging Tips

| Problem | Where to look |
|---------|--------------|
| Messages not arriving in real time | `lib/socket-server.ts` — check console logs for socket events |
| User shows as offline when they're not | `SocketContext.tsx` — check if socket connects with userId |
| Login not working | `lib/auth.ts` + `.env.local` credentials |
| File uploads failing | `app/api/upload/route.ts` + check `/public/uploads/` folder exists |
| Links not appearing in contact panel | `lib/socket-server.ts` URL extraction + `app/api/conversations/[id]/links/route.ts` |
| Theme flashing on reload | `app/layout.tsx` inline script + `app/globals.css` dark variables |
| AI not responding | Check `ANTHROPIC_API_KEY` in `.env.local` + run `seed-bot.ts` + check `AI_BOT_USER_ID` |
| Database errors | Run `npm run db:generate` then `npm run db:push` |
