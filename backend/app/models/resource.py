from typing import Optional, List
from pydantic import BaseModel


class Station(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    district: str
    state: str
    type: str = "PRIMARY"
    capacity: int = 5
    resources_available: int = 3
    contact: Optional[str] = None


class Resource(BaseModel):
    id: str
    name: str
    type: str
    station_id: str
    station_name: str
    latitude: float
    longitude: float
    availability: str = "AVAILABLE"
    current_status: str = "STANDBY"
    capability: List[str] = []
    capacity_liters: int = 0
    crew_count: int = 0
    estimated_speed_kmh: float = 60.0
    last_service: Optional[str] = None
    specialization: str = "GENERAL"


class Route(BaseModel):
    resource_id: str
    fire_id: str
    waypoints: List[List[float]]
    distance_km: float
    eta_minutes: float
    road_blocked: bool = False
    alternative_route: Optional[List[List[float]]] = None
    alternative_distance_km: Optional[float] = None
    alternative_eta_minutes: Optional[float] = None


class AllocationResult(BaseModel):
    fire_id: str
    recommended_unit: str
    unit_name: str
    unit_type: str
    station_name: str
    distance_km: float
    eta_minutes: float
    explanation: str
    score: float
    route: Route
    fallback_unit: Optional[str] = None
    fallback_eta_minutes: Optional[float] = None
