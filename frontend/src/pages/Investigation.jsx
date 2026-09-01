import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, ShieldAlert, FileText } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { Button } from '../components/common/Button.jsx';
import { IncidentTimeline } from '../components/investigation/IncidentTimeline.jsx';
import { EvidencePanel } from '../components/investigation/EvidencePanel.jsx';
import { RelatedIntelligence } from '../components/investigation/RelatedIntelligence.jsx';
import { ManagerChat } from '../components/investigation/ManagerChat.jsx';
import { MitigationModal } from '../components/investigation/MitigationModal.jsx';
import { fetchIncidentEvents } from '../services/api.js';

export function Investigation({ incident, onBack, onGenerateReport }) {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showMitigation, setShowMitigation] = useState(false);

  useEffect(() => {
    if (incident?.id) {
      setLoadingEvents(true);
      fetchIncidentEvents(incident.id).then(data => {
        setEvents(data);
        setLoadingEvents(false);
      });
    }
  }, [incident]);

  if (!incident) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-subtle)', marginBottom: '12px', fontSize: '12px' }}>No incident selected for forensic investigation.</p>
        <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Return to SOC Dashboard</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header bar */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                background: 'transparent',
                fontSize: '11px',
                color: 'var(--text-subtle)',
                cursor: 'pointer',
                marginBottom: '4px'
              }}
            >
              <ArrowLeft size={13} /> Back to SOC Dashboard
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RiskBadge severity={incident.severity} score={incident.riskScore} />
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)', fontWeight: '700' }}>{incident.id}</span>
              <h1 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{incident.title}</h1>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <Button variant="outline" size="sm" icon={MessageSquare} onClick={() => setShowChat(true)}>
              Explain to Manager
            </Button>
            <Button variant="outline" size="sm" icon={ShieldAlert} onClick={() => setShowMitigation(true)}>
              Mitigation Playbook
            </Button>
            <Button variant="primary" size="sm" icon={FileText} onClick={onGenerateReport}>
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Main Forensic Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '16px' }}>
        {/* Left Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <EvidencePanel incident={incident} />
          
          {loadingEvents ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              Loading correlated log execution timeline...
            </div>
          ) : (
            <IncidentTimeline events={events} />
          )}
        </div>

        {/* Right Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <RelatedIntelligence />
        </div>
      </div>

      {/* Modals */}
      {showChat && (
        <ManagerChat incident={incident} onClose={() => setShowChat(false)} />
      )}
      {showMitigation && (
        <MitigationModal incident={incident} onClose={() => setShowMitigation(false)} />
      )}
    </div>
  );
}
