import React, { useState } from 'react';
import type { IncidentIntelligence } from '../types';
import { authorizeDispatch } from '../services/api';

interface Props {
  intelligence: IncidentIntelligence | null;
  loading: boolean;
  onRefresh: () => void;
  onOpenWhatIf: () => void;
}

export const IncidentIntelligencePanel: React.FC<Props> = ({
  intelligence,
  loading,
  onRefresh,
  onOpenWhatIf,
}) => {
  const [authorized, setAuthorized] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
        Loading fire incident intelligence...
      </div>
    );
  }

  if (!intelligence) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
        Select a fire incident from the left panel to view intelligence.
      </div>
    );
  }

  const { fire, verification, risk, spread, allocation, road_blocked, suitable_resources = [] } = intelligence;

  const handleToggleAuthorization = async () => {
    if (!authorized) {
      setAuthorizing(true);
      try {
        await authorizeDispatch();
        setAuthorized(true);
      } catch (err) {
        console.error('Failed to log authorization:', err);
        setAuthorized(true);
      } finally {
        setAuthorizing(false);
      }
    } else {
      setAuthorized(false);
    }
  };

  // Structured Risk Factor Breakdown
  const riskFactors = [
    { label: 'Thermal Anomaly (FRP)', value: `${fire.frp} MW`, score: Math.min(100, (fire.frp / 80) * 100), color: '#dc2626' },
    { label: 'Settlement Exposure', value: `${fire.population_at_risk.toLocaleString()} residents in hamlets`, score: Math.min(100, (fire.population_at_risk / 1500) * 100), color: '#ea580c' },
    { label: 'Estimated Forest Area at Risk', value: `${fire.estimated_forest_area_ha || 350} hectares`, score: Math.min(100, ((fire.estimated_forest_area_ha || 350) / 500) * 100), color: '#d97706' },
    { label: 'Spread Risk & Wind Vector', value: `${fire.spread_risk} (${fire.wind_speed} km/h @ ${fire.wind_direction}°)`, score: fire.spread_risk === 'HIGH' ? 85 : 50, color: '#d97706' },
    { label: 'Terrain & Track Accessibility', value: allocation ? `${allocation.eta_minutes.toFixed(1)}m ETA via ${road_blocked ? 'Perimeter Firebreak' : 'Ridge Trail'}` : '15.0m ETA', score: road_blocked ? 85 : 65, color: '#2563eb' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: '#ffffff' }}>
      {/* Panel Top Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
        {/* Simulation Notice Banner */}
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4,
          padding: '4px 8px', marginBottom: 8, fontSize: 9.5, color: '#1e40af', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span>⚠️ SIMULATED INCIDENT TELEMETRY</span>
          <span style={{ fontSize: 9, color: '#64748b' }}>Decision-Support Scenario</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-mono-num" style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
              {fire.id}
            </span>
            <span className={fire.severity === 'CRITICAL' ? 'badge badge-critical' : 'badge badge-warning'}>
              {fire.severity === 'MEDIUM' ? 'MODERATE' : fire.severity}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={onRefresh}
              className="btn-tactical"
              style={{ height: 26, padding: '0 8px', fontSize: 11 }}
              title="Sync incident data"
            >
              Sync
            </button>
            <button
              onClick={onOpenWhatIf}
              className="btn-tactical"
              style={{ height: 26, padding: '0 8px', fontSize: 11, borderColor: '#d97706', color: '#b45309', background: '#fef3c7' }}
              title="Launch What-If Fire Simulator"
            >
              What-If Simulator
            </button>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
          {fire.area_name}
        </div>
        <div className="font-mono-num" style={{ fontSize: 11, color: '#64748b' }}>
          {fire.latitude.toFixed(4)}°N, {fire.longitude.toFixed(4)}°E • Simulated Sensor: {fire.satellite} ({fire.instrument})
        </div>
      </div>

      {/* Decision Intelligence Stack */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        
        {/* Section 1: Verification & Sensor Telemetry */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6,
          padding: '10px 12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Thermal Sensor Telemetry (Simulated)
            </span>
            <span className="badge badge-verified font-mono-num" style={{ fontSize: 11 }}>
              {verification?.score ? `${verification.score.toFixed(0)}% Confidence` : `${fire.confidence}%`}
            </span>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
            {verification?.label || 'Verified Satellite Forest Thermal Hotspot'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: '#475569' }}>
            <div>Thermal Anomaly: <strong className="font-mono-num" style={{ color: '#dc2626' }}>{fire.frp} MW</strong></div>
            <div>Brightness Temp: <strong className="font-mono-num">{fire.brightness || 344} K</strong></div>
            <div>Vegetation / Fuel: <strong style={{ color: '#0f172a' }}>{fire.fuel_type || 'Dry Deciduous Leaf Duff'}</strong></div>
            <div>Terrain Access: <strong style={{ color: '#0f172a' }}>{fire.terrain_type || 'Forest Ridge Track'}</strong></div>
            <div>Ecosystem Zone: <strong style={{ color: '#b45309' }}>{fire.ecosystem_zone || 'Wildlife Buffer'}</strong></div>
            <div>Wind Vector: <strong className="font-mono-num" style={{ color: '#0f172a' }}>{fire.wind_speed} km/h @ {fire.wind_direction}°</strong></div>
            <div>Exposed Forest: <strong className="font-mono-num" style={{ color: '#15803d' }}>~{fire.estimated_forest_area_ha || 350} ha</strong></div>
            <div>Relative Humidity: <strong className="font-mono-num">{fire.humidity}% ({fire.temperature}°C)</strong></div>
          </div>
        </div>

        {/* Section 2: Composite Fire Risk Score & Factor Breakdown */}
        <div style={{
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6,
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Forest Fire Risk Assessment
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                <span className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#dc2626' }}>
                  {risk?.total?.toFixed(0) || fire.risk_score}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>/ 100</span>
                <span className="badge badge-critical" style={{ marginLeft: 6, fontSize: 10 }}>
                  {fire.severity} SEVERITY
                </span>
              </div>
            </div>
          </div>

          {/* Simple Clean Horizontal Progress Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 6 }}>
            {riskFactors.map(factor => (
              <div key={factor.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#475569', fontWeight: 500 }}>{factor.label}</span>
                  <span className="font-mono-num" style={{ color: '#0f172a', fontWeight: 600 }}>{factor.value}</span>
                </div>
                <div style={{ width: '100%', height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${factor.score}%`, height: '100%', background: factor.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 & 4: Estimated Fire Spread-Risk Zone & Spread Analysis */}
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6,
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Estimated Wildfire Spread-Risk Envelope
            </span>
            <span className="badge badge-warning" style={{ fontSize: 10 }}>
              {spread?.spread_risk || fire.spread_risk} SPREAD RISK
            </span>
          </div>

          <div style={{ fontSize: 11, color: '#78350f', lineHeight: 1.4, marginBottom: 8 }}>
            Simulated spread risk driven by <strong>{fire.wind_speed} km/h</strong> wind vector ({fire.wind_direction}°), fuel type (<strong>{fire.fuel_type || fire.land_cover}</strong>), and <strong>{fire.frp} MW</strong> thermal intensity.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, textAlign: 'center', marginBottom: 6 }}>
            {spread?.zones?.map(zone => (
              <div key={zone.time_label} style={{ background: '#ffffff', padding: '6px 4px', borderRadius: 4, border: '1px solid #fde68a' }}>
                <div style={{ color: '#b45309', fontWeight: 700, fontSize: 10 }}>{zone.time_label}</div>
                <div className="font-mono-num" style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                  {zone.radius_km.toFixed(1)} km
                </div>
                <div style={{ color: '#78350f', fontSize: 9 }}>estimated buffer</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 9.5, color: '#92400e', fontStyle: 'italic', marginTop: 4 }}>
            * Operational decision-support estimate based on heuristic atmospheric inputs; not a scientifically validated live propagation forecast.
          </div>
        </div>

        {/* Section 5: Smart Fire Resource Allocation */}
        <div style={{
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6,
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Suitable Available Firefighting Resources
            </div>
            <span style={{ fontSize: 10, color: '#64748b' }}>
              {suitable_resources.length > 0 ? `${suitable_resources.filter(r => r.availability === 'AVAILABLE').length} Available` : 'Evaluated'}
            </span>
          </div>

          {/* Suitable units candidate list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto', marginBottom: 12 }}>
            {(suitable_resources.length > 0 ? suitable_resources.slice(0, 5) : [
              { id: 'WF-10', name: 'Wildland Fire Engine', type: 'Wildland Fire Engine', station_name: 'Aravalli Range Forest Post', availability: 'AVAILABLE', distance_km: 2.1, eta_minutes: 6.5, capability_match: 'Optimal Match' },
              { id: 'WT-04', name: 'Forest Water Bowser', type: 'Forest Water Bowser', station_name: 'Aravalli Range Forest Post', availability: 'AVAILABLE', distance_km: 3.4, eta_minutes: 10.2, capability_match: 'Suitable Match' },
              { id: 'FP-02', name: 'Forest Patrol QRT', type: 'Forest Patrol QRT', station_name: 'Aravalli Range Forest Post', availability: 'AVAILABLE', distance_km: 1.8, eta_minutes: 4.8, capability_match: 'Optimal Match' },
              { id: 'WF-21', name: 'Wildland Fire Engine', type: 'Wildland Fire Engine', station_name: 'Sariska Division Forest Station', availability: 'AVAILABLE', distance_km: 72.5, eta_minutes: 75.0, capability_match: 'Secondary Match' },
            ]).map(unit => {
              const isBest = unit.id === (allocation?.recommended_unit || 'WF-10');
              const isStandby = unit.id === (allocation?.fallback_unit || 'WT-04');
              return (
                <div
                  key={unit.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 8px', borderRadius: 4,
                    background: isBest ? '#eff6ff' : isStandby ? '#fffbeb' : '#f8fafc',
                    border: isBest ? '1px solid #bfdbfe' : isStandby ? '1px solid #fde68a' : '1px solid #e2e8f0',
                    fontSize: 11,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <strong className="font-mono-num" style={{ color: isBest ? '#1d4ed8' : '#0f172a' }}>{unit.id}</strong>
                      <span style={{ color: '#334155', fontWeight: 600 }}>{unit.type}</span>
                      {isBest && <span className="badge badge-info" style={{ fontSize: 8.5, padding: '0 4px' }}>Recommended</span>}
                      {isStandby && <span className="badge badge-warning" style={{ fontSize: 8.5, padding: '0 4px' }}>Standby</span>}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>
                      {unit.station_name} • {unit.capability_match}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono-num" style={{ fontWeight: 700, color: isBest ? '#16a34a' : '#0f172a' }}>
                      {unit.eta_minutes.toFixed(1)}m ETA
                    </div>
                    <div className="font-mono-num" style={{ fontSize: 10, color: '#64748b' }}>
                      {unit.distance_km.toFixed(1)} km
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section 5: KEY DISPATCH RECOMMENDATION */}
          <div style={{
            background: '#eff6ff', border: '1.5px solid #3b82f6', borderRadius: 6,
            padding: '12px', position: 'relative'
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#1d4ed8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
              Key Dispatch Recommendation
            </div>

            {allocation ? (
              <div>
                {/* Unit Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="font-mono-num" style={{ fontSize: 20, fontWeight: 900, color: '#1e40af' }}>
                        {allocation.recommended_unit}
                      </span>
                      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>
                        {allocation.unit_name}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                      Station: <strong>{allocation.station_name}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono-num" style={{ fontSize: 20, fontWeight: 900, color: '#16a34a' }}>
                      {allocation.eta_minutes.toFixed(1)}m
                    </div>
                    <div className="font-mono-num" style={{ fontSize: 11, color: '#64748b' }}>
                      Distance {allocation.distance_km.toFixed(1)} km
                    </div>
                  </div>
                </div>

                {/* Road blocked detour notice */}
                {road_blocked && (
                  <div style={{
                    background: '#fee2e2', border: '1px solid #fca5a5',
                    borderRadius: 4, padding: '6px 8px', marginBottom: 8, fontSize: 11, color: '#dc2626'
                  }}>
                    <strong>Primary Forest Access Route Blocked.</strong> Routed via perimeter firebreak trail detour (+ETA penalty).
                  </div>
                )}

                {/* Why this unit */}
                <div style={{
                  background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: 4,
                  padding: '8px 10px', fontSize: 11, color: '#1e293b', lineHeight: 1.4, marginBottom: 8
                }}>
                  <strong style={{ color: '#1e40af' }}>WHY THIS UNIT? </strong>
                  Available + suitable capability + lowest weighted response cost.
                </div>

                {/* Standby Fallback */}
                {allocation.fallback_unit && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 8px', background: '#ffffff', borderRadius: 4, border: '1px solid #dbeafe', marginBottom: 12, fontSize: 11
                  }}>
                    <span style={{ color: '#475569' }}>
                      Standby Fallback: <strong className="font-mono-num" style={{ color: '#d97706' }}>{allocation.fallback_unit}</strong>
                    </span>
                    <span style={{ color: '#475569' }}>
                      Fallback ETA: <strong className="font-mono-num" style={{ color: '#d97706' }}>{allocation.fallback_eta_minutes?.toFixed(1)}m</strong>
                    </span>
                  </div>
                )}

                {/* Section 6: HUMAN AUTHORIZATION WORKFLOW */}
                <div style={{
                  borderTop: '1px solid #dbeafe', paddingTop: 10, marginTop: 4,
                }}>
                  {/* Workflow steps */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 9.5, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase'
                  }}>
                    <span style={{ color: '#16a34a' }}>1. AI Analysis ✓</span>
                    <span>→</span>
                    <span style={{ color: '#16a34a' }}>2. Recommendation ✓</span>
                    <span>→</span>
                    <span style={{ color: authorized ? '#16a34a' : '#2563eb' }}>3. Human Review</span>
                    <span>→</span>
                    <span style={{ color: authorized ? '#16a34a' : '#64748b' }}>4. {authorized ? 'Dispatched ✓' : 'Dispatch'}</span>
                  </div>

                  {/* Dispatch Authorization Button */}
                  <button
                    onClick={handleToggleAuthorization}
                    disabled={authorizing}
                    className={`btn-tactical ${authorized ? 'badge-verified' : 'btn-primary'}`}
                    style={{
                      width: '100%',
                      height: 38,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      background: authorized ? '#dcfce7' : '#2563eb',
                      borderColor: authorized ? '#86efac' : '#1d4ed8',
                      color: authorized ? '#15803d' : '#ffffff',
                    }}
                  >
                    {authorized
                      ? `✓ Simulated Dispatch Authorized by Forest Officer — Unit ${allocation.recommended_unit} Deployed`
                      : 'Authorize Wildfire Unit Dispatch (Simulation)'}
                  </button>

                  <div style={{ fontSize: 9.5, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 1.3 }}>
                    FIRENET is an operational decision-support system. Simulated emergency resource dispatches require explicit human operator authorization.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#dc2626', fontSize: 11, padding: 10, background: '#fee2e2', borderRadius: 4 }}>
                No available firefighting unit meets incident suppression criteria.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
