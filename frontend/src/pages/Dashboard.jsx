import React, { useState } from 'react';
import { RiskOverview } from '../components/dashboard/RiskOverview.jsx';
import { IncidentList } from '../components/dashboard/IncidentList.jsx';
import { ManagerChat } from '../components/investigation/ManagerChat.jsx';
import { MitigationModal } from '../components/investigation/MitigationModal.jsx';
import { useIncidents } from '../hooks/useIncidents.js';
import { CheckCircle, Database } from 'lucide-react';

export function Dashboard({ onSelectIncident, onGenerateReport, realIncidents, analysisMetadata }) {
  const { incidents: hookIncidents, loading, error } = useIncidents();
  // Use real pipeline output when available, otherwise fall back to hook/mock
  const incidents = (realIncidents && realIncidents.length > 0) ? realIncidents : hookIncidents;
  const isRealData = realIncidents && realIncidents.length > 0;
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

      {/* Pipeline result banner */}
      {isRealData && analysisMetadata && (
        <div style={{
          padding: '8px 12px', marginBottom: '12px',
          backgroundColor: 'var(--status-low-bg)',
          border: '1px solid var(--status-low-border)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '11px', color: 'var(--status-low-text)',
        }}>
          <CheckCircle size={13} />
          <span>
            <strong>Pipeline Complete</strong> — {analysisMetadata.n_incidents ?? incidents.length} incident(s) detected
            from {analysisMetadata.total_events ?? '?'} events
            {analysisMetadata.n_anomalies !== undefined && ` (${analysisMetadata.n_anomalies} anomalies)`}
            {analysisMetadata.pipeline_duration_ms && ` in ${(analysisMetadata.pipeline_duration_ms / 1000).toFixed(1)}s`}
            {analysisMetadata.mock && ' — Demo mode (backend offline)'}
          </span>
          <Database size={12} style={{ marginLeft: 'auto' }} />
        </div>
      )}


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
