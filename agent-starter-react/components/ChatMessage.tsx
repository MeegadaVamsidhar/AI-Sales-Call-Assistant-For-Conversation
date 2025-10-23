'use client';

import React from 'react';

export default function ChatMessage({ from, text }: { from: 'ai' | 'user'; text: string }) {
  const isUser = from === 'user';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        margin: '8px 0',
      }}
    >
      <div
        style={{
          maxWidth: '76%',
          padding: '10px 14px',
          borderRadius: 12,
          background: isUser ? 'var(--user-bg)' : 'var(--ai-bg)',
          color: isUser ? 'var(--user-fore)' : 'var(--ai-fore)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
    </div>
  );
}
