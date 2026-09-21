import React from 'react';
import {
  ArrowLeft, Clock, AlertTriangle, Calendar, Shield,
  CheckCircle, ChevronRight, Zap
} from 'lucide-react';

const SEV_STYLE = {
  CRITICAL: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', dot: '#EF4444' },
  HIGH:     { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', dot: '#F97316' },
  MEDIUM:   { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', dot: '#F59E0B' },
  LOW:      { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', dot: '#22C55E' },
};

const PHASE_CONFIG = [
  {
    key: 'mitigationImmediate',
    label: 'Immediate Action',
    sublabel: 'Do this right now — within the next hour',
    icon: Zap,
    color: '#B91C1C',
    bg: '#FEF2F2',
    border: '#FECACA',
    badgeColor: '#EF4444',
    number_offset: 0,
  },
  {
    key: 'mitigationShortTerm',
    label: 'Short-Term Response',
    sublabel: 'Complete within the next 24 hours',
    icon: Clock,
    color: '#C2410C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    badgeColor: '#F97316',
    number_offset: 99,
  },
  {
    key: 'mitigationLongTerm',
    label: 'Long-Term Hardening',
    sublabel: 'Strategic improvements — complete within 30 days',
    icon: Calendar,
    color: '#0369A1',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    badgeColor: '#3B82F6',
    number_offset: 999,
  },
];

function fallbackSteps(incident) {
  // If Groq didn't give phased steps, use mitigationSteps or recommendedResponse
  const all = incident.mitigationSteps || [];
  if (all.length === 0 && incident.recommendedResponse) {
    return [incident.recommendedResponse];
  }
  return all;
}

function getPhaseSteps(incident, phaseKey) {
  const steps = incident[phaseKey];
  if (steps && steps.length > 0) return steps;
  // Fallback: split mitigationSteps into thirds
  const all = fallbackSteps(incident);
  const n = all.length;
  if (n === 0) return [];
  if (phaseKey === 'mitigationImmediate') return all.slice(0, Math.max(1, Math.ceil(n / 3)));
  if (phaseKey === 'mitigationShortTerm') return all.slice(Math.ceil(n / 3), Math.ceil(2 * n / 3));
  if (phaseKey === 'mitigationLongTerm') return all.slice(Math.ceil(2 * n / 3));
  return [];
}

function PhaseSection({ config, steps, startNum }) {
  const Icon = config.icon;
  if (!steps || steps.length === 0) return null;

  return (
    <div style={{
      border: `1px solid ${config.border}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      {/* Phase header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: config.bg,
        borderBottom: `1px solid ${config.border}`,
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          backgroundColor: config.badgeColor, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: config.color, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {config.label}
          </div>
          <div style={{ fontSize: '11px', color: config.color, opacity: 0.75 }}>
            {config.sublabel}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            padding: '12px 16px',
            borderBottom: i < steps.length - 1 ? '1px solid var(--border-light)' : 'none',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${config.badgeColor}`,
              backgroundColor: `${config.badgeColor}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: config.color,
              fontFamily: 'var(--font-mono)',
            }}>
              {startNum + i}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                margin: 0, fontSize: '13px', color: 'var(--text-main)',
                lineHeight: '1.5', fontWeight: '500',
              }}>
                {step}
              </p>
            </div>
            <CheckCircle size={15} color="var(--border-medium)" style={{ flexShrink: 0, marginTop: '2px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Remediation({ incident, onBack }) {
  if (!incident) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-subtle)' }}>No incident selected.</p>
        <button onClick={onBack} style={{ marginTop: '12px', cursor: 'pointer', padding: '8px 16px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)' }}>
          Go Back
        </button>
      </div>
    );
  }

  const sev = SEV_STYLE[incident.severity] || SEV_STYLE.MEDIUM;

  // Count steps per phase for step numbering
  const immediateSteps = getPhaseSteps(incident, 'mitigationImmediate');
  const shortTermSteps = getPhaseSteps(incident, 'mitigationShortTerm');
  const longTermSteps = getPhaseSteps(incident, 'mitigationLongTerm');
  const totalSteps = immediateSteps.length + shortTermSteps.length + longTermSteps.length;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          fontSize: '11px', color: 'var(--text-subtle)',
          display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px',
        }}
      >
        <ArrowLeft size={13} /> Back to Results
      </button>

      {/* Incident header card */}
      <div style={{
        padding: '16px 20px',
        border: `1px solid ${sev.border}`,
        borderLeft: `5px solid ${sev.dot}`,
        borderRadius: 'var(--radius-md)',
        backgroundColor: sev.bg,
        marginBottom: '20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Shield size={16} color={sev.text} />
            <span style={{ fontSize: '12px', fontWeight: '800', color: sev.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Remediation Plan
            </span>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            {incident.title || incident.attackType}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            {incident.oneLiner || incident.evidenceSummary || incident.groqManagerSummary}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: sev.text, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            {incident.riskScore}
          </div>
          <div style={{ fontSize: '10px', color: sev.text, opacity: 0.8 }}>Risk Score</div>
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
            {totalSteps} remediation steps
          </div>
        </div>
      </div>

      {/* Explanation (if available) */}
      {(incident.groqExplanation || incident.evidenceSummary) && (
        <div style={{
          padding: '14px 16px',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-secondary)',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Why This Attack Needs Remediation
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.55' }}>
            {incident.groqExplanation || incident.evidenceSummary}
          </p>
        </div>
      )}

      {/* Phase sections */}
      <PhaseSection
        config={PHASE_CONFIG[0]}
        steps={immediateSteps}
        startNum={1}
      />
      <PhaseSection
        config={PHASE_CONFIG[1]}
        steps={shortTermSteps}
        startNum={immediateSteps.length + 1}
      />
      <PhaseSection
        config={PHASE_CONFIG[2]}
        steps={longTermSteps}
        startNum={immediateSteps.length + shortTermSteps.length + 1}
      />

      {totalSteps === 0 && (
        <div style={{
          padding: '24px', textAlign: 'center',
          border: '1px dashed var(--border-medium)',
          borderRadius: 'var(--radius-md)', color: 'var(--text-subtle)', fontSize: '13px',
        }}>
          No remediation steps available. Configure GROQ_API_KEY in backend/.env to generate AI-powered steps.
        </div>
      )}

      {/* Footer note */}
      <div style={{
        marginTop: '20px', padding: '12px 16px',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--bg-subtle)',
        fontSize: '11px', color: 'var(--text-subtle)', lineHeight: '1.5',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <AlertTriangle size={13} />
        Remediation steps are AI-generated guidance. Always validate against your organization's specific security policies and engage your CISO or incident response team for CRITICAL incidents.
      </div>
    </div>
  );
}
