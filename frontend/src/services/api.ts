import axios from 'axios';
import type { FireHotspot, Station, Resource, IncidentIntelligence, SimulationState } from '../types';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Fire endpoints
export const fetchFires = async (): Promise<{ fires: FireHotspot[]; demo_mode: boolean }> => {
  const res = await api.get('/fires');
  return res.data;
};

export const fetchFire = async (fireId: string): Promise<FireHotspot> => {
  const res = await api.get(`/fires/${fireId}`);
  return res.data;
};

// Station endpoints
export const fetchStations = async (): Promise<{ stations: Station[] }> => {
  const res = await api.get('/stations');
  return res.data;
};

// Resource endpoints
export const fetchResources = async (): Promise<{ resources: Resource[]; disabled_units: string[] }> => {
  const res = await api.get('/resources');
  return res.data;
};

// Intelligence endpoint
export const fetchIncidentIntelligence = async (fireId: string): Promise<IncidentIntelligence> => {
  const res = await api.get(`/incidents/${fireId}/intelligence`);
  return res.data;
};

// Analytics endpoint
export const fetchAnalytics = async () => {
  const res = await api.get('/analytics');
  return res.data;
};

// Simulation endpoints
export const simulationState = async (): Promise<SimulationState> => {
  const res = await api.get('/simulation/state');
  return res.data;
};

export const disableUnit = async (unitId: string) => {
  const res = await api.post('/simulation/disable-unit', { unit_id: unitId });
  return res.data;
};

export const enableUnit = async (unitId: string) => {
  const res = await api.post('/simulation/enable-unit', { unit_id: unitId });
  return res.data;
};

export const blockRoad = async () => {
  const res = await api.post('/simulation/block-road');
  return res.data;
};

export const unblockRoad = async () => {
  const res = await api.post('/simulation/unblock-road');
  return res.data;
};

export const increaseWind = async () => {
  const res = await api.post('/simulation/increase-wind');
  return res.data;
};

export const increaseIntensity = async () => {
  const res = await api.post('/simulation/increase-intensity');
  return res.data;
};

export const increasePopulation = async () => {
  const res = await api.post('/simulation/increase-population');
  return res.data;
};

export const authorizeDispatch = async () => {
  const res = await api.post('/simulation/authorize-dispatch');
  return res.data;
};

export const simulateNewFire = async () => {
  const res = await api.post('/simulation/new-fire', {});
  return res.data;
};

export const resetScenario = async () => {
  const res = await api.post('/simulation/reset');
  return res.data;
};

export const fetchTimeline = async () => {
  const res = await api.get('/alerts/timeline');
  return res.data;
};

export const fetchAlerts = async () => {
  const res = await api.get('/alerts');
  return res.data;
};
