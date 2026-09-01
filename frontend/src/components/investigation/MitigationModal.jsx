import React from 'react';
import { X, ShieldAlert, CheckSquare, Server, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { RiskBadge } from '../common/RiskBadge.jsx';

export function MitigationModal({ incident, onClose }) {
  if (!incident) return null;

  const playbookSections = [
    {
      phase: "Phase 1: Immediate Containment",
      priority: "CRITICAL",
      targetAsset: incident.affectedEntity,
      actions: [
        { action: `Isolate target host ${incident.affectedEntity} via EDR endpoint isolation API.`, rationale: "Prevents active C2 communication and lateral propagation." },
        { action: `Revoke active Kerberos and SSO session tokens for user ${incident.user}.`, rationale: "Invalidates potentially compromised credentials." },
        { action: `Block destination C2 IP 185.220.101.4 at perimeter firewall.`, rationale: "Halts ongoing data exfiltration attempts." }
      ]
    },
    {
      phase: "Phase 2: Deep Forensics & Investigation",
      priority: "HIGH",
      targetAsset: incident.affectedEntity,
      actions: [
        { action: "Extract volatile memory dump & PowerShell audit logs (Event ID 4104).", rationale: "Collects volatile malware artifacts and un-obfuscated script code." },
        { action: "Audit scheduled tasks, registry run keys, and WMI event consumers.", rationale: "Identifies installed persistence mechanisms." }
      ]
    },
    {
      phase: "Phase 3: Remediation & Recovery",
      priority: "MEDIUM",
      targetAsset: incident.affectedEntity,
      actions: [
        { action: "Re-image workstation from verified baseline image.", rationale: "Ensures complete eradication of residual artifacts." },
        { action: "Enforce mandatory password change & MFA re-authentication.", rationale: "Restores user identity integrity." }
      ]
    },
    {
      phase: "Phase 4: Hardening & Prevention",
      priority: "LOW",
      targetAsset: "Active Directory Domain",
      actions: [
        { action: "Enable PowerShell Constrained Language Mode via GPO.", rationale: "Restricts execution of unconstrained .NET reflection calls." },
        { action: "Deploy Attack Surface Reduction (ASR) rules for obfuscated scripts.", rationale: "Proactively blocks encoded PowerShell payloads." }
      ]
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '760px',
        maxHeight: '85vh',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-dark)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-medium)',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={15} color="var(--accent-orange)" />
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Incident Mitigation & Containment Playbook
              </h3>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              Case File: [{incident.id}] {incident.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {playbookSections.map((sec, idx) => (
            <div key={idx} style={{
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '12px', color: 'var(--text-main)' }}>{sec.phase}</strong>
                  <span style={{ fontSize: '10px', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>Target: {sec.targetAsset}</span>
                </div>
                <RiskBadge severity={sec.priority} />
              </div>

              <table className="soc-table">
                <thead>
                  <tr>
                    <th style={{ width: '60%' }}>Required Action</th>
                    <th>Technical Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {sec.actions.map((act, aIdx) => (
                    <tr key={aIdx}>
                      <td style={{ fontWeight: '600' }}>• {act.action}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{act.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-medium)',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          justify: 'flex-end'
        }}>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Playbook
          </Button>
        </div>
      </div>
    </div>
  );
}
