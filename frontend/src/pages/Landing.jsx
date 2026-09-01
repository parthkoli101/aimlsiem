import React from 'react';
import { Shield, ArrowRight, Activity, Terminal, Lock, FileSearch, Cpu, CheckCircle } from 'lucide-react';
import { Button } from '../components/common/Button.jsx';
import { MOCK_INCIDENTS } from '../mock/incidents.js';

export function Landing({ onStart }) {
  const activeCount = MOCK_INCIDENTS.filter(i => i.status !== 'Mitigated').length;
  const criticalCount = MOCK_INCIDENTS.filter(i => i.severity === 'CRITICAL').length;

  return (
    <div style={{ maxWidth: '1100px', margin: '16px auto 32px' }}>
      {/* Compact Hero Section */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '32px 36px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-orange-light)',
          color: 'var(--accent-orange)',
          fontSize: '11px',
          fontWeight: '700',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          marginBottom: '12px',
          border: '1px solid var(--status-high-border)'
        }}>
          <Shield size={13} /> SIH26-S01 Security Operations Workstation
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: '800',
          letterSpacing: '-0.01em',
          color: 'var(--text-main)',
          lineHeight: '1.3',
          marginBottom: '12px'
        }}>
          Agentic AI Cybersecurity Assistant for Automated Threat Investigation
        </h1>

        <p style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          maxWidth: '780px',
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          Autonomous log ingestion, multi-stage attack correlation, evidence-backed manager explanations, and targeted mitigation playbooks for Security Operations Centers (SOC).
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="primary" size="md" icon={ArrowRight} onClick={onStart}>
            Start Investigation Workstream
          </Button>
        </div>
      </div>

      {/* Operational Summary Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>
            System Status
          </span>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--status-low-text)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={15} /> Operational
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>FastAPI + React Engine</span>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>
            Correlated Incidents
          </span>
          <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '4px' }}>
            {activeCount} Active <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--status-critical-text)' }}>({criticalCount} Critical)</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>Multi-stage attack clusters</span>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>
            Monitored Entities
          </span>
          <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '4px' }}>
            14 Hosts / 42 Users
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>Active domain environment</span>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>
            Ingested Log Records
          </span>
          <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', marginTop: '4px' }}>
            14,200 Events
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>Normalized security events</span>
        </div>
      </div>

      {/* Restrained Workstation Capabilities Table */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '20px'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Workstation Architecture Modules
        </h3>
        <table className="soc-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Operational Function</th>
              <th>Key Outputs</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: '600' }}>Log Ingestion & Normalization</td>
              <td>Ingests raw JSON EDR/SIEM event logs or live URL streams</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Parsed JSON schema, Event ID indexing</td>
              <td><span style={{ color: 'var(--status-low-text)', fontWeight: '600', fontSize: '11px' }}>READY</span></td>
            </tr>
            <tr>
              <td style={{ fontWeight: '600' }}>Multi-Agent Correlation</td>
              <td>Links isolated security events across hosts into chronological attack graphs</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Attack chains, Risk scores, Confidence</td>
              <td><span style={{ color: 'var(--status-low-text)', fontWeight: '600', fontSize: '11px' }}>READY</span></td>
            </tr>
            <tr>
              <td style={{ fontWeight: '600' }}>Contextual Manager Explanation</td>
              <td>Context-locked chat assistant translating technical telemetry into executive briefs</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Executive Summaries, Risk impact</td>
              <td><span style={{ color: 'var(--status-low-text)', fontWeight: '600', fontSize: '11px' }}>READY</span></td>
            </tr>
            <tr>
              <td style={{ fontWeight: '600' }}>Mitigation Playbooks</td>
              <td>Phased containment and recovery steps prioritized by asset criticality</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Containment steps, GPO recommendations</td>
              <td><span style={{ color: 'var(--status-low-text)', fontWeight: '600', fontSize: '11px' }}>READY</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
