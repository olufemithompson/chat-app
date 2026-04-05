# Chat App — Next.js

A pixel-perfect chat UI built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 3-panel layout: icon sidebar, conversation list, and chat thread
- Type a message and hit Enter (or click Send) — it appears in the thread instantly
- Placeholder conversations with avatars
- Teal/green brand color throughout
- Warm beige chat background
- All icons from lucide-react

---

## Prerequisites

- **Node.js** 18.17 or later
- **npm** (comes with Node) or **yarn** / **pnpm**

---

## Setup & Run

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Build for Production

```bash
npm run build
npm run start
```

---

## Project Structure

```
chat-app/
├── app/
│   ├── layout.tsx          # Root layout (font imports, metadata)
│   ├── page.tsx            # Main page — composes all panels
│   └── globals.css         # Global styles + Tailwind directives
├── components/
│   ├── TopNavbar.tsx       # Top navigation bar
│   ├── Sidebar.tsx         # Left icon-only sidebar
│   ├── ConversationList.tsx # Middle panel with conversation list
│   └── ChatThread.tsx      # Right panel with messages + input
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## How Messaging Works

- Type in the input at the bottom of the chat panel
- Press **Enter** or click the **Send** button
- Your message appears immediately on the right side of the thread
- No backend required — state is managed in React

---

## Customization

- **Colors**: Edit `tailwind.config.ts` → `theme.extend.colors.primary`
- **Conversations**: Edit the `conversations` array in `components/ConversationList.tsx`
- **Initial messages**: Edit `initialMessages` in `components/ChatThread.tsx`
- **Avatars**: Uses `https://i.pravatar.cc` for placeholder images
