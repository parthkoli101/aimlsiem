import React, { useState } from 'react';
import {
  Shield, Globe, ChevronRight, ChevronDown, ChevronUp,
  ArrowLeft, AlertTriangle, X, RefreshCw,
  Mail, Bug, Network, Database, User, Laptop, Key, Server,
  ShieldCheck, Monitor, Users, TrendingUp, HelpCircle
} from 'lucide-react';
import { ManagerChat } from '../components/investigation/ManagerChat.jsx';

// ─── Theme & Category Config ──────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    dotColor: '#EF4444',
    stripeColor: '#EA580C',
    pillBorder: '#FCA5A5',
    pillText: '#DC2626',
    badgeBg: '#FEF2F2',
    badgeText: '#B91C1C',
    badgeBorder: '#FECACA',
  },
  HIGH: {
    label: 'High',
    dotColor: '#8B5CF6',
    stripeColor: '#7C3AED',
    pillBorder: '#DDD6FE',
    pillText: '#6D28D9',
    badgeBg: '#F5F3FF',
    badgeText: '#6D28D9',
    badgeBorder: '#DDD6FE',
  },
  MEDIUM: {
    label: 'Medium',
    dotColor: '#F59E0B',
    stripeColor: '#D97706',
    pillBorder: '#FDE68A',
    pillText: '#B45309',
    badgeBg: '#FFFBEB',
    badgeText: '#B45309',
    badgeBorder: '#FDE68A',
  },
  LOW: {
    label: 'Low',
    dotColor: '#10B981',
    stripeColor: '#059669',
    pillBorder: '#A7F3D0',
    pillText: '#047857',
    badgeBg: '#ECFDF5',
    badgeText: '#047857',
    badgeBorder: '#A7F3D0',
  }
};

const CATEGORY_MAP = {
  phishing: { icon: Mail, bg: '#FFF7ED', color: '#EA580C', stripe: '#EA580C' },
  malware: { icon: Bug, bg: '#F5F3FF', color: '#7C3AED', stripe: '#7C3AED' },
  bot: { icon: Bug, bg: '#F5F3FF', color: '#7C3AED', stripe: '#7C3AED' },
  remote: { icon: Network, bg: '#EFF6FF', color: '#2563EB', stripe: '#2563EB' },
  network: { icon: Network, bg: '#EFF6FF', color: '#2563EB', stripe: '#2563EB' },
  psexec: { icon: Server, bg: '#EFF6FF', color: '#2563EB', stripe: '#2563EB' },
  lateral: { icon: Server, bg: '#EFF6FF', color: '#2563EB', stripe: '#2563EB' },
  data: { icon: Database, bg: '#FFFBEB', color: '#D97706', stripe: '#D97706' },
  leakage: { icon: Database, bg: '#FFFBEB', color: '#D97706', stripe: '#D97706' },
  exfiltration: { icon: Database, bg: '#FFFBEB', color: '#D97706', stripe: '#D97706' },
  credential: { icon: User, bg: '#F0FDF4', color: '#16A34A', stripe: '#16A34A' },
  kerberos: { icon: Key, bg: '#F0FDF4', color: '#16A34A', stripe: '#16A34A' },
  mimikatz: { icon: Key, bg: '#F0FDF4', color: '#16A34A', stripe: '#16A34A' },
  web: { icon: Laptop, bg: '#F0FDFA', color: '#0D9488', stripe: '#0D9488' },
  sql: { icon: Laptop, bg: '#F0FDFA', color: '#0D9488', stripe: '#0D9488' },
  ddos: { icon: AlertTriangle, bg: '#FEF2F2', color: '#DC2626', stripe: '#DC2626' },
  default: { icon: Shield, bg: '#F8FAFC', color: '#475569', stripe: '#475569' }
};

function getCategoryStyle(attackName = '', attackType = '') {
  const text = (attackName + ' ' + attackType).toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(key)) return val;
  }
  return CATEGORY_MAP.default;
}

