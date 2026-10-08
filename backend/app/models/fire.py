from typing import Optional, List
from pydantic import BaseModel


class FireHotspot(BaseModel):
    id: str
    latitude: float
    longitude: float
    confidence: float
    frp: float
    brightness: Optional[float] = None
    satellite: str = "UNKNOWN"
    instrument: str = "UNKNOWN"
    acquisition_date: str = ""
    acquisition_time: str = ""
    day_night: str = "D"
    land_cover: str = "unknown"
    severity: str = "MEDIUM"
    status: str = "ACTIVE"
    population_at_risk: int = 0
    infrastructure_risk: str = "LOW"
    spread_risk: str = "LOW"
    risk_score: float = 0.0
    verification_score: float = 0.0
    wind_speed: float = 0.0
    wind_direction: float = 0.0
    humidity: float = 50.0
    temperature: float = 30.0
    assigned_unit: Optional[str] = None
    eta_minutes: Optional[float] = None
    area_name: str = "Unknown Area"
    state: str = "Unknown"
    fuel_type: Optional[str] = "Dry Deciduous Forest"
    terrain_type: Optional[str] = "Forest Ridge"
    ecosystem_zone: Optional[str] = "Wildlife Sanctuary Buffer"


class FireHotspotCreate(BaseModel):
    latitude: float
    longitude: float
    confidence: float = 75.0
    frp: float = 30.0
    wind_speed: float = 15.0
    wind_direction: float = 180.0
    humidity: float = 40.0
    temperature: float = 35.0
    land_cover: str = "forest"
    area_name: str = "Simulated Forest Hotspot"
    state: str = "India"
    fuel_type: str = "Dry Deciduous Forest"
    terrain_type: str = "Forest Ridge"
    ecosystem_zone: str = "Wildlife Sanctuary Buffer"
