# Novu — Anonymous Chat Platform

> A production-ready, real-time anonymous video + text chat platform built with Next.js 14, Socket.IO, and WebRTC.

![Novu](https://img.shields.io/badge/Next.js-14-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-white?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square)

---

## ✨ Features

- **Anonymous 1-on-1 Video Chat** — WebRTC peer-to-peer video + audio
- **Real-time Text Chat** — Instant messaging with typing indicators
- **Smart Matchmaking** — Interest-based pairing, avoids repeat partners
- **Responsive Design** — Mobile, tablet, desktop support
- **Dark/Light Themes** — Persisted preference
- **Connection Recovery** — Auto-reconnect, graceful failure handling
- **Admin Dashboard** — Live monitoring of rooms and queue
- **Rate Limiting** — Anti-spam, connection limits
- **Layout Modes** — Split, video-focus, chat-focus

---

## 🏗 Architecture

```
                    ┌─────────────────────────────────┐
                    │         Next.js App (3000)        │
                    │  ┌──────┐  ┌──────┐  ┌───────┐  │
                    │  │ Home │  │ Chat │  │ Admin │  │
                    │  └──┬───┘  └──┬───┘  └───────┘  │
                    └─────┼─────────┼──────────────────┘
                          │         │
                    WebSocket Connection
                          │         │
                    ┌─────▼─────────▼──────────────────┐
                    │      Socket.IO Server (3001)       │
                    │                                    │
                    │  ┌────────────────────────────┐   │
                    │  │     Matchmaking Service     │   │
                    │  │  Queue → Pair → Room        │   │
                    │  └────────────────────────────┘   │
                    │                                    │
                    │  ┌────────────────────────────┐   │
                    │  │    WebRTC Signaling Relay   │   │
                    │  │  offer/answer/ICE candidate │   │
                    │  └────────────────────────────┘   │
                    │                                    │
                    │  ┌────────────────────────────┐   │
                    │  │      Rate Limiter           │   │
                    │  │   (RateLimiterMemory)       │   │
                    │  └────────────────────────────┘   │
                    └────────────────────────────────────┘

WebRTC (peer-to-peer, after signaling):
User A ◄──────────────── Media Stream ────────────────► User B
```

### How WebRTC Signaling Works

1. **User A** joins queue, gets matched with **User B**
2. Server sends `match:found` to both, marks User A as **initiator**
3. User A calls `createOffer()`, sends offer via Socket.IO → server → User B
4. User B calls `createAnswer()`, sends answer back via server → User A
5. Both exchange **ICE candidates** through the signaling server
6. Once ICE negotiation completes, the **P2P connection** is established
7. Media flows **directly** between peers — server only relayed the handshake

```
User A                   Server                   User B
  |                        |                        |
  |── queue:join ─────────►|◄──── queue:join ───────|
  |◄─ match:found ─────────|──── match:found ───────►|
  |                        |                        |
  |── signal:offer ────────►──── signal:receive ────►|
  |◄─ signal:receive ──────◄──── signal:answer ──────|
  |── signal:ice ──────────►──── signal:receive ────►|
  |◄─ signal:receive ──────◄──── signal:ice ─────────|
  |                        |                        |
  |◄══════════ P2P Video/Audio Stream ══════════════►|
```

---

## 📁 Project Structure

```
omegle-clone/
├── app/
│   ├── layout.tsx          # Root layout + font + metadata
│   ├── page.tsx            # Landing page with interests
│   ├── error.tsx           # Error boundary
│   ├── not-found.tsx       # 404 page
│   ├── chat/
│   │   └── page.tsx        # Main chat interface
│   └── admin/
│       └── page.tsx        # Admin dashboard
│
├── components/
│   ├── video/
│   │   └── VideoPanel.tsx  # Local + remote video, controls
│   ├── chat/
│   │   └── ChatPanel.tsx   # Messages, typing, input
│   └── ui/
│       └── ThemeProvider.tsx
│
├── hooks/
│   ├── useWebRTC.ts        # WebRTC peer connection logic
│   └── useChat.ts          # Orchestrates socket + WebRTC
│
├── lib/
│   ├── socket/
│   │   └── client.ts       # Socket.IO singleton client
│   ├── matchmaking/
│   │   └── index.ts        # Matchmaking logic (server-side module)
│   └── store/
│       └── chatStore.ts    # Zustand global state
│
├── server/
│   └── index.js            # Standalone Socket.IO + Express server
│
├── types/
│   └── index.ts            # All TypeScript types
│
├── styles/
│   └── globals.css         # CSS variables, animations, theme
│
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 🚀 Setup & Running

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Install dependencies

```bash
cd omegle-clone
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
PORT=3001
```

### 3. Development mode

```bash
npm run dev
```

This starts:
- Next.js on `http://localhost:3000`
- Socket.IO server on `http://localhost:3001`

---

## 🏭 Production Build

```bash
npm run build
npm start
```

---

## 🐳 Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or just Docker
docker build -t novu .
docker run -p 3000:3000 -p 3001:3001 novu
```

---

## ☁️ Deployment

### Vercel (Frontend) + VPS (Socket.IO Server)

**WebSocket servers can't run on Vercel serverless functions.** You need a separate server for Socket.IO.

**Step 1: Deploy Next.js to Vercel**
```bash
vercel deploy
```
Set env var in Vercel dashboard:
```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.com
```

**Step 2: Deploy Socket.IO to VPS (e.g. Railway, Render, DigitalOcean)**

```bash
# On your VPS
git clone your-repo
cd omegle-clone
npm install
NODE_ENV=production PORT=3001 ALLOWED_ORIGINS=https://your-vercel-app.vercel.app node server/index.js
```

Or use PM2:
```bash
npm install -g pm2
pm2 start server/index.js --name "novu-socket" -e PORT=3001
pm2 save && pm2 startup
```

### Full-Stack VPS Deployment (Recommended)

```bash
# Install nginx + certbot
sudo apt install nginx certbot python3-certbot-nginx

# Configure nginx as reverse proxy
# /etc/nginx/sites-available/novu
server {
    listen 443 ssl;
    server_name your-domain.com;

    # Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 🔐 Security Notes

- All messages are sanitized (HTML escaped) server-side
- Rate limiting: 10 new connections/minute per IP, 30 messages/10s per socket
- CORS restricted to configured origins
- WebRTC signaling validates payload type (`offer`/`answer`/`ice-candidate` only)
- No user data is stored — fully ephemeral

---

## ⚡ Scaling

For horizontal scaling across multiple server instances:

1. Enable Redis adapter in `server/index.js`:
```js
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));
```

2. Use a sticky-session load balancer (nginx IP hash or sticky cookies)

3. Install: `npm install @socket.io/redis-adapter redis`

---

## 📱 Mobile UX

- Stacked video + chat layout on screens < 768px
- Fixed bottom input with `safe-area-inset-bottom` support
- Touch-optimized button sizes (44px minimum)
- Smooth keyboard handling

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| State | Zustand |
| WebSockets | Socket.IO 4 |
| Video | WebRTC (native browser API) |
| Backend | Express + Socket.IO standalone |
| Rate Limiting | rate-limiter-flexible |
| Fonts | Sora + JetBrains Mono (Google Fonts) |
| Containerization | Docker + Docker Compose |

---

## 🤝 Contributing

PRs welcome. Please ensure TypeScript types are maintained and no global state leaks are introduced.

---

## 📄 License

MIT
