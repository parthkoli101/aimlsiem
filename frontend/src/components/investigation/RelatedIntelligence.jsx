import React from 'react';
import { Database } from 'lucide-react';
import { MOCK_EXPOSURE_INTELLIGENCE } from '../../mock/intelligence.js';

export function RelatedIntelligence() {
  const cases = MOCK_EXPOSURE_INTELLIGENCE.historicalSimilarAttacks || [];

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-md)',
      padding: '16px'
    }}>
      <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        <Database size={15} color="var(--accent-orange)" />
        Historical & Vector Similarity Matches
      </h3>
      <p style={{ fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '12px' }}>
        Correlated attack patterns matched against historical threat KB
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {cases.map((c, idx) => (
          <div key={idx} style={{
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px',
            backgroundColor: 'var(--bg-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)' }}>
                {c.caseId}
              </span>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                padding: '1px 5px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-orange-light)',
                color: 'var(--accent-orange)',
                border: '1px solid var(--status-high-border)'
              }}>
                Match: {c.similarityScore}
              </span>
            </div>

            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '2px' }}>
              {c.attackPattern}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              <strong>Vector:</strong> {c.vector}<br />
              <strong>Outcome:</strong> {c.outcome}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
