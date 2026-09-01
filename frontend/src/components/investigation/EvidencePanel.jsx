import React from 'react';
import { FileCheck, ShieldAlert } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge.jsx';

export function EvidencePanel({ incident }) {
  if (!incident) return null;

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          <FileCheck size={16} color="var(--accent-orange)" />
          Technical Evidence & Forensic Findings
        </h3>
        <RiskBadge severity={incident.severity} score={incident.riskScore} />
      </div>

      {/* Telemetry Metadata Table */}
      <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <table className="soc-table">
          <tbody>
            <tr>
              <td style={{ fontWeight: '600', width: '140px' }}>Target Host:</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{incident.affectedEntity}</td>
              <td style={{ fontWeight: '600', width: '120px' }}>Target User:</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{incident.user}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: '600' }}>Attack Category:</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{incident.attackType}</td>
              <td style={{ fontWeight: '600' }}>Confidence:</td>
              <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', fontWeight: '700' }}>{incident.confidence}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Identified Risk Factors */}
      <div>
        <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Correlated Risk Indicators:
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {incident.riskFactors?.map((factor, idx) => (
            <div key={idx} style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-subtle)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid var(--accent-orange)',
              fontFamily: 'var(--font-mono)'
            }}>
              • {factor}
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Response Box */}
      <div style={{
        backgroundColor: 'var(--status-high-bg)',
        border: '1px solid var(--status-high-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        fontSize: '12px'
      }}>
        <strong style={{ color: 'var(--status-high-text)', display: 'block', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Actionable Technical Recommendation:
        </strong>
        <p style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>
          {incident.recommendedResponse}
        </p>
      </div>
    </div>
  );
}
