import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FireHotspot, Station, IncidentIntelligence, Resource } from '../types';

interface Props {
  fires: FireHotspot[];
  selectedFire: FireHotspot | null;
  intelligence: IncidentIntelligence | null;
  stations: Station[];
  resources?: Resource[];
  roadBlocked: boolean;
  onSelectFire: (id: string) => void;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 10, { duration: 0.8 });
  }, [center, map]);
  return null;
}

// Operational Fire Markers (🔴 Critical, 🟠 High-Risk, 🟡 Moderate)
function createCleanFireMarker(severity: string, isSelected: boolean, id: string) {
  const isCritical = severity === 'CRITICAL';
  const isHigh = severity === 'HIGH';
  const color = isCritical ? '#dc2626' : isHigh ? '#ea580c' : '#eab308';
  const size = isSelected ? 30 : 24;

  return L.divIcon({
    className: 'gis-fire-marker',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        ${isSelected ? `<div style="position: absolute; width: ${size + 14}px; height: ${size + 14}px; border-radius: 50%; border: 2.5px solid ${color}; background: ${color}25; animation: pulse 2s infinite;"></div>` : ''}
        <div style="
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${color}; border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
        ">
          <svg width="${size * 0.58}" height="${size * 0.58}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
        </div>
        <div style="
          position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%);
          background: #ffffff; border: 1.5px solid ${isSelected ? color : '#cbd5e1'};
          color: ${isSelected ? color : '#0f172a'}; font-size: 10px; font-weight: 700;
          font-family: 'JetBrains Mono', monospace; font-feature-settings: 'tnum' 1;
          padding: 1px 5px; border-radius: 3px; white-space: nowrap; pointer-events: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        ">
          ${id}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Fire Station Marker (🔵 Blue Station with Shield/Building)
function createCleanStationMarker(name: string) {
  return L.divIcon({
    className: 'gis-station-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="
          width: 22px; height: 22px; border-radius: 5px;
          background: #1d4ed8; border: 2px solid #ffffff;
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
          display: flex; align-items: center; justify-content: center;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"/>
            <path d="M5 21V7l7-4 7 4v14"/>
            <path d="M9 10h1"/>
            <path d="M14 10h1"/>
            <path d="M9 14h1"/>
            <path d="M14 14h1"/>
          </svg>
        </div>
        <div style="
          position: absolute; bottom: -16px; left: 50%; transform: translateX(-50%);
          background: #ffffff; border: 1px solid #93c5fd;
          color: #1e40af; font-size: 9px; font-weight: 700;
          padding: 1px 4px; border-radius: 2px; white-space: nowrap; pointer-events: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
        ">
          ${name.split(' ')[0]} Post
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

// Fire Response Unit Marker (🚒 Engine / Response Unit)
function createCleanUnitMarker(unitId: string, isRecommended: boolean, isOffline: boolean) {
  const bg = isOffline ? '#64748b' : isRecommended ? '#16a34a' : '#0284c7';
  const size = isRecommended ? 26 : 22;

  return L.divIcon({
    className: 'gis-unit-marker',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        ${isRecommended ? `<div style="position: absolute; width: ${size + 10}px; height: ${size + 10}px; border-radius: 50%; border: 2px solid #16a34a; background: #16a34a25;"></div>` : ''}
        <div style="
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${bg}; border: 2px solid #ffffff;
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
          display: flex; align-items: center; justify-content: center;
        ">
          <svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3" width="15" height="13"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <div style="
          position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
          background: #0f172a; color: #ffffff;
          font-size: 8.5px; font-weight: 800; font-family: 'JetBrains Mono', monospace;
          padding: 1px 4px; border-radius: 2px; white-space: nowrap; pointer-events: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        ">
          ${unitId}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export const MapComponent: React.FC<Props> = ({
  fires,
  selectedFire,
  intelligence,
  stations,
  resources = [],
  roadBlocked,
  onSelectFire,
}) => {
  const defaultCenter: [number, number] = useMemo(() => {
    if (selectedFire) {
      return [selectedFire.latitude, selectedFire.longitude];
    }
    return [28.32, 77.18];
  }, [selectedFire]);

  // Spread polygons
  const spreadPolygons = useMemo(() => {
    if (!intelligence?.spread?.zones) return [];
    return intelligence.spread.zones.map((zone, idx) => {
      const colors = ['#dc2626', '#ea580c', '#f59e0b'];
      const opacities = [0.28, 0.16, 0.09];
      return {
        label: zone.time_label,
        radius_km: zone.radius_km,
        polygon: zone.polygon as [number, number][],
        color: colors[idx % colors.length],
        fillOpacity: opacities[idx % opacities.length],
      };
    });
  }, [intelligence]);

  // Primary route waypoints
  const routeWaypoints = useMemo(() => {
    if (!intelligence?.allocation?.route?.waypoints) return [];
    return intelligence.allocation.route.waypoints as [number, number][];
  }, [intelligence]);

  // Alternative route waypoints
  const altRouteWaypoints = useMemo(() => {
    if (!intelligence?.allocation?.route?.alternative_route) return [];
    return intelligence.allocation.route.alternative_route as [number, number][];
  }, [intelligence]);

  // Recommended unit ID
  const recommendedUnitId = intelligence?.allocation?.recommended_unit || 'B-12';

  // Distance to nearest station for selected fire
  const nearestStationInfo = useMemo(() => {
    if (!selectedFire || stations.length === 0) return null;
    let minD = 9999;
    let nearest = stations[0];
    for (const st of stations) {
      const d = Math.sqrt(
        Math.pow(st.latitude - selectedFire.latitude, 2) +
        Math.pow(st.longitude - selectedFire.longitude, 2)
      ) * 111;
      if (d < minD) {
        minD = d;
        nearest = st;
      }
    }
    return { station: nearest, distanceKm: minD.toFixed(1) };
  }, [selectedFire, stations]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#f1f5f9' }}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <MapController center={defaultCenter} />

        {/* Free OpenStreetMap Standard Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains={['a', 'b', 'c']}
          maxZoom={19}
        />

        {/* Estimated Fire Spread-Risk Zone Polygons */}
        {spreadPolygons.map((sp, idx) => (
          <Polygon
            key={`spread-${idx}`}
            positions={sp.polygon}
            pathOptions={{
              color: sp.color,
              weight: 2,
              dashArray: idx === 0 ? undefined : '5, 5',
              fillColor: sp.color,
              fillOpacity: sp.fillOpacity,
            }}
          >
            <Popup>
              <div style={{ padding: '6px 4px', fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: sp.color, marginBottom: 2 }}>
                  {sp.label} Estimated Fire Spread Zone ({sp.radius_km.toFixed(1)} km)
                </div>
                <div style={{ color: '#475569', fontSize: 11 }}>
                  Decision-support thermal expansion risk based on wind conditions and fire intensity.
                </div>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Recommended Response Route Polyline (🔵 Blue) */}
        {routeWaypoints.length > 0 && (
          <Polyline
            positions={routeWaypoints}
            pathOptions={{
              color: roadBlocked ? '#dc2626' : '#2563eb',
              weight: 5,
              opacity: roadBlocked ? 0.6 : 0.95,
              dashArray: roadBlocked ? '6, 6' : undefined,
            }}
          >
            <Popup>
              <div style={{ padding: '6px 4px', fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: roadBlocked ? '#dc2626' : '#2563eb' }}>
                  {roadBlocked ? '⚠️ Primary Route Blocked' : '🔵 Recommended Response Route'}
                </div>
                <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                  Unit: <strong>{intelligence?.allocation?.recommended_unit}</strong> ({intelligence?.allocation?.unit_name})
                </div>
                <div style={{ color: '#475569', fontSize: 11 }}>
                  Distance: <span className="font-mono-num">{intelligence?.allocation?.distance_km?.toFixed(1)} km</span> • Estimated ETA: <span className="font-mono-num" style={{ color: '#16a34a', fontWeight: 700 }}>{intelligence?.allocation?.eta_minutes?.toFixed(1)} min</span>
                </div>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Alternative Detour Route Polyline */}
        {roadBlocked && altRouteWaypoints.length > 0 && (
          <Polyline
            positions={altRouteWaypoints}
            pathOptions={{
              color: '#d97706',
              weight: 5,
              opacity: 0.95,
              dashArray: '5, 6',
            }}
          >
            <Popup>
              <div style={{ padding: '6px 4px', fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: '#d97706' }}>Alternative Corridor Active</div>
                <div style={{ color: '#475569', fontSize: 11 }}>
                  Detour ETA: <span className="font-mono-num">{intelligence?.allocation?.eta_minutes?.toFixed(1)}m</span> via Eastern Bypass Corridor
                </div>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Fire Stations (🔵 Blue) */}
        {stations.map(st => (
          <Marker
            key={st.id}
            position={[st.latitude, st.longitude]}
            icon={createCleanStationMarker(st.name)}
          >
            <Popup>
              <div style={{ padding: '6px 4px', fontSize: 12, minWidth: 170 }}>
                <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 2 }}>{st.name}</div>
                <div style={{ color: '#475569', fontSize: 11 }}>District: {st.district}, {st.state}</div>
                <div style={{ color: '#475569', fontSize: 11 }}>
                  Fire Fleet Available: <strong style={{ color: '#16a34a' }}>{st.resources_available}</strong> / {st.capacity} units
                </div>
                {st.contact && (
                  <div style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>
                    Station Phone: {st.contact}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Fire Response Units (🚒) */}
        {resources.map(res => {
          const isRecommended = res.id === recommendedUnitId;
          const isOffline = res.availability === 'OFFLINE' || res.availability === 'MAINTENANCE';
          return (
            <Marker
              key={res.id}
              position={[res.latitude, res.longitude]}
              icon={createCleanUnitMarker(res.id, isRecommended, isOffline)}
            >
              <Popup>
                <div style={{ padding: '6px 4px', fontSize: 12, minWidth: 180 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span className="font-mono-num" style={{ fontWeight: 800, color: '#0f172a' }}>{res.id}</span>
                    <span className={isRecommended ? 'badge badge-verified' : isOffline ? 'badge badge-critical' : 'badge badge-info'} style={{ fontSize: 9 }}>
                      {isRecommended ? 'Recommended' : res.availability}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 11 }}>{res.name}</div>
                  <div style={{ color: '#475569', fontSize: 10.5, marginTop: 2 }}>
                    Type: <strong>{res.type.replace('_', ' ')}</strong>
                  </div>
                  <div style={{ color: '#475569', fontSize: 10.5 }}>
                    Station: {res.station_name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>
                    Water/Foam: {res.capacity_liters}L • Crew: {res.crew_count}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Active Fire Incidents (🔴 Critical, 🟠 High-Risk, 🟡 Moderate) */}
        {fires.map(f => {
          const isSelected = selectedFire?.id === f.id;
          return (
            <Marker
              key={f.id}
              position={[f.latitude, f.longitude]}
              icon={createCleanFireMarker(f.severity, isSelected, f.id)}
              eventHandlers={{
                click: () => onSelectFire(f.id),
              }}
            >
              <Popup>
                <div style={{ padding: '8px 4px', fontSize: 12, minWidth: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span className="font-mono-num" style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{f.id}</span>
                    <span className={f.severity === 'CRITICAL' ? 'badge badge-critical' : 'badge badge-warning'}>
                      {f.severity === 'MEDIUM' ? 'MODERATE' : f.severity}
                    </span>
                  </div>
                  <div style={{ color: '#1e293b', fontWeight: 600, fontSize: 11.5, marginBottom: 4 }}>{f.area_name}</div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
                    borderTop: '1px solid #e2e8f0', paddingTop: 6, marginBottom: 8, fontSize: 11
                  }}>
                    <div>Risk: <strong className="font-mono-num" style={{ color: '#dc2626' }}>{f.risk_score}</strong>/100</div>
                    <div>Conf: <strong className="font-mono-num">{f.confidence}%</strong></div>
                    <div>FRP: <strong className="font-mono-num">{f.frp} MW</strong></div>
                    <div>Pop: <strong className="font-mono-num">{f.population_at_risk.toLocaleString()}</strong></div>
                  </div>
                  <button
                    onClick={() => onSelectFire(f.id)}
                    className="btn-tactical btn-primary"
                    style={{ width: '100%', height: 28, fontSize: 11 }}
                  >
                    Select Fire Incident
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Top Map HUD Telemetry Strip */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none'
      }}>
        {selectedFire && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 12px',
            fontSize: 11, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
          }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Active Incident:</span>
            <span className="font-mono-num" style={{ color: '#dc2626', fontWeight: 800 }}>{selectedFire.id}</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedFire.area_name}</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            {nearestStationInfo && (
              <>
                <span style={{ color: '#475569' }}>
                  Nearest: <strong>{nearestStationInfo.station.name.split(' ')[0]}</strong> ({nearestStationInfo.distanceKm} km)
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
              </>
            )}
            <span style={{ color: '#16a34a', fontWeight: 700 }}>
              Rec ETA: {intelligence?.allocation ? `${intelligence.allocation.eta_minutes.toFixed(1)}m` : '—'}
            </span>
          </div>
        )}
      </div>

      {/* Integrated Operational GIS Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.96)',
        border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px',
        fontSize: 11, color: '#334155', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        maxWidth: 240
      }}>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 10, letterSpacing: '0.04em', marginBottom: 6, textTransform: 'uppercase' }}>
          Forest Fire GIS Layers
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
            <span>Active Critical Forest Fire</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />
            <span>High-Risk Forest Fire</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
            <span>Moderate Forest Fire</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: '#1d4ed8', display: 'inline-block' }} />
            <span>Forest Range Post</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            <span>Wildland Fire Response Unit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 3, background: '#2563eb', display: 'inline-block' }} />
            <span>Recommended Response Route</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 7, background: 'rgba(220, 38, 38, 0.28)', border: '1.5px dashed #dc2626', display: 'inline-block' }} />
            <span>Estimated Spread-Risk Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
};