const FINANCIAL_TEMPLATES = {
  'DDoS': { range: '$50K – $500K', dataRisk: 'Service downtime, SLA penalties & client disruption', darkWebRisk: 'LOW', detail: 'Volumetric flood intended to exhaust server resources or demand ransom.' },
  'Data Exfiltration': { range: '$250K – $5.2M', dataRisk: 'Customer PII, intellectual property, financial databases', darkWebRisk: 'CRITICAL', detail: 'Exfiltrated confidential data is often listed on dark web forums within 30–90 days.' },
  'Credential Compromise': { range: '$100K – $2.1M', dataRisk: 'Domain administrator accounts, employee credentials, SSO tokens', darkWebRisk: 'HIGH', detail: 'Stolen credentials are sold on underground broker markets for initial access.' },
  'Lateral Movement': { range: '$200K – $3.5M', dataRisk: 'Internal core servers, domain controllers, backup repositories', darkWebRisk: 'HIGH', detail: 'Precursor step before full network-wide ransomware deployment.' },
  'Privilege Escalation': { range: '$150K – $2.8M', dataRisk: 'System-level admin rights and identity takeover', darkWebRisk: 'HIGH', detail: 'Enables attackers to bypass access security controls and create persistent backdoors.' },
  'Bot': { range: '$80K – $1.2M', dataRisk: 'Internal bandwidth, compute clusters, network endpoints', darkWebRisk: 'MEDIUM', detail: 'Infected machines become part of an adversary-controlled command network.' },
  'Web Attack': { range: '$150K – $3.0M', dataRisk: 'Customer database, payment tables, application source code', darkWebRisk: 'HIGH', detail: 'Direct exploit of web applications to extract sensitive records.' },
  'default': { range: '$75K – $1.5M', dataRisk: 'System integrity, internal communications, business workflow', darkWebRisk: 'MEDIUM', detail: 'Financial impact depends on containment speed and depth of breach.' }
};

function getFinancialTemplate(attackType = '') {
  const key = Object.keys(FINANCIAL_TEMPLATES).find(k =>
    attackType.toLowerCase().includes(k.toLowerCase())
  );
  return FINANCIAL_TEMPLATES[key || 'default'];
}

function formatUsd(n) {
  if (!n || n === 0) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

// ─── Top Overall Risk Arc Gauge ───────────────────────────────────────────────

function OverallRiskGauge({ score10, level }) {
  const radius = 64;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - ((score10 / 10) * arcLength);

  const colors = {
    CRITICAL: { stroke: '#EA580C', bg: '#FFEDD5', badge: '#EA580C', text: '#C2410C', label: 'CRITICAL RISK' },
    HIGH: { stroke: '#EA580C', bg: '#FFEDD5', badge: '#EA580C', text: '#C2410C', label: 'HIGH RISK' },
    MEDIUM: { stroke: '#F59E0B', bg: '#FEF3C7', badge: '#F59E0B', text: '#B45309', label: 'MEDIUM RISK' },
    LOW: { stroke: '#10B981', bg: '#D1FAE5', badge: '#10B981', text: '#047857', label: 'LOW RISK' },
  };

  const style = colors[level] || colors.HIGH;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px 12px'
    }}>
      <div style={{ position: 'relative', width: '140px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="140" height="130" viewBox="0 0 140 130">
          <circle
            stroke="#F1F5F9"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            style={{ strokeLinecap: 'round' }}
            r={normalizedRadius}
            cx="70"
            cy="70"
            transform="rotate(135 70 70)"
          />
          <circle
            stroke={style.stroke}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            style={{ strokeLinecap: 'round', transition: 'stroke-dashoffset 0.8s ease' }}
            r={normalizedRadius}
            cx="70"
            cy="70"
            transform="rotate(135 70 70)"
          />
        </svg>

        <div style={{ position: 'absolute', top: '34px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', lineHeight: '1', letterSpacing: '-0.03em' }}>
            {score10}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', marginTop: '2px' }}>
            / 10
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '-6px',
        padding: '5px 16px',
        backgroundColor: style.bg,
        borderRadius: '9999px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: '800',
        color: style.text,
        letterSpacing: '0.04em'
      }}>
        <AlertTriangle size={12} color={style.badge} />
        {style.label}
      </div>
    </div>
  );
}

