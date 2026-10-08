import React, { useState } from 'react';
import type { TimelineEvent, Alert } from '../types';

interface Props {
  timeline: TimelineEvent[];
  alerts: Alert[];
  onSelectFire: (id: string) => void;
  onAcknowledgeAlert?: (id: string) => void;
}

export const TimelineAndAlerts: React.FC<Props> = ({
  timeline,
  alerts,
  onSelectFire,
  onAcknowledgeAlert,
}) => {
  const [expanded, setExpanded] = useState(true);
  const unacknowledged = alerts.filter(a => !a.acknowledged);

  const auditPipeline = [
    { step: 1, label: 'Fire Detected', desc: 'Satellite thermal anomaly' },
    { step: 2, label: 'Incident Verified', desc: 'Confidence validation' },
    { step: 3, label: 'Risk Calculated', desc: 'Composite fire risk' },
    { step: 4, label: 'Severity Classified', desc: 'Critical / High / Moderate' },
    { step: 5, label: 'Spread Estimated', desc: '+15m / +30m zone models' },
    { step: 6, label: 'Resource Recommended', desc: 'Optimal fleet match' },
    { step: 7, label: 'Human Authorization', desc: 'Operator decision' },
    { step: 8, label: 'Unit Dispatched', desc: 'Wildland Engine / Crew en route' },
    { step: 9, label: 'Response Monitored', desc: 'ETA & telemetry' },
  ];

  return (
    <div style={{
      background: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      zIndex: 1000,
    }}>
      {/* Drawer Header Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 16px',
          background: '#fafbfc',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid #e2e8f0' : 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Event Timeline & Wildfire Audit Trail
          </span>

          {unacknowledged.length > 0 ? (
            <span className="badge badge-critical font-mono-num" style={{ fontSize: 10 }}>
              {unacknowledged.length} Active Wildfire Alert
            </span>
          ) : (
            <span className="badge badge-verified" style={{ fontSize: 10 }}>
              Wildfire Audit Normal
            </span>
          )}

          {/* Inline pipeline summary when collapsed */}
          {!expanded && (
            <span style={{ fontSize: 10.5, color: '#64748b' }}>
              Workflow: Fire Detected → Verified → Risk Assessed → Resource Matched → Human Authorized → Dispatched
            </span>
          )}
        </div>

        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
          {expanded ? '▲ Hide Timeline' : '▼ View Timeline & Audit'}
        </div>
      </div>

      {/* Drawer Body */}
      {expanded && (
        <div style={{
          height: '115px',
          display: 'flex',
          overflow: 'hidden',
          background: '#ffffff',
        }}>
          {/* Active Alerts Column */}
          {unacknowledged.length > 0 && (
            <div style={{
              width: '270px',
              borderRight: '1px solid #e2e8f0',
              padding: '8px 12px',
              overflowY: 'auto',
              background: '#fef2f2',
              flexShrink: 0,
            }}>
              {unacknowledged.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    borderRadius: 4,
                    padding: '6px 8px',
                    marginBottom: 4,
                    fontSize: 11,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <strong style={{ color: '#dc2626' }}>{alert.title}</strong>
                    <span className="font-mono-num" style={{ color: '#2563eb', fontWeight: 700 }}>{alert.fire_id}</span>
                  </div>
                  <div style={{ color: '#475569', fontSize: 10, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {alert.location}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 10 }}>
                      Rec: {alert.recommended_unit} ({alert.eta_minutes}m ETA)
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFire(alert.fire_id);
                        if (onAcknowledgeAlert) onAcknowledgeAlert(alert.id);
                      }}
                      className="btn-tactical btn-primary"
                      style={{ height: 20, padding: '0 6px', fontSize: 10 }}
                    >
                      Focus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Standard Operational Fire Audit Trail Workflow Pipeline */}
          <div style={{
            width: '280px',
            borderRight: '1px solid #e2e8f0',
            padding: '8px 12px',
            background: '#fafbfc',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontSize: 10,
            overflowY: 'auto',
          }}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4, textTransform: 'uppercase', fontSize: 9.5 }}>
              Decision-Support Audit Flow
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 5px', fontSize: 9.5, color: '#475569', lineHeight: 1.4 }}>
              {auditPipeline.map((p, i) => (
                <span key={p.step} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontWeight: p.step === 7 ? 800 : 600, color: p.step === 7 ? '#2563eb' : '#334155' }}>
                    {p.step}. {p.label}
                  </span>
                  {i < auditPipeline.length - 1 && <span style={{ color: '#94a3b8' }}>↓</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Chronological Audit Event Stream */}
          <div style={{
            flex: 1,
            overflowX: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 14px',
            whiteSpace: 'nowrap',
          }}>
            {timeline.slice().reverse().map((ev, idx) => (
              <div
                key={idx}
                onClick={() => ev.fire_id && onSelectFire(ev.fire_id)}
                style={{
                  minWidth: '210px',
                  maxWidth: '260px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 5,
                  padding: '7px 9px',
                  fontSize: 11,
                  cursor: ev.fire_id ? 'pointer' : 'default',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span className="font-mono-num" style={{ color: '#2563eb', fontWeight: 700, fontSize: 11 }}>
                    {ev.time}
                  </span>
                  {ev.fire_id && (
                    <span className="badge badge-neutral font-mono-num" style={{ fontSize: 9 }}>
                      {ev.fire_id}
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 11, marginBottom: 2 }}>
                  {ev.event}
                </div>
                <div style={{ color: '#64748b', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ev.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
