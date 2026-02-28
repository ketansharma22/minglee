# Novu — Anonymous Chat Platform

> Production-ready anonymous video + text chat with Firebase Auth, Google Login, Next.js 14, Socket.IO & WebRTC.

---

## ✨ Features

- 🔐 **Authentication** — Email/password + Google OAuth via Firebase
- 👤 **User Profiles** — Stored in Firestore (interests, chat count, last seen)
- ⚡ **Anonymous 1-on-1 Video Chat** — WebRTC peer-to-peer
- 💬 **Real-time Text Chat** — Socket.IO with typing indicators
- 🎯 **Interest-based Matching** — Saved to your profile
- 📊 **Admin Dashboard** — Live room & queue monitoring
- 🌗 **Dark / Light Themes** — Persisted preference
- 📱 **Fully Responsive** — Mobile, tablet, desktop

---

## 🔧 Firebase Setup (Required)

### Step 1: Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → name it (e.g. "novu-chat") → Continue
3. Disable Google Analytics (optional) → **Create project**

### Step 2: Enable Authentication

1. Left sidebar → **Build → Authentication** → **Get started**
2. **Sign-in method** tab → Enable **Email/Password**
3. Enable **Google** → add your support email → **Save**

### Step 3: Enable Firestore

1. Left sidebar → **Build → Firestore Database** → **Create database**
2. Choose **Start in test mode** (update rules before going to production)
3. Select a region close to your users → **Enable**

### Step 4: Get your config

1. Project Settings (gear icon) → **Your apps** → click **</>** (Web)
2. Register app → copy the `firebaseConfig` object
3. You'll see values for `apiKey`, `authDomain`, `projectId`, etc.

### Step 5: Set Firestore Security Rules (for production)

In Firestore → **Rules** tab, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Quick Start

```bash
# 1. Install deps
npm install

# 2. Configure env
cp .env.example .env.local
# Fill in your Firebase config values

# 3. Run dev (Next.js + Socket.IO server)
npm run dev
```

Open http://localhost:3000 — you'll be directed to sign in first.

---

## 📁 Project Structure

```
├── app/
│   ├── auth/page.tsx          ← Login / Signup / Google OAuth page
│   ├── page.tsx               ← Home (requires auth, interest picker)
│   ├── chat/page.tsx          ← Main chat interface (requires auth)
│   └── admin/page.tsx         ← Admin dashboard
│
├── components/
│   ├── auth/AuthProvider.tsx  ← Firebase auth state observer
│   ├── chat/ChatPanel.tsx     ← Messages + input
│   ├── video/VideoPanel.tsx   ← WebRTC video + controls
│   └── ui/ThemeProvider.tsx
│
├── hooks/
│   ├── useChat.ts             ← Socket.IO orchestration
│   └── useWebRTC.ts           ← RTCPeerConnection lifecycle
│
├── lib/
│   ├── firebase/
│   │   ├── config.ts          ← Firebase initialization
│   │   └── auth.ts            ← All auth + Firestore operations
│   ├── store/
│   │   ├── chatStore.ts       ← Zustand: chat state
│   │   └── authStore.ts       ← Zustand: auth state
│   └── socket/client.ts       ← Socket.IO singleton client
│
├── server/index.js            ← Socket.IO + Express server
├── types/index.ts             ← All TypeScript types
└── styles/globals.css         ← CSS variables + theme
```

---

## 🌐 Production Deployment

### Option A: Full VPS (Recommended)

```bash
# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start server/index.js --name novu-socket
pm2 start npm --name novu-next -- start
pm2 save
```

### Option B: Vercel (frontend) + Railway (socket server)

1. Deploy to Vercel → set `NEXT_PUBLIC_SOCKET_URL=https://your-railway-app.up.railway.app`
2. Deploy `server/index.js` to Railway → set `ALLOWED_ORIGINS=https://your-vercel-app.vercel.app`

### Firestore: Add your production domain to Firebase Auth

Firebase Console → Authentication → **Settings** → **Authorized domains** → Add your domain.

---

## ⚙️ Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `yourapp.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | e.g. `yourapp.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Numeric sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server URL (default: `http://localhost:3001`) |
| `PORT` | Socket.IO server port (default: `3001`) |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) |
