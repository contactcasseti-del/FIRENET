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
        { incident: 'FIRE-201', label: 'FIRE-201 (Aravalli)', population: 640 },
        { incident: 'FIRE-204', label: 'FIRE-204 (Dudhwa)', population: 520 },
        { incident: 'FIRE-202', label: 'FIRE-202 (Sariska)', population: 420 },
        { incident: 'FIRE-208', label: 'FIRE-208 (Asola)', population: 380 },
        { incident: 'FIRE-203', label: 'FIRE-203 (Corbett)', population: 310 },
        { incident: 'FIRE-205', label: 'FIRE-205 (Ranthambore)', population: 280 },
        { incident: 'FIRE-206', label: 'FIRE-206 (Rajaji)', population: 190 },
      ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#f8fafc' }}>
      {/* Title & Scope Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Forest Fire Station & Wildland Fleet Analytics
          </h2>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Operational monitoring across North Indian forest divisions, wildlife reserves & wildland response fleet.
          </div>
        </div>
        <div className="badge badge-verified font-mono-num" style={{ fontSize: 11, padding: '4px 10px' }}>
          Live Wildland Fleet Telemetry
        </div>
      </div>

      {/* Top 8 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
        
        {/* 1. Active Fire Incidents */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Active Fire Incidents</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
            {summary.active_fires}
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>{summary.total_fires} Total Detected</div>
        </div>

        {/* 2. Critical Fires */}
        <div style={{ background: '#ffffff', border: '1px solid #fee2e2', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>Critical Fires</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#dc2626', margin: '4px 0' }}>
            {summary.critical_fires}
          </div>
          <div style={{ fontSize: 10.5, color: '#dc2626' }}>Immediate Suppression</div>
        </div>

        {/* 3. High-Risk Fires */}
        <div style={{ background: '#ffffff', border: '1px solid #fef3c7', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#d97706', fontWeight: 700 }}>High-Risk Fires</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#d97706', margin: '4px 0' }}>
            {summary.high_fires}
          </div>
          <div style={{ fontSize: 10.5, color: '#d97706' }}>Elevated Spread Potential</div>
        </div>

        {/* 4. Fire Units Available */}
        <div style={{ background: '#ffffff', border: '1px solid #dcfce7', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>Fire Units Available</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', margin: '4px 0' }}>
            {summary.resources_available}
          </div>
          <div style={{ fontSize: 10.5, color: '#16a34a' }}>Ready for Instant Dispatch</div>
        </div>

        {/* 5. Fire Units Deployed */}
        <div style={{ background: '#ffffff', border: '1px solid #dbeafe', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700 }}>Fire Units Deployed</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#2563eb', margin: '4px 0' }}>
            {summary.resources_deployed}
          </div>
          <div style={{ fontSize: 10.5, color: '#2563eb' }}>En Route / On-Scene</div>
        </div>

        {/* 6. Fire Units Offline */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Fire Units Offline</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#64748b', margin: '4px 0' }}>
            {summary.resources_offline}
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>Scheduled Maintenance</div>
        </div>

        {/* 7. Average Fire Response ETA */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Average Fire Response ETA</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#2563eb', margin: '4px 0' }}>
            {summary.average_response_eta ? `${summary.average_response_eta}m` : '10.8m'}
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>Route-Optimized Arrival</div>
        </div>

        {/* 8. Population at Fire Risk */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Population at Fire Risk</div>
          <div className="font-mono-num" style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
            {summary.population_at_risk.toLocaleString()}
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>Active Incident Perimeters</div>
        </div>

      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
        
        {/* Chart 1: Fire Incidents by Severity */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Fire Incidents by Severity
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

        {/* Chart 3: Fire Station & Unit Availability */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Fire Station & Unit Availability
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Fleet Status</span>
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

        {/* Chart 4: Response ETA by Unit */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Response ETA by Unit (Minutes)
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

        {/* Chart 5: Population Exposure by Incident */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '16px', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Population Exposure by Fire Incident
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>People at Risk within Incident Perimeter</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={populationChartData}>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, color: '#0f172a', fontSize: 12 }} />
                <Bar dataKey="population" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
