import React, { useState } from 'react';
import { PageShell } from './components/layout/PageShell.jsx';
import { Landing } from './pages/Landing.jsx';
import { LogInput } from './pages/LogInput.jsx';
import { Results } from './pages/Results.jsx';
import { Remediation } from './pages/Remediation.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Investigation } from './pages/Investigation.jsx';
import { ExposureIntelligence } from './pages/ExposureIntelligence.jsx';
import { Button } from './components/common/Button.jsx';
import { X, FileText, CheckCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [remediationIncident, setRemediationIncident] = useState(null);
  const [reportModal, setReportModal] = useState(false);
  // Real incidents from the ML+Groq pipeline
  const [analysisResult, setAnalysisResult] = useState({ incidents: null, metadata: null });

  const handleStartInvestigation = () => {
    setActiveTab('log-input');
  };

  // Called by LogInput after pipeline completes
  const handleAnalysisComplete = (incidents, metadata) => {
    if (incidents && incidents.length > 0) {
      setAnalysisResult({ incidents, metadata });
      setActiveTab('results'); // Go directly to Results page
    } else {
      setAnalysisResult({ incidents: [], metadata });
      setActiveTab('results');
    }
  };

  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
    setActiveTab('investigation');
  };

  const handleGetRemediation = (incident) => {
    setRemediationIncident(incident);
    setActiveTab('remediation');
  };

  const handleGenerateReport = () => {
    setReportModal(true);
  };

  return (
    <PageShell activeTab={activeTab} onNavigate={(tab) => setActiveTab(tab)}>
      {activeTab === 'landing' && (
        <Landing onStart={handleStartInvestigation} />
      )}

      {activeTab === 'log-input' && (
        <LogInput onAnalysisComplete={handleAnalysisComplete} />
      )}

      {/* NEW: Post-analysis Results page */}
      {activeTab === 'results' && (
        <Results
          incidents={analysisResult.incidents || []}
          metadata={analysisResult.metadata || {}}
          onGetRemediation={handleGetRemediation}
          onBack={() => setActiveTab('log-input')}
        />
      )}

      {/* NEW: Remediation page */}
      {activeTab === 'remediation' && (
        <Remediation
          incident={remediationIncident}
          onBack={() => setActiveTab('results')}
        />
      )}

      {/* Dashboard (for mock/browsing incidents) */}
      {activeTab === 'dashboard' && (
        <Dashboard
          onSelectIncident={handleSelectIncident}
          onGenerateReport={handleGenerateReport}
          realIncidents={analysisResult.incidents}
          analysisMetadata={analysisResult.metadata}
        />
      )}

      {activeTab === 'investigation' && (
        <Investigation
          incident={selectedIncident}
          onBack={() => setActiveTab('dashboard')}
          onGenerateReport={handleGenerateReport}
          allIncidents={analysisResult.incidents}
        />
      )}

      {activeTab === 'exposure' && (
        <ExposureIntelligence />
      )}

      {/* Report Generation Modal Overlay */}
      {reportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-dark)',
            padding: '20px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="var(--accent-orange)" />
                <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Incident Report Compiler
                </h3>
              </div>
              <button
                onClick={() => setReportModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
              The Incident Report Engine formats technical evidence, correlated attack graphs, risk timelines, and recommended mitigation playbooks into a formal PDF report. Export functionality will connect to the FastAPI reporting endpoint in Phase 2.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => setReportModal(false)}>
                Dismiss Notice
              </Button>
              <Button variant="primary" size="sm" icon={CheckCircle} onClick={() => setReportModal(false)}>
                Acknowledge
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
