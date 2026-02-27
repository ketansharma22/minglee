// lib/matchmaking/index.ts
import { v4 as uuidv4 } from 'uuid';
import type { QueuedUser, ActiveRoom, ServerStats } from '../../types';

export class MatchmakingService {
  private queue: Map<string, QueuedUser> = new Map(); // socketId → QueuedUser
  private rooms: Map<string, ActiveRoom> = new Map(); // roomId → ActiveRoom
  private socketToRoom: Map<string, string> = new Map(); // socketId → roomId
  private userPairHistory: Map<string, Set<string>> = new Map(); // userId → Set<userId>

  addToQueue(user: QueuedUser): void {
    // Remove from any existing room first
    this.leaveCurrentRoom(user.socketId);
    this.queue.set(user.socketId, user);
  }

  removeFromQueue(socketId: string): void {
    this.queue.delete(socketId);
  }

  findMatch(socketId: string): { room: ActiveRoom; partner: QueuedUser } | null {
    const user = this.queue.get(socketId);
    if (!user) return null;

    const previousPartners = this.userPairHistory.get(user.userId) || new Set();

    // Try interest-based matching first
    let bestMatch: QueuedUser | null = null;
    let bestScore = -1;

    for (const [candidateSocketId, candidate] of this.queue) {
      if (candidateSocketId === socketId) continue;
      if (previousPartners.has(candidate.userId)) continue;

      // Score based on shared interests
      const sharedInterests = user.interests.filter(i => candidate.interests.includes(i)).length;
      const score = sharedInterests;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    // If no match with interests, just take the first available
    if (!bestMatch) {
      for (const [candidateSocketId, candidate] of this.queue) {
        if (candidateSocketId === socketId) continue;
        if (!previousPartners.has(candidate.userId)) {
          bestMatch = candidate;
          break;
        }
      }
    }

    // If still no match (all are previous partners), allow re-pairing
    if (!bestMatch) {
      for (const [candidateSocketId, candidate] of this.queue) {
        if (candidateSocketId === socketId) continue;
        bestMatch = candidate;
        break;
      }
    }

    if (!bestMatch) return null;

    // Create room
    const room: ActiveRoom = {
      id: uuidv4(),
      users: [socketId, bestMatch.socketId],
      createdAt: Date.now(),
    };

    // Record pair history
    this.recordPairing(user.userId, bestMatch.userId);

    // Remove both from queue
    this.queue.delete(socketId);
    this.queue.delete(bestMatch.socketId);

    // Register room
    this.rooms.set(room.id, room);
    this.socketToRoom.set(socketId, room.id);
    this.socketToRoom.set(bestMatch.socketId, room.id);

    return { room, partner: bestMatch };
  }

  leaveCurrentRoom(socketId: string): string | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Remove room
    this.rooms.delete(roomId);
    this.socketToRoom.delete(room.users[0]);
    this.socketToRoom.delete(room.users[1]);

    // Return the partner's socket ID
    return room.users[0] === socketId ? room.users[1] : room.users[0];
  }

  getRoomBySocketId(socketId: string): ActiveRoom | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  getRoomById(roomId: string): ActiveRoom | null {
    return this.rooms.get(roomId) || null;
  }

  getPartnerSocketId(roomId: string, socketId: string): string | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room.users[0] === socketId ? room.users[1] : room.users[0];
  }

  onDisconnect(socketId: string): { partnerId: string | null; wasInQueue: boolean } {
    const wasInQueue = this.queue.has(socketId);
    this.queue.delete(socketId);
    const partnerId = this.leaveCurrentRoom(socketId);
    return { partnerId, wasInQueue };
  }

  getStats(): ServerStats {
    return {
      online: this.queue.size + this.rooms.size * 2,
      waiting: this.queue.size,
      chatting: this.rooms.size * 2,
    };
  }

  getQueuePosition(socketId: string): number {
    let position = 0;
    for (const [id] of this.queue) {
      position++;
      if (id === socketId) return position;
    }
    return -1;
  }

  private recordPairing(userId1: string, userId2: string): void {
    if (!this.userPairHistory.has(userId1)) {
      this.userPairHistory.set(userId1, new Set());
    }
    if (!this.userPairHistory.has(userId2)) {
      this.userPairHistory.set(userId2, new Set());
    }

    // Keep only last 10 partners per user
    const history1 = this.userPairHistory.get(userId1)!;
    const history2 = this.userPairHistory.get(userId2)!;

    if (history1.size >= 10) {
      const first = history1.values().next().value;
      history1.delete(first);
    }
    if (history2.size >= 10) {
      const first = history2.values().next().value;
      history2.delete(first);
    }

    history1.add(userId2);
    history2.add(userId1);
  }
}

export const matchmakingService = new MatchmakingService();