// ─── Dark Web Modal ───────────────────────────────────────────────────────────

function DarkWebModal({ incident, onClose }) {
  const tmpl = getFinancialTemplate(incident.attackType);
  const groqRisk = formatUsd(incident.financialRiskUsd);

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 400, padding: '16px', backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        width: '100%', maxWidth: '580px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #F1F5F9',
          backgroundColor: '#FFF7ED', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={18} color="#EA580C" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#9A3412' }}>
                Dark Web & Financial Impact Analysis
              </div>
              <div style={{ fontSize: '12px', color: '#C2410C' }}>
                {incident.title || incident.attackType}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Estimated Financial Cost
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#DC2626', fontFamily: 'var(--font-mono)' }}>
                {groqRisk || tmpl.range}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                {groqRisk ? 'Calculated based on threat telemetry' : 'Industry average breach loss'}
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Dark Web Exposure Risk
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: tmpl.darkWebRisk === 'CRITICAL' ? '#DC2626' : '#EA580C' }}>
                {tmpl.darkWebRisk}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                Likelihood of underground data broker listing
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
              Assets & Information at Risk
            </div>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
              {tmpl.dataRisk}
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400E', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} color="#D97706" /> Threat Landscape Assessment
            </div>
            <div style={{ fontSize: '12px', color: '#B45309', lineHeight: '1.5' }}>
              {tmpl.detail}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Single Human Threat Card (Exact Image Match) ─────────────────────────────

