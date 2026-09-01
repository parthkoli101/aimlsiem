import React from 'react';
import { Terminal, Clock, Code } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge.jsx';
import { formatTimestamp } from '../../utils/severity.js';

export function IncidentTimeline({ events = [] }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-md)',
      padding: '16px'
    }}>
      <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Correlated Event Execution Timeline ({events.length} Log Items)
      </h3>
      <p style={{ fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '14px' }}>
        Chronological event chain reconstructed from raw SIEM/EDR log payloads
      </p>

      {events.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>No log events correlated for this incident timeline.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {events.map((evt, idx) => (
            <div key={evt.id || idx} style={{
              borderLeft: '2px solid var(--border-medium)',
              paddingLeft: '12px',
              position: 'relative'
            }}>
              {/* Timeline Bullet Dot */}
              <div style={{
                position: 'absolute',
                left: '-5px',
                top: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: evt.severity === 'CRITICAL' ? 'var(--status-critical-text)' : 'var(--accent-orange)'
              }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                  <RiskBadge severity={evt.severity} />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                    {formatTimestamp(evt.timestamp)}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                    {evt.source} <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '400', color: 'var(--text-subtle)' }}>(Event ID: {evt.eventID})</span>
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: '2px 0 4px', lineHeight: '1.4' }}>
                  {evt.description}
                </p>

                {evt.rawPayload && (
                  <pre style={{
                    fontSize: '11px',
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    overflowX: 'auto',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {evt.rawPayload}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
