import React from 'react';
import { IncidentRow } from './IncidentRow.jsx';
import { Shield } from 'lucide-react';

export function IncidentList({
  incidents = [],
  onInvestigate,
  onOpenManagerChat,
  onOpenMitigation
}) {
  return (
    <div>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Correlated Incident Case File ({incidents.length})
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
            Automated correlation of normalized event logs into prioritized security incident clusters
          </p>
        </div>
      </div>

      {/* Incident rows list */}
      {incidents.length === 0 ? (
        <div style={{
          padding: '30px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-subtle)',
          fontSize: '12px'
        }}>
          No active security incident clusters recorded.
        </div>
      ) : (
        incidents.map(incident => (
          <IncidentRow
            key={incident.id}
            incident={incident}
            onInvestigate={onInvestigate}
            onOpenManagerChat={onOpenManagerChat}
            onOpenMitigation={onOpenMitigation}
          />
        ))
      )}
    </div>
  );
}
