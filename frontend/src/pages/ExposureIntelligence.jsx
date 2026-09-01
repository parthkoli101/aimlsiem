import React, { useState, useEffect } from 'react';
import { Eye, DollarSign, Info, ShieldAlert, CheckCircle, Database } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { fetchExposureIntelligence } from '../services/api.js';

export function ExposureIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExposureIntelligence().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        Loading exposure intelligence workspace...
      </div>
    );
  }

  const { summary, darkWebLeaks, financialImpactBreakdown, affectedAssets } = data;

  return (
    <div>
      {/* Header Bar */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Exposure & Dark-Web Intelligence Workspace
            </h1>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: '700',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-medium)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)'
            }}>
              MOCK DATASET FOR PROTO
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
            External threat intelligence monitoring, leak discovery records, and financial risk assessment
          </p>
        </div>
      </div>

      {/* Notice Banner */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '16px'
      }}>
        <Info size={14} color="var(--accent-orange)" />
        <span>
          <strong>Operational Notice:</strong> Exposure records below utilize synthetic threat data for evaluation. Live external breach database APIs can be connected in Phase 2.
        </span>
      </div>

      {/* Metrics Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Exposed Records</span>
          <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '2px' }}>
            {summary.totalExposedRecords.toLocaleString()}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>Identified across breach dumps</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Dark Web Mentions</span>
          <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', marginTop: '2px' }}>
            {summary.darkWebMentions} Records
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>4 monitored forums</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Forecasted Financial Impact</span>
          <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--status-critical-text)', marginTop: '2px' }}>
            ${summary.estimatedFinancialRiskUSD.toLocaleString()}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>Estimated remediation cost</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Targeted Threat Actors</span>
          <div style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '6px' }}>
            {summary.criticalThreatActors.join(', ')}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>Active intelligence tracking</span>
        </div>
      </div>

      {/* Grid: Dark Web Leak Records Table & Financial Breakdown Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 480px', gap: '16px' }}>
        {/* Dark Web Intelligence Table */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            <Eye size={15} color="var(--accent-orange)" />
            Observed Leak Records & Mentions
          </h3>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Record Title / Forum</th>
                <th>Exposed Fields</th>
                <th>Records</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {darkWebLeaks.map(leak => (
                <tr key={leak.id}>
                  <td>
                    <strong style={{ fontSize: '12px', display: 'block' }}>{leak.title}</strong>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                      {leak.forumName} • Detected: {leak.dateDetected}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {leak.sampleExposedFields.join(', ')}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                    {leak.recordsCount}
                  </td>
                  <td>
                    <RiskBadge severity={leak.severity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Risk Assessment Table */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            <DollarSign size={15} color="var(--accent-orange)" />
            Financial & Business Risk Model
          </h3>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Impact Category</th>
                <th>Details</th>
                <th style={{ textAlign: 'right' }}>Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {financialImpactBreakdown.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600' }}>{item.category}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{item.details}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                    ${item.estimatedCostUSD.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
