import React, { useState } from 'react';
import { X, Send, Lock, FileText, User, ShieldAlert } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge.jsx';
import { Button } from '../common/Button.jsx';
import { sendManagerChatMessage } from '../../services/api.js';

export function ManagerChat({ incident, onClose }) {
  if (!incident) return null;

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Executive Briefing for Incident [${incident.id}]: An attacker leveraged ${incident.attackType} against target asset ${incident.affectedEntity} (user: ${incident.user}). Primary risk factor: ${incident.evidenceSummary} Recommended action: ${incident.recommendedResponse}`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendManagerChatMessage(incident.id, userText);
      setMessages(prev => [...prev, { sender: 'ai', text: response.message }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Error generating executive summary response.' }]);
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: '680px',
        height: '560px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-dark)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        {/* Header - Incident Context Banner */}
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
              <Lock size={13} color="var(--accent-orange)" />
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--accent-orange)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                CONTEXT-LOCKED EXECUTIVE ASSISTANT
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <RiskBadge severity={incident.severity} score={incident.riskScore} />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>{incident.id}</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{incident.title}</strong>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Structured Context Metadata */}
        <div style={{
          padding: '6px 16px',
          backgroundColor: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-light)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          gap: '12px',
          fontFamily: 'var(--font-mono)'
        }}>
          <span>Target: {incident.affectedEntity}</span>
          <span>User: {incident.user}</span>
          <span>Confidence: {incident.confidence}</span>
        </div>

        {/* Message Area */}
        <div style={{
          flex: 1,
          padding: '14px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                backgroundColor: msg.sender === 'user' ? 'var(--accent-orange)' : 'var(--bg-subtle)',
                color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-main)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                lineHeight: '1.45',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border-light)',
                fontFamily: msg.sender === 'user' ? 'var(--font-sans)' : 'inherit'
              }}
            >
              {msg.sender === 'ai' && (
                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)', marginBottom: '4px' }}>
                  Incident Executive Brief
                </div>
              )}
              {msg.text}
            </div>
          ))}
          {loading && (
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>
              Formulating executive summary for incident {incident.id}...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-medium)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          gap: '6px'
        }}>
          <input
            type="text"
            placeholder="Ask executive/manager questions regarding this incident case..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              fontSize: '12px',
              outline: 'none',
              backgroundColor: 'var(--bg-subtle)'
            }}
          />
          <Button type="submit" variant="primary" size="sm" icon={Send} disabled={loading}>
            Query Brief
          </Button>
        </form>
      </div>
    </div>
  );
}
