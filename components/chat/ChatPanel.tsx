// components/chat/ChatPanel.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useChatStore } from '@/lib/store/chatStore';
import type { Message } from '@/types';

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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    onTyping();
    // Auto resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', position: 'relative' }}>

      {/* Messages */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10, opacity: 0.35,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '1.5px dashed var(--color-text-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 6h14M3 10h10M3 14h6" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>Messages appear here</p>
          </div>
        )}

        {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: 4, paddingBottom: 2 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '8px 14px', borderRadius: '16px 16px 16px 4px',
              background: 'var(--color-surface-3)',
              border: '1px solid var(--color-border)',
            }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="mobile-chat-input"
        style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          padding: '12px',
        }}
      >
        {/* Action buttons */}
        {isConnected && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button onClick={onNext} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', gap: 5, padding: '8px' }}>
              <span>↺</span> Next
            </button>
            <button onClick={onDisconnect} className="btn-danger" style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '8px' }}>
              ✕ End chat
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Message…' : 'Waiting to connect…'}
            disabled={!isConnected}
            rows={1}
            className="input-field"
            style={{
              flex: 1, resize: 'none', lineHeight: '1.5', minHeight: 44,
              maxHeight: 120, overflowY: 'auto',
              opacity: isConnected ? 1 : 0.45,
              transition: 'opacity 0.2s',
            }}
            aria-label="Message input"
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || !inputValue.trim()}
            style={{
              width: 44, height: 44, flexShrink: 0,
              borderRadius: 12, border: 'none', cursor: isConnected && inputValue.trim() ? 'pointer' : 'not-allowed',
              background: isConnected && inputValue.trim() ? 'var(--color-accent)' : 'var(--color-surface-3)',
              color: isConnected && inputValue.trim() ? '#000' : 'var(--color-text-dim)',
              fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              transform: isConnected && inputValue.trim() ? 'scale(1)' : undefined,
            }}
            aria-label="Send message"
          >
            ↑
          </button>
        </div>

        <p style={{
          textAlign: 'center', marginTop: 8,
          fontSize: '0.62rem', color: 'var(--color-text-dim)',
        }}>
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
      <div className="msg-system" style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
        <span style={{
          padding: '4px 14px', borderRadius: 100, fontSize: '0.68rem',
          background: 'var(--color-surface-3)', color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
          fontFamily: 'var(--font-mono)',
        }}>
          {message.content}
        </span>
      </div>
    );
  }

  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={isMe ? 'msg-me' : 'msg-stranger'}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        marginTop: 6,
      }}
    >
      <div style={{
        maxWidth: '78%', padding: '9px 14px',
        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isMe ? 'var(--color-accent)' : 'var(--color-surface-3)',
        color: isMe ? '#000' : 'var(--color-text)',
        border: isMe ? 'none' : '1px solid var(--color-border)',
        fontSize: '0.85rem', lineHeight: 1.5,
        wordBreak: 'break-word',
      }}>
        {message.content}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, marginTop: 3,
        fontSize: '0.6rem', color: 'var(--color-text-dim)',
        fontFamily: 'var(--font-mono)',
        paddingLeft: isMe ? 0 : 4,
        paddingRight: isMe ? 4 : 0,
      }}>
        {time}
        {isMe && (
          <span style={{ color: message.status === 'delivered' ? 'var(--color-accent)' : 'var(--color-text-dim)' }}>
            {message.status === 'sent' ? '✓' : message.status === 'delivered' ? '✓✓' : '·'}
          </span>
        )}
      </div>
    </div>
  );
}
