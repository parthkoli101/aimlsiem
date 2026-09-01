import React from 'react';
import { MessageSquare, ShieldAlert, ArrowRight, Clock, User, HardDrive, FileSearch } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge.jsx';
import { Button } from '../common/Button.jsx';
import { formatTimestamp } from '../../utils/severity.js';

export function IncidentRow({
  incident,
  onInvestigate,
  onOpenManagerChat,
  onOpenMitigation
}) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-light)',
      borderLeft: incident.severity === 'CRITICAL' ? '3px solid var(--status-critical-text)' : incident.severity === 'HIGH' ? '3px solid var(--accent-orange)' : '3px solid var(--border-medium)',
      padding: '12px 14px',
      marginBottom: '8px',
      borderRadius: 'var(--radius-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Top Header Line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RiskBadge severity={incident.severity} score={incident.riskScore} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)', fontWeight: '600' }}>
            {incident.id}
          </span>
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
            {incident.title}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
          <span><strong>Category:</strong> {incident.attackType}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {formatTimestamp(incident.timestamp)}
          </span>
        </div>
      </div>

      {/* Target & User telemetry line */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HardDrive size={12} color="var(--text-subtle)" />
          <strong>Target Entity:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{incident.affectedEntity}</code>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <User size={12} color="var(--text-subtle)" />
          <strong>Account:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{incident.user}</code>
        </span>
        <span>
          <strong>Confidence:</strong> {incident.confidence}
        </span>
      </div>

      {/* Evidence Summary Strip */}
      <div style={{
        fontSize: '12px',
        color: 'var(--text-main)',
        backgroundColor: 'var(--bg-subtle)',
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-light)',
        lineHeight: '1.4'
      }}>
        <strong style={{ color: 'var(--text-subtle)', fontSize: '11px', textTransform: 'uppercase', marginRight: '6px' }}>Evidence Summary:</strong>
        {incident.evidenceSummary}
      </div>

      {/* Compact Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', paddingTop: '2px' }}>
        <Button
          variant="outline"
          size="sm"
          icon={MessageSquare}
          onClick={() => onOpenManagerChat(incident)}
        >
          Explain to Manager
        </Button>

        <Button
          variant="outline"
          size="sm"
          icon={ShieldAlert}
          onClick={() => onOpenMitigation(incident)}
        >
          Mitigation Playbook
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={ArrowRight}
          onClick={() => onInvestigate(incident)}
        >
          Investigate Incident
        </Button>
      </div>
    </div>
  );
}
