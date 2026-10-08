import { useState, useEffect, useCallback } from 'react';
import { IncidentList } from './components/IncidentList';
import { MapComponent } from './components/MapComponent';
import { IncidentIntelligencePanel } from './components/IncidentIntelligencePanel';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { TimelineAndAlerts } from './components/TimelineAndAlerts';
import { AnalyticsView } from './components/AnalyticsView';
import {
  fetchFires,
  fetchStations,
  fetchResources,
  fetchIncidentIntelligence,
  simulationState,
  resetScenario,
} from './services/api';
import type {
  FireHotspot,
  Station,
  Resource,
  IncidentIntelligence,
  SimulationState,
  View,
} from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('command-center');
  const [activeRightTab, setActiveRightTab] = useState<'intelligence' | 'what-if'>('intelligence');
  const [fires, setFires] = useState<FireHotspot[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedFireId, setSelectedFireId] = useState<string>('FIRE-201');
  const [intelligence, setIntelligence] = useState<IncidentIntelligence | null>(null);
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [loadingIntel, setLoadingIntel] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'risk' | 'population' | 'spread_risk' | 'eta'>('risk');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load initial fires, stations, resources, simulation state
  const loadInitialData = useCallback(async () => {
    try {
      const [firesRes, stationsRes, resourcesRes, simRes] = await Promise.all([
        fetchFires(),
        fetchStations(),
        fetchResources(),
        simulationState(),
      ]);
      setFires(firesRes.fires);
      setStations(stationsRes.stations);
      setResources(resourcesRes.resources);
      setSimState(simRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load intelligence for selected fire
  const loadIntelligence = useCallback(async (fireId: string) => {
    try {
      setLoadingIntel(true);
      const res = await fetchIncidentIntelligence(fireId);
      setIntelligence(res);
    } catch (err) {
      console.error(`Failed to load intelligence for ${fireId}:`, err);
    } finally {
      setLoadingIntel(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFireId) {
      loadIntelligence(selectedFireId);
    }
  }, [selectedFireId, loadIntelligence]);

  // Callback when simulation modifies state
  const handleSimulationStateChange = async () => {
    try {
      const [firesRes, resourcesRes, simRes] = await Promise.all([
        fetchFires(),
        fetchResources(),
        simulationState(),
      ]);
      setFires(firesRes.fires);
      setResources(resourcesRes.resources);
      setSimState(simRes);
      if (selectedFireId) {
        await loadIntelligence(selectedFireId);
      }
    } catch (err) {
      console.error('Failed to refresh state after simulation action:', err);
    }
  };

  const handleResetScenario = async () => {
    try {
      await resetScenario();
      setSelectedFireId('FIRE-201');
      await handleSimulationStateChange();
    } catch (err) {
      console.error('Failed to reset scenario:', err);
    }
  };

  const selectedFire = fires.find(f => f.id === selectedFireId) || fires[0] || null;
  const criticalCount = fires.filter(f => f.severity === 'CRITICAL' && f.status === 'ACTIVE').length;
  const highCount = fires.filter(f => f.severity === 'HIGH' && f.status === 'ACTIVE').length;
  const roadBlocked = simState?.road_blocked ?? false;
  const disabledCount = simState?.disabled_units.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#f8fafc', color: '#0f172a', overflow: 'hidden' }}>
      {/* Top Header */}
      <header style={{
        height: 52,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        zIndex: 1000,
        flexShrink: 0,
      }}>
        {/* Brand & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 5, background: '#dc2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff',
              fontSize: 14, fontWeight: 900
            }}>
              F
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="font-mono-num" style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  FIRENET
                </span>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                  // AI-Powered Forest Fire Emergency Response & Coordination System
                </span>
              </div>
            </div>
          </div>

          <div className="badge badge-verified" style={{ fontSize: 10, padding: '2px 8px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            Decision Support Active (Human Authorization Required)
          </div>
        </div>

        {/* Operational Telemetry Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-critical font-mono-num" style={{ padding: '3px 8px' }}>
            {criticalCount} Critical Wildfires
          </span>

          <span className="badge badge-warning font-mono-num" style={{ padding: '3px 8px' }}>
            {highCount} High Risk
          </span>

          {roadBlocked ? (
            <span className="badge badge-critical font-mono-num" style={{ padding: '3px 8px' }}>
              ⚠️ Forest Access Trail Blocked
            </span>
          ) : (
            <span className="badge badge-neutral font-mono-num" style={{ padding: '3px 8px' }}>
              Corridors Clear
            </span>
          )}

          {disabledCount > 0 && (
            <span className="badge badge-warning font-mono-num" style={{ padding: '3px 8px' }}>
              {disabledCount} Unit Offline
            </span>
          )}
        </div>

        {/* View Switcher and Reset Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Segmented Switcher */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: 2,
          }}>
            <button
              onClick={() => setCurrentView('command-center')}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: currentView === 'command-center' ? '#ffffff' : 'transparent',
                color: currentView === 'command-center' ? '#0f172a' : '#64748b',
                fontSize: 11,
                fontWeight: 600,
                boxShadow: currentView === 'command-center' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.1s',
              }}
            >
              Command Center
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: currentView === 'analytics' ? '#ffffff' : 'transparent',
                color: currentView === 'analytics' ? '#0f172a' : '#64748b',
                fontSize: 11,
                fontWeight: 600,
                boxShadow: currentView === 'analytics' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.1s',
              }}
            >
              Fleet Analytics
            </button>
          </div>

          <button
            onClick={handleResetScenario}
            title="Reset scenario to baseline FIRE-201 forest fire state"
            className="btn-tactical btn-hazard"
            style={{ height: 30, padding: '0 12px', fontSize: 11 }}
          >
            Reset Demo
          </button>

          {/* Time Telemetry */}
          <div className="font-mono-num" style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#475569',
            borderLeft: '1px solid #e2e8f0',
            paddingLeft: 12,
          }}>
            {currentTime}
          </div>
        </div>
      </header>

      {/* Main Operations Surface */}
      {currentView === 'command-center' ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
          {/* Left Panel: Incident Queue (300px) */}
          <aside style={{
            width: 300,
            borderRight: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}>
            <IncidentList
              fires={fires}
              selectedFireId={selectedFireId}
              onSelectFire={(id) => setSelectedFireId(id)}
              sortBy={sortBy}
              onSortChange={(sort) => setSortBy(sort)}
            />
          </aside>

          {/* Center Surface: Light GIS Map */}
          <main style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <MapComponent
              fires={fires}
              selectedFire={selectedFire}
              intelligence={intelligence}
              stations={stations}
              resources={resources}
              roadBlocked={roadBlocked}
              onSelectFire={(id) => setSelectedFireId(id)}
            />
          </main>

          {/* Right Panel: Incident Intelligence & What-If Tabs (370px) */}
          <aside style={{
            width: 370,
            borderLeft: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}>
            {/* Panel Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
            }}>
              <button
                onClick={() => setActiveRightTab('intelligence')}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: activeRightTab === 'intelligence' ? '2px solid #2563eb' : '2px solid transparent',
                  background: activeRightTab === 'intelligence' ? '#ffffff' : 'transparent',
                  color: activeRightTab === 'intelligence' ? '#2563eb' : '#64748b',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                Fire Incident Intelligence ({selectedFireId})
              </button>

              <button
                onClick={() => setActiveRightTab('what-if')}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: activeRightTab === 'what-if' ? '2px solid #d97706' : '2px solid transparent',
                  background: activeRightTab === 'what-if' ? '#ffffff' : 'transparent',
                  color: activeRightTab === 'what-if' ? '#d97706' : '#64748b',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                What-If Fire Simulator
              </button>
            </div>

            {/* Panel Content Body */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {activeRightTab === 'intelligence' ? (
                <IncidentIntelligencePanel
                  intelligence={intelligence}
                  loading={loadingIntel}
                  onRefresh={() => loadIntelligence(selectedFireId)}
                  onOpenWhatIf={() => setActiveRightTab('what-if')}
                />
              ) : (
                <WhatIfSimulator
                  simState={simState}
                  onStateChange={handleSimulationStateChange}
                />
              )}
            </div>
          </aside>
        </div>
      ) : (
        <AnalyticsView />
      )}

      {/* Bottom Timeline and Audit Stream */}
      <TimelineAndAlerts
        timeline={simState?.timeline || []}
        alerts={simState?.alerts || []}
        onSelectFire={(id) => {
          setSelectedFireId(id);
          setCurrentView('command-center');
        }}
      />
    </div>
  );
}
