// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface Room {
  id: string;
  users: string[];
  createdAt: number;
  duration: number;
}

interface Stats {
  status: string;
  stats: {
    online: number;
    waiting: number;
    chatting: number;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [queueSize, setQueueSize] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

  const fetchData = async () => {
    try {
      const [statsRes, roomsRes] = await Promise.all([
        fetch(`${SOCKET_URL}/health`),
        fetch(`${SOCKET_URL}/admin/rooms`),
      ]);

      if (!statsRes.ok || !roomsRes.ok) throw new Error('Server error');

      const statsData = await statsRes.json();
      const roomsData = await roomsRes.json();

      setStats(statsData);
      setRooms(roomsData.rooms);
      setQueueSize(roomsData.queue);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError('Cannot connect to server. Is it running?');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };

  return (
    <div
      className="min-h-dvh p-6"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Admin Dashboard
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="btn-ghost text-sm"
          >
            ↺ Refresh
          </button>
        </div>

        {error && (
          <div
            className="rounded-xl p-4 mb-6"
            style={{
              background: 'rgba(255,87,87,0.1)',
              border: '1px solid rgba(255,87,87,0.2)',
              color: 'var(--color-danger)',
            }}
          >
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Online', value: stats?.stats.online ?? '—', color: 'var(--color-success)' },
            { label: 'Chatting', value: stats?.stats.chatting ?? '—', color: 'var(--color-accent)' },
            { label: 'In Queue', value: queueSize, color: 'var(--color-warning)' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="glass-card rounded-2xl p-5"
            >
              <div style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>
                {value}
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Active Rooms */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>
              Active Rooms ({rooms.length})
            </h2>
          </div>

          {rooms.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
              No active rooms
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Room ID', 'Users', 'Duration', 'Created'].map(h => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left"
                        style={{ color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '0.75rem' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => (
                    <tr
                      key={room.id}
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <td
                        className="px-6 py-3"
                        style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                      >
                        {room.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            background: 'var(--color-accent-soft)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          {room.users.length} users
                        </span>
                      </td>
                      <td className="px-6 py-3" style={{ color: 'var(--color-success)' }}>
                        {formatDuration(room.duration)}
                      </td>
                      <td className="px-6 py-3" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                        {new Date(room.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