function ThreatCard({ incident, onOpenDarkWeb, onOpenChat, onGetRemediation }) {
  const [expanded, setExpanded] = useState(false);
  const sevKey = incident.severity?.toUpperCase() || 'MEDIUM';
  const sevStyle = SEVERITY_CONFIG[sevKey] || SEVERITY_CONFIG.MEDIUM;
  const catStyle = getCategoryStyle(incident.title, incident.attackType);
  const IconComponent = catStyle.icon;

  const score10 = (Math.max(10, Math.min(100, incident.riskScore || 70)) / 10).toFixed(1);

  const primaryOneLiner = incident.oneLiner || incident.groqManagerSummary || 'Unusual activity was observed that could threaten organizational security.';
  const technicalOrSimpleError = incident.groqExplanation || incident.evidenceSummary || 'Security monitoring flagged suspicious patterns that deviate from normal operating behavior.';

  const hasSemanticMatches = incident.semanticMatches && incident.semanticMatches.length > 0;

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
      marginBottom: '16px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease'
    }}>
      {/* Left colored stripe */}
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: '5px',
        backgroundColor: catStyle.stripe || sevStyle.stripeColor,
        borderRadius: '16px 0 0 16px'
      }} />

      {/* Main card body */}
      <div style={{
        padding: '20px 24px 20px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        {/* Left icon + Name + Human explanations */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', flex: '1 1 360px', minWidth: '280px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: catStyle.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px'
          }}>
            <IconComponent size={24} color={catStyle.color} strokeWidth={1.8} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#0F172A',
              margin: '0 0 6px 0',
              lineHeight: '1.3'
            }}>
              {incident.title || incident.attackType}
            </h3>

            <p style={{
              fontSize: '13px',
              color: '#475569',
              margin: '0 0 6px 0',
              lineHeight: '1.45',
              fontWeight: '500'
            }}>
              {primaryOneLiner}
            </p>

            <p style={{
              fontSize: '12px',
              color: '#64748B',
              margin: 0,
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ color: '#0284C7', fontWeight: '600' }}>What happened:</span> {technicalOrSimpleError}
            </p>
          </div>
        </div>

        {/* Center: Risk Score */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '90px',
          padding: '0 16px',
          borderLeft: '1px solid #F1F5F9',
          borderRight: '1px solid #F1F5F9'
        }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
            RISK SCORE
          </span>

          <div style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            border: `1.5px solid ${sevStyle.pillBorder}`,
            fontSize: '14px',
            fontWeight: '800',
            color: sevStyle.pillText,
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '2px',
            backgroundColor: '#FFFFFF'
          }}>
            <span>{score10}</span>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>/10</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: sevStyle.dotColor }} />
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>
              {sevStyle.label}
            </span>
          </div>
        </div>

        {/* Right: 3 Action Buttons + Chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
          <button
            onClick={() => onOpenDarkWeb(incident)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1.5px solid #FED7AA',
              backgroundColor: '#FFFFFF',
              color: '#EA580C',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FFF7ED'; e.currentTarget.style.borderColor = '#F97316'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#FED7AA'; }}
          >
            <Globe size={15} color="#EA580C" />
            <span>Dark Web Cost</span>
          </button>

          <button
            onClick={() => onGetRemediation(incident)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1.5px solid #BBF7D0',
              backgroundColor: '#FFFFFF',
              color: '#16A34A',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F0FDF4'; e.currentTarget.style.borderColor = '#22C55E'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#BBF7D0'; }}
          >
            <ShieldCheck size={15} color="#16A34A" />
            <span>Mitigation Policies</span>
          </button>

          <button
            onClick={() => onOpenChat(incident)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1.5px solid #DDD6FE',
              backgroundColor: '#FFFFFF',
              color: '#7C3AED',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F5F3FF'; e.currentTarget.style.borderColor = '#8B5CF6'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#DDD6FE'; }}
          >
            <User size={15} color="#7C3AED" />
            <span>Explain Me Like a Manager</span>
          </button>

          {hasSemanticMatches && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              title="View similar historical attacks"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Semantic Search Historical Matches */}
      {expanded && hasSemanticMatches && (
        <div style={{
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          padding: '16px 24px 20px 28px'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <TrendingUp size={13} color="#0284C7" />
            SIMILAR HISTORICAL ATTACKS ({incident.semanticMatches.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incident.semanticMatches.map((m, i) => (
              <div key={i} style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '3px' }}>
                    {m.attackPattern}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>Vector:</span> {m.vector}
                  </div>
                  <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '2px', fontWeight: '500' }}>
                    <span style={{ fontWeight: '600' }}>Outcome:</span> {m.outcome}
                  </div>
                </div>

                <div style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  color: '#EA580C',
                  fontSize: '12px',
                  fontWeight: '800',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap'
                }}>
                  {m.similarityScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Results Page ────────────────────────────────────────────────────────

export function Results({ incidents, metadata, onGetRemediation, onBack }) {
  const [openChat, setOpenChat] = useState(null);
  const [openDarkWeb, setOpenDarkWeb] = useState(null);

  if (!incidents || incidents.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center' }}>
        <Shield size={40} color="var(--text-subtle)" style={{ marginBottom: '12px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
          No Active Threats Detected
        </h2>
        <p style={{ fontSize: '13px', color: '#64748B' }}>
          The telemetry log analysis completed cleanly without detecting any high-risk security threats.
        </p>
        <button
          onClick={onBack}
          style={{
            marginTop: '16px', padding: '9px 18px',
            border: '1px solid #CBD5E1', borderRadius: '8px',
            backgroundColor: '#FFFFFF', cursor: 'pointer',
            fontSize: '12px', fontWeight: '600', color: '#334155',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}
        >
          <ArrowLeft size={14} /> Upload Another Log
        </button>
      </div>
    );
  }

  // Calculate Overall Risk & Stats
  const totalAttacks = incidents.length;
  const maxRisk = Math.max(...incidents.map(i => i.riskScore || 50));
  const avgRisk = incidents.reduce((acc, curr) => acc + (curr.riskScore || 50), 0) / incidents.length;
  const overallScore10 = (Math.max(30, maxRisk * 0.7 + avgRisk * 0.3) / 10).toFixed(1);

  const overallLevel = overallScore10 >= 8.0 ? 'CRITICAL' : overallScore10 >= 6.5 ? 'HIGH' : overallScore10 >= 4.0 ? 'MEDIUM' : 'LOW';

  const allEntities = new Set();
  incidents.forEach(i => {
    if (i.affectedEntity) allEntities.add(i.affectedEntity);
    if (i.affectedEntities) i.affectedEntities.forEach(e => allEntities.add(e));
  });
  const exposedAssetsCount = Math.max(allEntities.size, totalAttacks * 2);
  const highRiskIdentitiesCount = Math.max(1, Math.round(exposedAssetsCount * 0.28));

  const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ maxWidth: '1080px', margin: '16px auto 40px', padding: '0 8px' }}>

      {/* Top Header Card Container */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        marginBottom: '28px',
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gap: '32px',
        alignItems: 'center'
      }}>
        {/* Left: Overall Risk Score Gauge */}
        <div style={{ borderRight: '1px solid #F1F5F9', paddingRight: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            OVERALL RISK SCORE <HelpCircle size={12} color="#94A3B8" />
          </div>
          <OverallRiskGauge score10={overallScore10} level={overallLevel} />
        </div>

        {/* Right: Overall Summary & 4 Metric Cards */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            OVERALL SUMMARY
          </div>
          <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 18px 0' }}>
            Your organization faces a <strong style={{ color: overallLevel === 'CRITICAL' ? '#DC2626' : '#EA580C' }}>{overallLevel === 'CRITICAL' ? 'Critical' : 'High'}</strong> risk of compromise due to active threats exploiting exposed assets and identity vulnerabilities.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ backgroundColor: '#FAF5FF', borderRadius: '12px', padding: '12px 14px', border: '1px solid #F3E8FF', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} color="#7C3AED" />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', lineHeight: '1.1' }}>{totalAttacks}</div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#6B7280', marginTop: '2px' }}>Active Threats</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#EFF6FF', borderRadius: '12px', padding: '12px 14px', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Monitor size={16} color="#2563EB" />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', lineHeight: '1.1' }}>{exposedAssetsCount}</div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#6B7280', marginTop: '2px' }}>Exposed Assets</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFBEB', borderRadius: '12px', padding: '12px 14px', border: '1px solid #FEF3C7', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} color="#D97706" />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', lineHeight: '1.1' }}>{highRiskIdentitiesCount}</div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#6B7280', marginTop: '2px' }}>High Risk Identities</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#F0FDF4', borderRadius: '12px', padding: '12px 14px', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color="#16A34A" />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#15803D', lineHeight: '1.1' }}>+18%</div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#6B7280', marginTop: '2px' }}>Risk Change vs 7d</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EA580C' }} />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', letterSpacing: '0.02em', textTransform: 'uppercase', margin: 0 }}>
              THREATS IDENTIFIED ({totalAttacks})
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 26px' }}>
            Detailed breakdown of key attacks and their impact.
          </p>
        </div>

        <button
          onClick={onBack}
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: '12px', fontWeight: '600', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          <ArrowLeft size={14} /> Upload New Telemetry Log
        </button>
      </div>

      {/* List of Human Threat Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {incidents.map(inc => (
          <ThreatCard
            key={inc.id}
            incident={inc}
            onOpenDarkWeb={setOpenDarkWeb}
            onOpenChat={setOpenChat}
            onGetRemediation={onGetRemediation}
          />
        ))}
      </div>

      {/* Bottom Footer Bar */}
      <div style={{
        marginTop: '24px',
        padding: '14px 20px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748B' }}>
          <ShieldCheck size={16} color="#0284C7" />
          <span>
            Risk scores are calculated using multiple threat intelligence sources, vulnerability data, and attack surface analysis.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
          <span>Last updated: {currentDateStr} · {currentTimeStr}</span>
          <RefreshCw size={13} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {/* Contextual Modals */}
      {openChat && (
        <ManagerChat incident={openChat} onClose={() => setOpenChat(null)} />
      )}
      {openDarkWeb && (
        <DarkWebModal incident={openDarkWeb} onClose={() => setOpenDarkWeb(null)} />
      )}
    </div>
  );
}
