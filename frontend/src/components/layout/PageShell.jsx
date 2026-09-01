import React from 'react';
import { Navbar } from './Navbar.jsx';

export function PageShell({ activeTab, onNavigate, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar activeTab={activeTab} onNavigate={onNavigate} />
      <main style={{ flex: 1, padding: '16px 20px', maxWidth: '1360px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>
      <footer style={{
        padding: '8px 20px',
        borderTop: '1px solid var(--border-medium)',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '11px',
        color: 'var(--text-subtle)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}>
        <span>SIH26-S01 Autonomous Threat Investigation & Incident Response Workstation</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>FastAPI & React Architecture</span>
      </footer>
    </div>
  );
}
