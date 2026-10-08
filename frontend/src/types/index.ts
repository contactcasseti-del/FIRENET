// FIRENET Type Definitions

export interface FireHotspot {
  id: string;
  latitude: number;
  longitude: number;
  confidence: number;
  frp: number;
  brightness?: number;
  satellite: string;
  instrument: string;
  acquisition_date: string;
  acquisition_time: string;
  day_night: string;
  land_cover: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'MONITORING' | 'CONTAINED';
  population_at_risk: number;
  infrastructure_risk: 'HIGH' | 'MEDIUM' | 'LOW';
  spread_risk: 'HIGH' | 'MEDIUM' | 'LOW';
  risk_score: number;
  verification_score: number;
  wind_speed: number;
  wind_direction: number;
  humidity: number;
  temperature: number;
  assigned_unit?: string;
  eta_minutes?: number;
  area_name: string;
  state: string;
  fuel_type?: string;
  terrain_type?: string;
  ecosystem_zone?: string;
}

export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  district: string;
  state: string;
  type: string;
  capacity: number;
  resources_available: number;
  contact?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  availability: 'AVAILABLE' | 'EN_ROUTE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE';
  current_status: string;
  capability: string[];
  capacity_liters: number;
  crew_count: number;
  estimated_speed_kmh: number;
  last_service?: string;
  specialization: string;
}

export interface Route {
  resource_id: string;
  fire_id: string;
  waypoints: [number, number][];
  distance_km: number;
  eta_minutes: number;
  road_blocked: boolean;
  alternative_route?: [number, number][];
  alternative_distance_km?: number;
  alternative_eta_minutes?: number;
}

export interface AllocationResult {
  fire_id: string;
  recommended_unit: string;
  unit_name: string;
  unit_type: string;
  station_name: string;
  distance_km: number;
  eta_minutes: number;
  explanation: string;
  score: number;
  route: Route;
  fallback_unit?: string;
  fallback_eta_minutes?: number;
}

export interface VerificationResult {
  score: number;
  category: string;
  label: string;
  factors: Record<string, number>;
}

export interface RiskBreakdown {
  fire_intensity: number;
  population_exposure: number;
  spread_risk: number;
  infrastructure_exposure: number;
  wind_conditions: number;
  fire_confidence: number;
  accessibility: number;
  total: number;
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SpreadZone {
  time_label: string;
  center: [number, number];
  radius_km: number;
  direction_bias: number;
  polygon: [number, number][];
}

export interface SpreadPrediction {
  fire_id: string;
  wind_speed: number;
  wind_direction: number;
  zones: SpreadZone[];
  spread_risk: string;
  explanation: string;
}

export interface CandidateResource {
  id: string;
  name: string;
  type: string;
  station_name: string;
  availability: 'AVAILABLE' | 'EN_ROUTE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE';
  distance_km: number;
  eta_minutes: number;
  capability_match: string;
  score: number;
}

export interface IncidentIntelligence {
  fire_id: string;
  fire: FireHotspot;
  verification: VerificationResult;
  risk: RiskBreakdown;
  spread: SpreadPrediction;
  allocation?: AllocationResult;
  suitable_resources?: CandidateResource[];
  context: {
    population_at_risk: number;
    nearby_settlements: string[];
    infrastructure: string[];
    hospitals: string[];
    schools: string[];
    highways: string[];
  };
  demo_mode: boolean;
  road_blocked: boolean;
  disabled_units: string[];
}

export interface TimelineEvent {
  time: string;
  event: string;
  detail: string;
  icon: string;
  fire_id?: string;
}

export interface Alert {
  id: string;
  fire_id: string;
  severity: string;
  title: string;
  location: string;
  confidence: number;
  risk: string;
  risk_score: number;
  population_at_risk: number;
  spread_risk: string;
  recommended_unit: string;
  eta_minutes: number;
  recommended_action: string;
  acknowledged: boolean;
}

export interface SimulationState {
  disabled_units: string[];
  road_blocked: boolean;
  wind_multiplier: number;
  intensity_multiplier: number;
  fire_count: number;
  timeline: TimelineEvent[];
  alerts: Alert[];
}

export type View = 'command-center' | 'analytics' | 'incident-history' | 'what-if';
