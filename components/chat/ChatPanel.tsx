// components/chat/ChatPanel.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useChatStore } from '../../lib/store/chatStore';
import type { Message } from '../../types';

interface ChatPanelProps {
  onSendMessage: (content: string) => void;
  onTyping: () => void;
  onNext: () => void;
  onDisconnect: () => void;
}

export function ChatPanel({ onSendMessage, onTyping, onNext, onDisconnect }: ChatPanelProps) {
  const { messages, isTyping, userStatus } = useChatStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isConnected = userStatus === 'connected';

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    const content = inputValue.trim();
    if (!content || !isConnected) return;
    onSendMessage(content);
    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, isConnected, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    onTyping();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-surface)',
        overflow: 'hidden',
      }}
    >
      {/* ── Messages scrollable area ──────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minHeight: 0,
        }}
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: 0.4,
            }}
          >
            <div style={{ fontSize: '2rem' }}>💬</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
              Messages will appear here
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="msg-stranger" style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '8px 14px',
                borderRadius: '18px 18px 18px 4px',
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
              }}
            >
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area — flex-shrink:0 keeps it anchored at bottom ── */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          padding: '10px 12px',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Next / Stop buttons when connected */}
        {isConnected && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button
              onClick={onNext}
              className="btn-ghost"
              style={{ flex: 1, fontSize: '0.75rem', padding: '7px 0', minHeight: 36 }}
              aria-label="Skip to next stranger"
            >
              ⏭ Next
            </button>
            <button
              onClick={onDisconnect}
              className="btn-danger"
              style={{ flex: 1, fontSize: '0.75rem', padding: '7px 0', minHeight: 36 }}
              aria-label="Stop chat"
            >
              ✕ Stop
            </button>
          </div>
        )}

        {/* Text input row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Type a message...' : 'Connect to start chatting'}
            disabled={!isConnected}
            rows={1}
            className="input-field"
            style={{
              flex: 1,
              resize: 'none',
              lineHeight: '1.5',
              maxHeight: 100,
              overflowY: 'auto',
              opacity: isConnected ? 1 : 0.5,
              fontSize: '0.875rem',
              paddingTop: 10,
              paddingBottom: 10,
            }}
            aria-label="Message input"
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || !inputValue.trim()}
            aria-label="Send message"
            style={{
              width: 42,
              height: 42,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              border: 'none',
              background: isConnected && inputValue.trim() ? 'var(--color-accent)' : 'var(--color-surface-3)',
              color: isConnected && inputValue.trim() ? '#fff' : 'var(--color-text-muted)',
              cursor: isConnected && inputValue.trim() ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              transition: 'background 0.15s, transform 0.1s',
            }}
            onMouseOver={e => { if (isConnected && inputValue.trim()) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.07)'; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            ↑
          </button>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: 5,
            color: 'var(--color-text-muted)',
            fontSize: '0.6rem',
            opacity: 0.6,
          }}
        >
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isMe = message.sender === 'me';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="msg-system" style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
        <span
          style={{
            padding: '3px 12px',
            borderRadius: 999,
            fontSize: '0.7rem',
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          }}
        >
          {message.content}
        </span>
      </div>
    );
  }

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={isMe ? 'msg-me' : 'msg-stranger'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          maxWidth: '80%',
          padding: '8px 14px',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          background: isMe ? 'var(--color-accent)' : 'var(--color-surface-3)',
          color: isMe ? '#fff' : 'var(--color-text)',
          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          border: isMe ? 'none' : '1px solid var(--color-border)',
        }}
      >
        {message.content}
      </div>
      <span
        style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.6rem',
          marginTop: 2,
          paddingLeft: isMe ? 0 : 4,
          paddingRight: isMe ? 4 : 0,
        }}
      >
        {time}
        {isMe && message.status && (
          <span style={{ marginLeft: 4 }}>
            {message.status === 'sent' ? '✓' : message.status === 'delivered' ? '✓✓' : '…'}
          </span>
        )}
      </span>
    </div>
  );
}
