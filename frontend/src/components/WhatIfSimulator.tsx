import React, { useState } from 'react';
import type { SimulationState } from '../types';
import {
  disableUnit,
  enableUnit,
  blockRoad,
  unblockRoad,
  increaseWind,
  increaseIntensity,
  increasePopulation,
  simulateNewFire,
  resetScenario,
} from '../services/api';

interface Props {
  simState: SimulationState | null;
  onStateChange: () => void;
}

interface DeltaResult {
  action: string;
  scenarioTitle: string;
  explanation: string;
  beforeUnit?: string | null;
  afterUnit?: string | null;
  beforeEta?: number | null;
  afterEta?: number | null;
  beforeRisk?: string | null;
  afterRisk?: string | null;
}

export const WhatIfSimulator: React.FC<Props> = ({ simState, onStateChange }) => {
  const [loading, setLoading] = useState(false);
  const [delta, setDelta] = useState<DeltaResult | null>(null);
  const [selectedUnitToDisable, setSelectedUnitToDisable] = useState('WF-10');

  // 1. Recommended Unit Becomes Unavailable
  const handleToggleUnit = async (unitId: string) => {
    setLoading(true);
    try {
      if (simState?.disabled_units.includes(unitId)) {
        await enableUnit(unitId);
        setDelta({
          action: 'unit_enabled',
          scenarioTitle: 'Resource Restored',
          explanation: `Unit ${unitId} restored to active wildland firefighting inventory. Baseline plan active.`,
        });
      } else {
        const res = await disableUnit(unitId);
        setDelta({
          action: 'unit_disabled',
          scenarioTitle: 'Recommended Unit Unavailable',
          explanation: res.explanation || `Unit ${unitId} marked unavailable. Response plan recalculated to assign standby fallback.`,
          beforeUnit: res.before?.unit || 'WF-10',
          afterUnit: res.after?.unit || 'WT-04',
          beforeEta: res.before?.eta_minutes || 6.5,
          afterEta: res.after?.eta_minutes || 14.8,
        });
      }
      onStateChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Response Route Becomes Unavailable
  const handleToggleRoad = async () => {
    setLoading(true);
    try {
      if (simState?.road_blocked) {
        await unblockRoad();
        setDelta({
          action: 'road_unblocked',
          scenarioTitle: 'Route Cleared',
          explanation: 'Primary forest ridge trail cleared. Direct wildland response vector restored.',
        });
      } else {
        const res = await blockRoad();
        setDelta({
          action: 'road_blocked',
          scenarioTitle: 'Response Route Unavailable',
          explanation: res.explanation || 'Primary Forest Access Route / Ridgeline Road blocked. Alternative forest fire trail detour calculated.',
          beforeEta: res.before?.eta_minutes || 6.5,
          afterEta: res.after?.eta_minutes || 12.8,
        });
      }
      onStateChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fire Spread Increases
  const handleIncreaseWind = async () => {
    setLoading(true);
    try {
      const res = await increaseWind();
      setDelta({
        action: 'wind_increased',
        scenarioTitle: 'Fire Spread Increases',
        explanation: `Wind escalated to ${res.new_wind_speed} km/h (${res.wind_multiplier}x). Estimated +15m and +30m spread zones expanded downwind.`,
      });
      onStateChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Fire Severity Increases
  const handleIncreaseIntensity = async () => {
    setLoading(true);
    try {
      const res = await increaseIntensity();
      setDelta({
        action: 'intensity_increased',
        scenarioTitle: 'Fire Severity Increases',
        explanation: `Thermal FRP escalated to ${res.new_frp} MW (${res.intensity_multiplier}x). Fire risk and suppression resource demands escalated.`,
      });
      onStateChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Population Exposure Increases
  const handleIncreasePopulation = async () => {
    setLoading(true);
    try {
      const res = await increasePopulation();
      setDelta({
        action: 'population_increased',
        scenarioTitle: 'Population Exposure Increases',
        explanation: res.explanation || `Evacuation perimeter expanded. Population exposure increased to ${res.new_population?.toLocaleString()} people.`,
      });
      onStateChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 6. Additional Fire Incident Appears
  const handleSimulateNewFire = async () => {
    setLoading(true);
    try {
      const res = await simulateNewFire();
      setDelta({
        action: 'new_fire',
        scenarioTitle: 'Additional Fire Incident Appears',
        explanation: `New thermal anomaly ${res.fire_id} detected. Multi-incident fire resource prioritization recalculated.`,
      });
      onStateChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset to Baseline
  const handleReset = async () => {
    setLoading(true);
    try {
      await resetScenario();
      setDelta({
        action: 'reset',
        scenarioTitle: 'Baseline Restored',
        explanation: 'Scenario reset to baseline FIRE-101 forest fire state (Aravalli Forest Range). All wildland units and response corridors cleared.',
      });
      onStateChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isWF10Disabled = simState?.disabled_units.includes('WF-10');
  const isRoadBlocked = simState?.road_blocked ?? false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: '#ffffff' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            What-If Fire Simulator
          </div>

          <button
            onClick={handleReset}
            disabled={loading}
            className="btn-tactical btn-hazard"
            style={{ height: 26, padding: '0 8px', fontSize: 11 }}
          >
            Reset Demo
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          Evaluate operational contingencies for wildland fire incidents. Observe instant response recalculations.
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        
        {/* Recalculation Summary Delta Banner */}
        {delta && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 6, padding: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                {delta.scenarioTitle}
              </span>
              <span className="badge badge-warning" style={{ fontSize: 9.5 }}>
                Recalculated
              </span>
            </div>

            <div style={{ fontSize: 11.5, color: '#1f2937', marginBottom: 8, lineHeight: 1.4 }}>
              {delta.explanation}
            </div>

            {(delta.beforeUnit || delta.afterUnit || delta.beforeEta || delta.afterEta) && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center',
                background: '#ffffff', padding: '8px 10px', borderRadius: 4, border: '1px solid #fde68a', fontSize: 11
              }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 9.5, fontWeight: 700 }}>BEFORE</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {delta.beforeUnit ? `Unit ${delta.beforeUnit}` : 'Unit WF-10'}
                  </div>
                  <div className="font-mono-num" style={{ color: '#64748b', fontSize: 10 }}>
                    ETA {delta.beforeEta ? `${delta.beforeEta.toFixed(1)}m` : '6.5m'}
                  </div>
                </div>

                <span style={{ fontSize: 16, color: '#d97706', fontWeight: 800 }}>→</span>

                <div>
                  <div style={{ color: '#64748b', fontSize: 9.5, fontWeight: 700 }}>RECALCULATED</div>
                  <div style={{ fontWeight: 700, color: '#2563eb' }}>
                    {delta.afterUnit ? `Unit ${delta.afterUnit}` : 'Unit WT-04'}
                  </div>
                  <div className="font-mono-num" style={{ color: '#2563eb', fontSize: 10, fontWeight: 700 }}>
                    ETA {delta.afterEta ? `${delta.afterEta.toFixed(1)}m` : '14.8m'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1. Fire Severity Increases */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
              1. Fire Severity Increases
            </span>
            <span className="font-mono-num" style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>
              {simState?.intensity_multiplier.toFixed(1)}x FRP
            </span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
              Simulate sudden thermal eruption. Risk score and suppression requirements recalculate immediately.
            </div>
            <button
              onClick={handleIncreaseIntensity}
              disabled={loading}
              className="btn-tactical"
              style={{ width: '100%', height: 30, justifyContent: 'center' }}
            >
              🔥 Escalate Fire Intensity (+40% FRP)
            </button>
          </div>
        </div>

        {/* 2. Fire Spread Increases */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
              2. Fire Spread Increases
            </span>
            <span className="font-mono-num" style={{ fontSize: 11, color: '#d97706', fontWeight: 700 }}>
              {simState?.wind_multiplier.toFixed(1)}x Wind
            </span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
              Simulate wind shift and velocity spike. Downwind spread zones expand on the operational map.
            </div>
            <button
              onClick={handleIncreaseWind}
              disabled={loading}
              className="btn-tactical"
              style={{ width: '100%', height: 30, justifyContent: 'center' }}
            >
              💨 Escalate Wind Conditions (+50%)
            </button>
          </div>
        </div>

        {/* 3. Recommended Unit Becomes Unavailable */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
              3. Recommended Unit Unavailable
            </span>
            <span className={isWF10Disabled ? 'badge badge-critical' : 'badge badge-verified'}>
              {isWF10Disabled ? 'WF-10 Offline' : 'WF-10 Available'}
            </span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
              Simulate primary wildland engine breakdown or redirection. System matches standby fallback unit.
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={selectedUnitToDisable}
                onChange={e => setSelectedUnitToDisable(e.target.value)}
                style={{
                  flex: 1,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  borderRadius: 6,
                  padding: '0 8px',
                  height: 30,
                  fontSize: 11,
                }}
              >
                <option value="WF-10">Unit WF-10 (Wildland Fire Engine)</option>
                <option value="WT-04">Unit WT-04 (Forest Water Bowser)</option>
                <option value="FP-02">Unit FP-02 (Forest Patrol QRT)</option>
                <option value="FT-07">Unit FT-07 (Forest Firefighting Crew)</option>
                <option value="AS-01">Unit AS-01 (Aerial Fire Support)</option>
              </select>

              <button
                onClick={() => handleToggleUnit(selectedUnitToDisable)}
                disabled={loading}
                className={`btn-tactical ${simState?.disabled_units.includes(selectedUnitToDisable) ? 'badge-verified' : 'btn-hazard'}`}
                style={{ height: 30, fontSize: 11 }}
              >
                {simState?.disabled_units.includes(selectedUnitToDisable) ? 'Restore' : 'Mark Offline'}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Response Route Becomes Unavailable */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
              4. Response Route Unavailable
            </span>
            <span className={isRoadBlocked ? 'badge badge-critical' : 'badge badge-verified'}>
              {isRoadBlocked ? 'Corridor Blocked' : 'Routes Clear'}
            </span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
              Simulate rockfall or fire blockage on forest trail. Engine routes via alternative firebreak with detour ETA.
            </div>

            <button
              onClick={handleToggleRoad}
              disabled={loading}
              className={`btn-tactical ${isRoadBlocked ? 'badge-verified' : 'badge-warning'}`}
              style={{ width: '100%', height: 30, justifyContent: 'center' }}
            >
              {isRoadBlocked ? '✓ Clear Forest Access Trail Blockage' : '🚧 Block Forest Access Trail (Ridge Corridor)'}
            </button>
          </div>
        </div>

        {/* 5. Population Exposure Increases */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 4 }}>
            5. Population Exposure Increases
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
              Simulate perimeter expansion towards forest fringe hamlet. Evacuation and containment priority escalates.
            </div>
            <button
              onClick={handleIncreasePopulation}
              disabled={loading}
              className="btn-tactical"
              style={{ width: '100%', height: 30, justifyContent: 'center' }}
            >
              👥 Expand Evacuation Perimeter (+60% Population)
            </button>
          </div>
        </div>

        {/* 6. Additional Fire Incident Appears */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 4 }}>
            6. Additional Fire Incident Appears
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
              Simulate new satellite thermal detection in forest belt. Evaluates concurrent multi-fire fleet allocation.
            </div>
            <button
              onClick={handleSimulateNewFire}
              disabled={loading}
              className="btn-tactical btn-primary"
              style={{ width: '100%', height: 30, justifyContent: 'center' }}
            >
              🛰️ Simulate New Satellite Forest Hotspot
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
