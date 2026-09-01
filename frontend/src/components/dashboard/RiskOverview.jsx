import React from 'react';
import { ShieldAlert, FileText, Activity, Layers } from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { RiskBadge } from '../common/RiskBadge.jsx';

export function RiskOverview({ incidents = [], onGenerateReport }) {
  const activeCount = incidents.filter(i => i.status !== 'Mitigated').length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
  const highCount = incidents.filter(i => i.severity === 'HIGH').length;

  const maxRiskScore = incidents.reduce((max, inc) => Math.max(max, inc.riskScore || 0), 0);
  const overallSeverity = criticalCount > 0 ? 'CRITICAL' : highCount > 0 ? 'HIGH' : 'MEDIUM';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
      marginBottom: '16px'
    }}>
      {/* Security Posture Status */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Overall Security Posture
          </span>
          <ShieldAlert size={14} color="var(--accent-orange)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
          <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            {maxRiskScore}<span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>/100</span>
          </span>
          <RiskBadge severity={overallSeverity} label={overallSeverity} />
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-subtle)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
          Max Threat Index
        </span>
      </div>

      {/* Active Correlated Incidents */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Correlated Threats
          </span>
          <Activity size={14} color="var(--text-muted)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
          <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            {activeCount}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ({criticalCount} Critical, {highCount} High)
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-subtle)', marginTop: '4px' }}>
          Auto-correlated attack clusters
        </span>
      </div>

      {/* Ingested Telemetry Stats */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Analyzed Event Records
          </span>
          <Layers size={14} color="var(--text-muted)" />
        </div>
        <div style={{ marginTop: '6px' }}>
          <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            14,200
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-subtle)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
          Normalized JSON telemetry
        </span>
      </div>

      {/* Reporting Action Box */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Executive Action
          </span>
          <FileText size={14} color="var(--text-muted)" />
        </div>
        <div style={{ marginTop: '6px' }}>
          <Button 
            variant="primary" 
            size="sm"
            icon={FileText} 
            onClick={onGenerateReport}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Generate Incident Report
          </Button>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-subtle)', marginTop: '4px' }}>
          Compile PDF for stakeholders
        </span>
      </div>
    </div>
  );
}
