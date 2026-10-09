import React from 'react';
import type { FireHotspot } from '../types';

interface Props {
  fires: FireHotspot[];
  selectedFireId: string | null;
  onSelectFire: (id: string) => void;
  sortBy: 'risk' | 'population' | 'spread_risk' | 'eta';
  onSortChange: (sort: 'risk' | 'population' | 'spread_risk' | 'eta') => void;
}

export const IncidentList: React.FC<Props> = ({
  fires,
  selectedFireId,
  onSelectFire,
  sortBy,
  onSortChange,
}) => {
  const sorted = [...fires].sort((a, b) => {
    if (sortBy === 'risk') return b.risk_score - a.risk_score;
    if (sortBy === 'population') return b.population_at_risk - a.population_at_risk;
    if (sortBy === 'spread_risk') {
      const order = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (order[b.spread_risk as keyof typeof order] || 0) - (order[a.spread_risk as keyof typeof order] || 0);
    }
    if (sortBy === 'eta') {
      const ae = a.eta_minutes ?? 999;
      const be = b.eta_minutes ?? 999;
      return ae - be;
    }
    return 0;
  });

  const criticalCount = fires.filter(f => f.severity === 'CRITICAL' && f.status === 'ACTIVE').length;
  const highCount = fires.filter(f => f.severity === 'HIGH' && f.status === 'ACTIVE').length;
  const activeCount = fires.filter(f => f.status === 'ACTIVE').length;

  const formatSeverity = (sev: string) => {
    if (sev === 'CRITICAL') return 'Critical';
    if (sev === 'HIGH') return 'High';
    if (sev === 'MEDIUM') return 'Moderate';
    return sev.charAt(0) + sev.slice(1).toLowerCase();
  };

  const formatSpread = (spread: string) => {
    if (spread === 'HIGH') return 'Fast Spread';
    if (spread === 'MEDIUM') return 'Moderate Spread';
    return 'Low Spread';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>
      {/* Incident Queue Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
        {/* Simulation Disclaimer Ribbon */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4,
          padding: '3px 8px', marginBottom: 8, fontSize: 9.5, color: '#475569', fontWeight: 600
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            SIMULATED FOREST FIRE SCENARIOS
          </span>
          <span style={{ color: '#94a3b8' }}>Demo Data</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Forest Fire Queue
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
              background: '#e2e8f0', color: '#1e293b'
            }}>
              {activeCount}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            <span className="badge badge-critical font-mono-num" style={{ fontSize: 9.5 }}>{criticalCount} Critical</span>
            <span className="badge badge-warning font-mono-num" style={{ fontSize: 9.5 }}>{highCount} High</span>
          </div>
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600, marginRight: 2 }}>Sort:</span>
          {(['risk', 'population', 'spread_risk', 'eta'] as const).map(key => {
            const labels: Record<string, string> = {
              risk: 'Fire Risk',
              population: 'Village Pop',
              spread_risk: 'Spread Risk',
              eta: 'ETA',
            };
            const active = sortBy === key;
            return (
              <button
                key={key}
                onClick={() => onSortChange(key)}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: active ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  background: active ? '#eff6ff' : '#ffffff',
                  color: active ? '#2563eb' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
              >
                {labels[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Incident List Rows */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {sorted.map(fire => {
          const isSelected = fire.id === selectedFireId;
          const isCritical = fire.severity === 'CRITICAL';
          const isHigh = fire.severity === 'HIGH';
          const isModerate = fire.severity === 'MEDIUM';

          return (
            <div
              key={fire.id}
              onClick={() => onSelectFire(fire.id)}
              style={{
                padding: '11px 12px',
                marginBottom: 8,
                borderRadius: 6,
                cursor: 'pointer',
                border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                background: isSelected ? '#f8fafc' : '#ffffff',
                boxShadow: isSelected ? '0 1px 4px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.02)',
                transition: 'all 0.1s ease',
              }}
            >
              {/* Row 1: ID, Status, Severity Badge, Spread indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="font-mono-num" style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    {fire.id}
                  </span>
                  <span style={{
                    fontSize: 8.5, fontWeight: 700, padding: '0 4px', borderRadius: 2,
                    background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0'
                  }}>
                    SIMULATED
                  </span>
                  {fire.status === 'ACTIVE' ? (
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: isCritical ? '#dc2626' : isHigh ? '#ea580c' : '#eab308',
                      display: 'inline-block'
                    }} title="Active Wildfire Incident" />
                  ) : (
                    <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>[MONITORED]</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    className={fire.spread_risk === 'HIGH' ? 'badge badge-warning' : 'badge badge-neutral'}
                    style={{ fontSize: 8.5, padding: '1px 4px' }}
                  >
                    {formatSpread(fire.spread_risk)}
                  </span>
                  <span
                    className={
                      isCritical
                        ? 'badge badge-critical'
                        : isHigh
                        ? 'badge badge-warning'
                        : isModerate
                        ? 'badge badge-warning'
                        : 'badge badge-neutral'
                    }
                    style={{
                      fontSize: 8.5,
                      padding: '1px 4px',
                      background: isModerate ? '#fef9c3' : undefined,
                      borderColor: isModerate ? '#fde047' : undefined,
                      color: isModerate ? '#a16207' : undefined,
                    }}
                  >
                    {formatSeverity(fire.severity)}
                  </span>
                </div>
              </div>

              {/* Row 2: Forest Name & Division */}
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {fire.area_name}
              </div>

              {/* Row 3: Forest Ecosystem Exposure */}
              <div style={{
                fontSize: 10,
                color: '#64748b',
                marginBottom: 6,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                🌲 {fire.ecosystem_zone || fire.fuel_type || 'Forest Division Buffer'}
              </div>

              {/* Row 4: Detection status & Response unit */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 10,
                color: '#475569',
                marginBottom: 6,
                background: '#f8fafc',
                padding: '3px 6px',
                borderRadius: 4,
                border: '1px solid #f1f5f9',
              }}>
                <span title="Sensor Verification Status">
                  🛰️ <strong className="font-mono-num">{fire.verification_score || fire.confidence}%</strong> Conf ({fire.satellite})
                </span>
                <span>
                  🚒 <strong style={{ color: fire.assigned_unit ? '#2563eb' : '#64748b' }}>
                    {fire.assigned_unit ? `${fire.assigned_unit} Unit` : 'Unit Standby'}
                  </strong>
                </span>
              </div>

              {/* Row 5: Operational Telemetry Bar (Risk, Villages pop, ETA) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 4,
                fontSize: 10,
                paddingTop: 5,
                borderTop: '1px solid #f1f5f9',
                color: '#64748b',
              }}>
                <div>
                  Risk <strong className="font-mono-num" style={{ color: isCritical ? '#dc2626' : '#d97706', fontWeight: 800 }}>
                    {fire.risk_score.toFixed(0)}
                  </strong>
                  <span style={{ fontSize: 8.5, color: '#94a3b8' }}>/100</span>
                </div>

                <div>
                  Villages <strong className="font-mono-num" style={{ color: '#0f172a', fontWeight: 700 }}>
                    {fire.population_at_risk.toLocaleString()}
                  </strong>
                </div>

                <div style={{ textAlign: 'right' }}>
                  ETA <strong className="font-mono-num" style={{ color: fire.eta_minutes ? '#2563eb' : '#64748b', fontWeight: 700 }}>
                    {fire.eta_minutes ? `${fire.eta_minutes.toFixed(1)}m` : '—'}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}

        {fires.length === 0 && (
          <div style={{ textAlign: 'center', color: '#64748b', padding: 32, fontSize: 12 }}>
            No active forest fire incidents detected.
          </div>
        )}
      </div>
    </div>
  );
};
