import React from 'react';
import { Shield, Upload, LayoutDashboard, Search, Eye } from 'lucide-react';

export function Navbar({ activeTab, onNavigate }) {
  const navItems = [
    { id: 'landing', label: 'Overview', icon: Shield },
    { id: 'log-input', label: 'Log Ingestion', icon: Upload },
    { id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { id: 'investigation', label: 'Incident Investigation', icon: Search },
    { id: 'exposure', label: 'Exposure Intelligence', icon: Eye },
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '48px',
      padding: '0 20px',
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-medium)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand logo & product title */}
      <div 
        onClick={() => onNavigate('landing')} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
      >
        <Shield size={16} color="var(--accent-orange)" />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '0.04em', color: 'var(--text-main)', textTransform: 'uppercase' }}>
            SENTINEL<span style={{ color: 'var(--accent-orange)' }}>AI</span>
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            SIH26-S01
          </span>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav style={{ display: 'flex', gap: '2px', height: '100%' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? 'var(--text-main)' : 'var(--text-subtle)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-orange)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color 0.12s ease',
                height: '100%'
              }}
            >
              <Icon size={14} color={isActive ? 'var(--accent-orange)' : 'var(--text-subtle)'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Quiet System Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 8px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-light)'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-low-text)' }} />
          SYSTEM OPERATIONAL
        </div>
      </div>
    </header>
  );
}
