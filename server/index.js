// server/index.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 10000,
  transports: ['websocket', 'polling'],
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// ─── State ────────────────────────────────────────────────────────────────────
const queue = new Map(); // socketId → { socketId, userId, interests, joinedAt }
const rooms = new Map(); // roomId → { id, users: [socketId, socketId], createdAt }
const socketToRoom = new Map(); // socketId → roomId
const userPairHistory = new Map(); // userId → Set<userId>
const socketToUser = new Map(); // socketId → userId

// ─── Rate limiters ────────────────────────────────────────────────────────────
const connectionLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_CONNECTIONS || '10'),
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000') / 1000,
});

const messageLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_MESSAGES || '30'),
  duration: parseInt(process.env.RATE_LIMIT_MESSAGE_WINDOW_MS || '10'),
});

// ─── Matchmaking helpers ──────────────────────────────────────────────────────
function recordPairing(userId1, userId2) {
  if (!userPairHistory.has(userId1)) userPairHistory.set(userId1, new Set());
  if (!userPairHistory.has(userId2)) userPairHistory.set(userId2, new Set());

  const h1 = userPairHistory.get(userId1);
  const h2 = userPairHistory.get(userId2);

  if (h1.size >= 15) { const f = h1.values().next().value; h1.delete(f); }
  if (h2.size >= 15) { const f = h2.values().next().value; h2.delete(f); }

  h1.add(userId2);
  h2.add(userId1);
}

