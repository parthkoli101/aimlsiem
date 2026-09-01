import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  disabled = false,
  onClick,
  style = {},
  ...props
}) {
  let bg = 'var(--accent-orange)';
  let color = '#FFFFFF';
  let border = '1px solid var(--accent-orange)';

  if (variant === 'secondary') {
    bg = 'var(--bg-secondary)';
    color = 'var(--text-main)';
    border = '1px solid var(--border-medium)';
  } else if (variant === 'outline') {
    bg = 'transparent';
    color = 'var(--text-main)';
    border = '1px solid var(--border-medium)';
  } else if (variant === 'danger') {
    bg = 'var(--status-critical-text)';
    color = '#FFFFFF';
    border = '1px solid var(--status-critical-text)';
  }

  const paddingMap = {
    sm: '4px 10px',
    md: '6px 12px',
    lg: '8px 16px'
  };

  const fontSizeMap = {
    sm: '11px',
    md: '12px',
    lg: '13px'
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: paddingMap[size] || paddingMap.md,
        fontSize: fontSizeMap[size] || fontSizeMap.md,
        fontWeight: '600',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: bg,
        color: color,
        border: border,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background-color 0.12s ease, border-color 0.12s ease',
        boxShadow: 'var(--shadow-sm)',
        whiteSpace: 'nowrap',
        ...style
      }}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  );
}
