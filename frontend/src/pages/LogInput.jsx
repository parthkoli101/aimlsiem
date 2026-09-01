import React, { useState } from 'react';
import { Upload, Link as LinkIcon, FileText, CheckCircle, AlertCircle, ArrowRight, Database, Server, Info } from 'lucide-react';
import { Button } from '../components/common/Button.jsx';
import { uploadLogFile, ingestLogUrl } from '../services/api.js';

export function LogInput({ onAnalysisComplete }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await uploadLogFile(file);
      setStatusMsg({ type: 'success', text: res.message });
      setTimeout(() => onAnalysisComplete(), 600);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to process JSON log file.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await ingestLogUrl(url);
      setStatusMsg({ type: 'success', text: res.message });
      setTimeout(() => onAnalysisComplete(), 600);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to connect to log URL stream.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '16px auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Security Log Ingestion Workspace
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
          Step 1: Ingest standardized JSON security telemetry into the correlation pipeline
        </p>
      </div>

      {statusMsg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: statusMsg.type === 'success' ? 'var(--status-low-bg)' : 'var(--status-critical-bg)',
          color: statusMsg.type === 'success' ? 'var(--status-low-text)' : 'var(--status-critical-text)',
          border: `1px solid ${statusMsg.type === 'success' ? 'var(--status-low-border)' : 'var(--status-critical-border)'}`
        }}>
          {statusMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {statusMsg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px' }}>
        {/* Primary Option: JSON File Upload */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Upload size={16} color="var(--accent-orange)" />
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
              PRIMARY: Upload JSON Log File
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Upload raw or pre-filtered JSON log exports (Windows Event Logs, Sysmon, EDR, Network Firewall telemetry).
          </p>

          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justify: 'center',
            padding: '24px',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            backgroundColor: 'var(--bg-subtle)',
            marginBottom: '16px'
          }}>
            <FileText size={22} color="var(--text-subtle)" style={{ marginBottom: '6px' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
              {file ? file.name : 'Select JSON log file or drag file here'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              Supports JSON array / NDJSON formats up to 50MB
            </span>
            <input type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>

          {/* Structured File Metadata Table if file selected */}
          {file && (
            <div style={{ marginBottom: '16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <table className="soc-table">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '600', width: '140px' }}>Filename:</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{file.name}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>File Size:</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{(file.size / 1024).toFixed(1)} KB</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Estimated Events:</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>42 Correlated Records</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Detected Schema:</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Windows Security Audit / Sysmon EVTX-JSON</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={handleFileUpload}
              disabled={!file || loading}
            >
              {loading ? 'Ingesting File...' : 'Ingest & Begin Investigation'}
            </Button>
          </div>
        </div>

        {/* Secondary Option: URL Stream Source */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <LinkIcon size={14} color="var(--text-subtle)" />
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                SECONDARY: Live Stream Endpoint
              </h3>
            </div>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '1px 5px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-subtle)',
              display: 'inline-block',
              marginBottom: '10px'
            }}>
              FUTURE API CONNECTOR
            </span>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
              Connect to an external HTTP/HTTPS URL supplying live JSON log streams.
            </p>

            <form onSubmit={handleUrlSubmit}>
              <input
                type="url"
                placeholder="https://api.corp.internal/logs/stream"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '10px',
                  outline: 'none',
                  backgroundColor: 'var(--bg-subtle)'
                }}
              />
              <Button
                variant="outline"
                size="sm"
                icon={ArrowRight}
                onClick={handleUrlSubmit}
                disabled={!url || loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Connecting...' : 'Connect Stream'}
              </Button>
            </form>
          </div>

          {/* Guidelines Box */}
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            fontSize: '11px',
            color: 'var(--text-subtle)',
            lineHeight: '1.5'
          }}>
            <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              Log Schema Guidelines:
            </strong>
            Supports standard Sysmon (Event ID 1, 3, 10), Windows Event ID (4624, 4688, 4769), and Network Firewall TCP/UDP JSON structures.
          </div>
        </div>
      </div>
    </div>
  );
}