function findMatch(socketId) {
  const user = queue.get(socketId);
  if (!user) return null;

  const previousPartners = userPairHistory.get(user.userId) || new Set();

  let bestMatch = null;
  let bestScore = -Infinity;

  for (const [candidateId, candidate] of queue) {
    if (candidateId === socketId) continue;

    const isPrevious = previousPartners.has(candidate.userId);
    const sharedInterests = user.interests.filter(i => candidate.interests.includes(i)).length;
    const score = (isPrevious ? -100 : 0) + sharedInterests;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  if (!bestMatch) return null;

  const roomId = uuidv4();
  const room = {
    id: roomId,
    users: [socketId, bestMatch.socketId],
    createdAt: Date.now(),
  };

  recordPairing(user.userId, bestMatch.userId);

  queue.delete(socketId);
  queue.delete(bestMatch.socketId);
  rooms.set(roomId, room);
  socketToRoom.set(socketId, roomId);
  socketToRoom.set(bestMatch.socketId, roomId);

  return { room, partner: bestMatch };
}

function leaveRoom(socketId) {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return null;

  const room = rooms.get(roomId);
  if (!room) return null;

  rooms.delete(roomId);
  socketToRoom.delete(room.users[0]);
  socketToRoom.delete(room.users[1]);

  return room.users[0] === socketId ? room.users[1] : room.users[0];
}

function getPartner(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  return room.users[0] === socketId ? room.users[1] : room.users[0];
}

function broadcastStats() {
  const stats = {
    online: socketToUser.size,
    waiting: queue.size,
    chatting: rooms.size * 2,
  };
  io.emit('stats:update', stats);
}

function sanitizeMessage(content) {
  if (typeof content !== 'string') return '';
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .trim()
    .slice(0, 2000);
}

// ─── Socket handlers ──────────────────────────────────────────────────────────
io.on('connection', async (socket) => {
  const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

  // Rate limit new connections
  try {
    await connectionLimiter.consume(clientIp);
  } catch {
    socket.emit('error', { code: 'RATE_LIMIT', message: 'Too many connections. Please try again later.' });
    socket.disconnect(true);
    return;
  }

  const userId = uuidv4();
  socketToUser.set(socket.id, userId);
  broadcastStats();

  console.log(`[+] Connected: ${socket.id} (userId: ${userId})`);

  // ─── Queue management ────────────────────────────────────────────────────
  socket.on('queue:join', (payload) => {
    try {
      const interests = Array.isArray(payload?.interests)
        ? payload.interests.slice(0, 10).map(i => String(i).toLowerCase().trim()).filter(Boolean)
        : [];

      // Add to queue
      const user = {
        socketId: socket.id,
        userId,
        interests,
        joinedAt: Date.now(),
      };

      queue.set(socket.id, user);

      // Attempt immediate match
      const match = findMatch(socket.id);

      if (match) {
        const { room, partner } = match;

        // Notify both users
        socket.emit('match:found', {
          roomId: room.id,
          peerId: partner.userId,
          isInitiator: true,
        });

        io.to(partner.socketId).emit('match:found', {
          roomId: room.id,
          peerId: userId,
          isInitiator: false,
        });

        // Join socket rooms
        socket.join(room.id);
        const partnerSocket = io.sockets.sockets.get(partner.socketId);
        if (partnerSocket) partnerSocket.join(room.id);

        console.log(`[~] Match: ${socket.id} <-> ${partner.socketId} in room ${room.id}`);
      } else {
        const position = Array.from(queue.keys()).indexOf(socket.id) + 1;
        socket.emit('queue:waiting', { position });
      }

      broadcastStats();
    } catch (err) {
      console.error('queue:join error:', err);
      socket.emit('error', { code: 'QUEUE_ERROR', message: 'Failed to join queue.' });
    }
  });

  socket.on('queue:leave', () => {
    queue.delete(socket.id);
    broadcastStats();
  });

  // ─── Chat ────────────────────────────────────────────────────────────────
  socket.on('message:send', async (payload) => {
    try {
      await messageLimiter.consume(socket.id);
    } catch {
      socket.emit('error', { code: 'RATE_LIMIT', message: 'You are sending messages too fast.' });
      return;
    }

    try {
      const roomId = payload?.roomId;
      const room = rooms.get(roomId);

      if (!room || !room.users.includes(socket.id)) {
        socket.emit('error', { code: 'NOT_IN_ROOM', message: 'You are not in a chat room.' });
        return;
      }

      const content = sanitizeMessage(payload?.content);
      if (!content) return;

      const messagePayload = {
        roomId,
        content,
        messageId: uuidv4(),
        timestamp: Date.now(),
      };

      // Send to partner only (sender already has the message optimistically)
      const partnerId = getPartner(roomId, socket.id);
      if (partnerId) {
        io.to(partnerId).emit('message:receive', messagePayload);
      }
    } catch (err) {
      console.error('message:send error:', err);
    }
  });

  // ─── Typing indicators ───────────────────────────────────────────────────
  socket.on('typing:start', (payload) => {
    const roomId = payload?.roomId;
    const room = rooms.get(roomId);
    if (!room || !room.users.includes(socket.id)) return;

    const partnerId = getPartner(roomId, socket.id);
    if (partnerId) {
      io.to(partnerId).emit('typing:update', { roomId, isTyping: true });
    }
  });

  socket.on('typing:stop', (payload) => {
    const roomId = payload?.roomId;
    const room = rooms.get(roomId);
    if (!room || !room.users.includes(socket.id)) return;

    const partnerId = getPartner(roomId, socket.id);
    if (partnerId) {
      io.to(partnerId).emit('typing:update', { roomId, isTyping: false });
    }
  });

  // ─── WebRTC signaling ────────────────────────────────────────────────────
  socket.on('signal:send', (payload) => {
    try {
      const { roomId, type, data } = payload || {};

      // Validate signal type
      if (!['offer', 'answer', 'ice-candidate'].includes(type)) return;

      const room = rooms.get(roomId);
      if (!room || !room.users.includes(socket.id)) return;

      const partnerId = getPartner(roomId, socket.id);
      if (partnerId) {
        io.to(partnerId).emit('signal:receive', { roomId, type, data });
      }
    } catch (err) {
      console.error('signal:send error:', err);
    }
  });

  // ─── Next / Disconnect ───────────────────────────────────────────────────
  socket.on('chat:next', () => {
    const partnerId = leaveRoom(socket.id);

    if (partnerId) {
      io.to(partnerId).emit('chat:stranger_disconnected', {
        roomId: socketToRoom.get(partnerId),
        reason: 'next',
      });
      // Leave socket room
      socket.rooms.forEach(r => { if (r !== socket.id) socket.leave(r); });
    }

    broadcastStats();
  });

  socket.on('chat:disconnect', (payload) => {
    const roomId = payload?.roomId;
    const room = rooms.get(roomId);
    if (!room || !room.users.includes(socket.id)) return;

    const partnerId = getPartner(roomId, socket.id);
    leaveRoom(socket.id);

    if (partnerId) {
      io.to(partnerId).emit('chat:stranger_disconnected', {
        roomId,
        reason: 'disconnect',
      });
    }

    socket.rooms.forEach(r => { if (r !== socket.id) socket.leave(r); });
    broadcastStats();
  });

  // ─── Cleanup on socket disconnect ────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[-] Disconnected: ${socket.id} (${reason})`);

    queue.delete(socket.id);
    const partnerId = leaveRoom(socket.id);

    if (partnerId) {
      io.to(partnerId).emit('chat:stranger_disconnected', {
        reason: 'disconnect',
      });
    }

    socketToUser.delete(socket.id);
    broadcastStats();
  });
});

// ─── REST endpoints ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    stats: {
      online: socketToUser.size,
      waiting: queue.size,
      chatting: rooms.size * 2,
    },
  });
});

app.get('/admin/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(r => ({
    id: r.id,
    users: r.users,
    createdAt: r.createdAt,
    duration: Date.now() - r.createdAt,
  }));
  res.json({ rooms: roomList, queue: queue.size });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});

module.exports = { app, httpServer, io };
