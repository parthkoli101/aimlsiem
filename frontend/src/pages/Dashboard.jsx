import React, { useState } from 'react';
import { RiskOverview } from '../components/dashboard/RiskOverview.jsx';
import { IncidentList } from '../components/dashboard/IncidentList.jsx';
import { ManagerChat } from '../components/investigation/ManagerChat.jsx';
import { MitigationModal } from '../components/investigation/MitigationModal.jsx';
import { useIncidents } from '../hooks/useIncidents.js';

export function Dashboard({ onSelectIncident, onGenerateReport }) {
  const { incidents, loading, error } = useIncidents();
  const [selectedForChat, setSelectedForChat] = useState(null);
  const [selectedForMitigation, setSelectedForMitigation] = useState(null);

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        Loading correlated incident state...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--status-critical-text)', fontSize: '12px' }}>
        Error loading incident state: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            SOC Operations Dashboard
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
            Real-time threat status, posture metrics, and incident investigation list
          </p>
        </div>
      </div>

      <RiskOverview incidents={incidents} onGenerateReport={onGenerateReport} />

      <IncidentList
        incidents={incidents}
        onInvestigate={(incident) => onSelectIncident(incident)}
        onOpenManagerChat={(incident) => setSelectedForChat(incident)}
        onOpenMitigation={(incident) => setSelectedForMitigation(incident)}
      />

      {/* Contextual Modals */}
      {selectedForChat && (
        <ManagerChat
          incident={selectedForChat}
          onClose={() => setSelectedForChat(null)}
        />
      )}

      {selectedForMitigation && (
        <MitigationModal
          incident={selectedForMitigation}
          onClose={() => setSelectedForMitigation(null)}
        />
      )}
    </div>
  );
}
