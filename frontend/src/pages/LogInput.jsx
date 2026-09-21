import React, { useState } from 'react';
import {
  Upload, FileText, CheckCircle, AlertCircle,
  ArrowRight, Activity, Shield, Cpu, Search, Zap, Play
} from 'lucide-react';
import { Button } from '../components/common/Button.jsx';
import { uploadLogFile } from '../services/api.js';

const PIPELINE_STEPS = [
  { icon: FileText, label: 'Parsing & Normalizing Logs', detail: 'Multi-schema JSON ingestion & rule-engine flags' },
  { icon: Activity, label: 'Isolation Forest Anomaly Scan', detail: 'Unsupervised ML anomaly scoring' },
  { icon: Cpu, label: 'LightGBM Classification', detail: 'Attack category + SHAP evidence' },
  { icon: Shield, label: 'Threat Correlation', detail: 'Grouping events into incidents' },
  { icon: Search, label: 'Semantic Memory Search', detail: 'FAISS similarity against historical attack patterns' },
  { icon: Zap, label: 'Groq LLM Validation', detail: 'AI analysis, one-liners & mitigation generation' },
];

export function LogInput({ onAnalysisComplete }) {
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusMsg(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith('.json')) {
      setFile(dropped);
      setStatusMsg(null);
    }
  };

  const simulatePipelineProgress = async (totalMs) => {
    const stepDelay = totalMs / PIPELINE_STEPS.length;
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setPipelineStep(i);
      await new Promise(r => setTimeout(r, stepDelay));
    }
  };

  const executePipeline = async (fileToUpload) => {
    if (!fileToUpload) return;
    setLoading(true);
    setStatusMsg(null);
    setPipelineStep(0);

    const progressPromise = simulatePipelineProgress(3500);

    try {
      const [res] = await Promise.all([uploadLogFile(fileToUpload), progressPromise]);
      setPipelineStep(PIPELINE_STEPS.length);

      if (res.success) {
        setStatusMsg({ type: 'success', text: res.message });
        setTimeout(() => onAnalysisComplete(res.incidents, res.metadata), 600);
      } else {
        setStatusMsg({ type: 'error', text: res.message || 'Pipeline failed.' });
        setPipelineStep(-1);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to process JSON log file.' });
      setPipelineStep(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = () => {
    executePipeline(file);
  };

  const isRunning = loading && pipelineStep >= 0;
  const isDone = !loading && pipelineStep === PIPELINE_STEPS.length;

  return (
    <div style={{ maxWidth: '820px', margin: '24px auto' }}>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '6px' }}>
          DarkShieldAI — Log Ingestion Workspace
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Upload security telemetry JSON logs to run the parallel ML + Groq threat detection pipeline
        </p>
      </div>

      {statusMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: statusMsg.type === 'success' ? 'var(--status-low-bg)' : 'var(--status-critical-bg)',
          color: statusMsg.type === 'success' ? 'var(--status-low-text)' : 'var(--status-critical-text)',
          border: `1px solid ${statusMsg.type === 'success' ? 'var(--status-low-border)' : 'var(--status-critical-border)'}`
        }}>
          {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main File Upload Box */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="var(--accent-orange)" />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Upload Security Log File
            </h2>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
            Supports JSON Array & NDJSON (up to 50MB)
          </span>
        </div>

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '36px 20px',
            border: `2px dashed ${file ? 'var(--accent-orange)' : 'var(--border-medium)'}`,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            backgroundColor: file ? 'rgba(234, 88, 12, 0.04)' : 'var(--bg-subtle)',
            marginBottom: '20px',
            transition: 'all 0.2s ease',
          }}
        >
          <FileText size={32} color={file ? 'var(--accent-orange)' : 'var(--text-subtle)'} style={{ marginBottom: '10px' }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
            {file ? file.name : 'Click to select JSON log file or drag & drop here'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {file ? `${(file.size / 1024).toFixed(1)} KB selected` : 'Windows Event Logs, Sysmon, EDR, Network Firewall Telemetry'}
          </span>
          <input type="file" accept=".json,application/json" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>

        {file && (
          <div style={{ marginBottom: '20px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <table className="soc-table">
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600', width: '150px' }}>Selected File:</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{file.name}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>File Size:</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{(file.size / 1024).toFixed(1)} KB</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Detection Engine:</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    Parallel: Isolation Forest + LightGBM + FAISS + Groq LLM (35s Race)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Pipeline Execution Animation */}
        {(isRunning || isDone) && (
          <div style={{
            marginBottom: '20px',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            backgroundColor: 'var(--bg-subtle)',
          }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pipeline Execution Status
            </p>
            {PIPELINE_STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = pipelineStep > i || isDone;
              const active = pipelineStep === i && isRunning;
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '7px 0',
                  borderBottom: i < PIPELINE_STEPS.length - 1 ? '1px solid var(--border-light)' : 'none',
                  opacity: pipelineStep < i && !isDone ? 0.4 : 1,
                  transition: 'opacity 0.3s',
                }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: done ? 'var(--status-low-bg)' : active ? 'rgba(234,88,12,0.1)' : 'var(--bg-tertiary)',
                    border: `1px solid ${done ? 'var(--status-low-border)' : active ? 'var(--accent-orange)' : 'var(--border-light)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {done
                      ? <CheckCircle size={13} color="var(--status-low-text)" />
                      : <Icon size={12} color={active ? 'var(--accent-orange)' : 'var(--text-subtle)'} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: done ? 'var(--text-main)' : active ? 'var(--accent-orange)' : 'var(--text-subtle)' }}>
                      {step.label}
                      {active && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--accent-orange)' }}>Running...</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                      {step.detail}
                    </div>
                  </div>
                  {done && (
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--status-low-text)', fontWeight: '700' }}>DONE</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button
            variant="primary"
            size="md"
            icon={ArrowRight}
            onClick={handleFileUpload}
            disabled={!file || loading}
          >
            {loading ? 'Analyzing Threat Telemetry...' : 'Ingest & Analyze Telemetry'}
          </Button>
        </div>
      </div>
    </div>
  );
}
