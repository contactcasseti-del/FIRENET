import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { fetchAnalytics } from '../services/api';

interface AnalyticsData {
  summary: {
    total_fires: number;
    active_fires: number;
    monitoring: number;
    critical_fires: number;
    high_fires: number;
    medium_fires: number;
    low_fires: number;
    verified_fires: number;
    suspected_alerts: number;
    average_response_eta: number | null;
    resources_available: number;
    resources_deployed: number;
    resources_offline: number;
    population_at_risk: number;
  };
  charts: {
    fires_by_hour: { hour: string; count: number }[];
    risk_distribution: { level: string; count: number }[];
    severity_distribution: { name: string; value: number }[];
    resource_utilization: { name: string; value: number }[];
    response_times: { unit: string; eta: number }[];
    population_by_incident?: { incident: string; label: string; population: number; severity: string }[];
  };
}

const SEVERITY_COLORS = ['#dc2626', '#ea580c', '#eab308', '#16a34a'];
const FLEET_COLORS = ['#16a34a', '#2563eb', '#64748b', '#dc2626'];

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        Loading fire station & fleet operational analytics...
      </div>
    );
  }

  const { summary, charts } = data;

  const populationChartData = charts.population_by_incident && charts.population_by_incident.length > 0
    ? charts.population_by_incident
    : [
        { incident: 'FIRE-101', label: 'FIRE-101 (Aravalli)', population: 640 },
        { incident: 'FIRE-105', label: 'FIRE-105 (Dudhwa)', population: 520 },
        { incident: 'FIRE-102', label: 'FIRE-102 (Sariska)', population: 420 },
        { incident: 'FIRE-108', label: 'FIRE-108 (Asola)', population: 380 },
        { incident: 'FIRE-103', label: 'FIRE-103 (Corbett)', population: 310 },
        { incident: 'FIRE-104', label: 'FIRE-104 (Ranthambore)', population: 280 },
        { incident: 'FIRE-106', label: 'FIRE-106 (Rajaji)', population: 190 },
      ];

  const estimatedAreaHa = (summary as any).estimated_forest_area_at_risk_ha || 2450;
  const highRiskZones = (summary as any).high_risk_forest_zones || (summary.critical_fires + summary.high_fires);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', background: '#f8fafc' }}>
      {/* Title & Scope Header */}
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Forest Fire Station & Wildland Fleet Analytics
            </h2>
            <span style={{
              fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 3,
              background: '#fee2e2', color: '#b91c1c'
            }}>
              SIMULATED TELEMETRY
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Operational monitoring across North Indian forest divisions, wildlife reserves & wildland response fleet.
          </div>
        </div>
        <div className="badge badge-verified font-mono-num" style={{ fontSize: 11, padding: '4px 10px' }}>
          Simulated Division Readiness
        </div>
      </div>

      {/* Top 8 Forest Fire KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 18 }}>
        
        {/* 1. Active Forest Fires */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Active Forest Fires</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
            {summary.active_fires}
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>{summary.total_fires} Total Detections</div>
        </div>

        {/* 2. Critical Wildfire Incidents */}
        <div style={{ background: '#ffffff', border: '1px solid #fee2e2', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>Critical Wildfire Incidents</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#dc2626', margin: '4px 0' }}>
            {summary.critical_fires}
          </div>
          <div style={{ fontSize: 10.5, color: '#dc2626' }}>Immediate Suppression</div>
        </div>

        {/* 3. High-Risk Forest Zones */}
        <div style={{ background: '#ffffff', border: '1px solid #fef3c7', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#d97706', fontWeight: 700 }}>High-Risk Forest Zones</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#d97706', margin: '4px 0' }}>
            {highRiskZones}
          </div>
          <div style={{ fontSize: 10.5, color: '#d97706' }}>Elevated Spread Potential</div>
        </div>

        {/* 4. Wildfire Response Units Available */}
        <div style={{ background: '#ffffff', border: '1px solid #dcfce7', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>Wildfire Units Available</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', margin: '4px 0' }}>
            {summary.resources_available}
          </div>
          <div style={{ fontSize: 10.5, color: '#16a34a' }}>Ready for Instant Dispatch</div>
        </div>

        {/* 5. Response Units Deployed */}
        <div style={{ background: '#ffffff', border: '1px solid #dbeafe', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700 }}>Response Units Deployed</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#2563eb', margin: '4px 0' }}>
            {summary.resources_deployed}
          </div>
          <div style={{ fontSize: 10.5, color: '#2563eb' }}>En Route / Field Ops</div>
        </div>

        {/* 6. Estimated Forest Area at Risk */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#15803d', fontWeight: 700 }}>Estimated Forest Area at Risk</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#15803d', margin: '4px 0' }}>
            {estimatedAreaHa.toLocaleString()} ha
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>Projected Perimeter Buffer</div>
        </div>

        {/* 7. Nearby Settlement Exposure */}
        <div style={{ background: '#ffffff', border: '1px solid #f3e8ff', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700 }}>Nearby Settlement Exposure</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#7c3aed', margin: '4px 0' }}>
            {summary.population_at_risk.toLocaleString()}
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>Fringe Hamlet Residents</div>
        </div>

        {/* 8. Average Wildfire Response ETA */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Average Wildfire Response ETA</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#2563eb', margin: '4px 0' }}>
            {summary.average_response_eta ? `${summary.average_response_eta}m` : '10.8m'}
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>Trail-Optimized Arrival</div>
        </div>

      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
        
        {/* Chart 1: Fire Incidents by Severity */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Wildfire Incidents by Severity
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Classification</span>
          </div>
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={charts.severity_distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={48}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {charts.severity_distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, color: '#0f172a', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fire Detections Over Time */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Fire Detections Over Time
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Satellite Detections / Hour</span>
          </div>
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <AreaChart data={charts.fires_by_hour}>
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, color: '#0f172a', fontSize: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                <Area type="monotone" dataKey="count" stroke="#ea580c" fill="rgba(234, 88, 12, 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Forest Response Unit Availability */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Forest Response Unit Availability
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Wildland Fleet Status</span>
          </div>
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <BarChart data={charts.resource_utilization}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, color: '#0f172a', fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {charts.resource_utilization.map((_, index) => (
                    <Cell key={`fleet-${index}`} fill={FLEET_COLORS[index % FLEET_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Response ETA by Forest Division / Unit */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Response ETA by Forest Division & Unit (Minutes)
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Dispatch Speed</span>
          </div>
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <BarChart data={charts.response_times}>
                <XAxis dataKey="unit" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, color: '#0f172a', fontSize: 12 }} />
                <Bar dataKey="eta" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Nearby Settlement Exposure by Fire Incident */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Nearby Settlement Exposure by Forest Fire Incident
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Residents in Adjacent Hamlets within Buffer</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={populationChartData}>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, color: '#0f172a', fontSize: 12 }} />
                <Bar dataKey="population" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
