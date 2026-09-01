import React from 'react';

export function IconButton({ icon: Icon, title, onClick, size = 14, style = {} }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 6px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-light)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        ...style
      }}
    >
      <Icon size={size} />
    </button>
  );
}
