"""
State management for simulation scenarios.
Shared in-memory state for the demo.
"""
import json
import copy
from pathlib import Path
from typing import List, Dict, Any, Set, Optional
from app.models.fire import FireHotspot
from app.models.resource import Resource, Station

DATA_DIR = Path(__file__).parent.parent / "data"

# Load initial demo data
def _load_json(filename: str) -> list:
    path = DATA_DIR / filename
    with open(path) as f:
        return json.load(f)


_INITIAL_FIRES = _load_json("demo_fires.json")
_INITIAL_STATIONS = _load_json("demo_stations.json")
_INITIAL_RESOURCES = _load_json("demo_resources.json")


class SimulationState:
    def __init__(self):
        self._fires: List[dict] = copy.deepcopy(_INITIAL_FIRES)
        self._resources: List[dict] = copy.deepcopy(_INITIAL_RESOURCES)
        self._stations: List[dict] = copy.deepcopy(_INITIAL_STATIONS)
        self.disabled_units: Set[str] = set()
        self.road_blocked: bool = False
        self.wind_multiplier: float = 1.0
        self.intensity_multiplier: float = 1.0
        self._counter: int = 210
        self.timeline: List[dict] = self._initial_timeline()
        self.alerts: List[dict] = self._initial_alerts()

    def _initial_timeline(self) -> List[dict]:
        return [
            {"time": "14:32", "event": "Fire detected", "detail": "NOAA-20 VIIRS satellite detected thermal anomaly at 28.32°N, 77.18°E in Aravalli Forest", "icon": "satellite", "fire_id": "FIRE-201"},
            {"time": "14:33", "event": "Incident verified", "detail": "Sensor verification confirmed thermal anomaly in dry deciduous cover (Confidence 94%)", "icon": "shield", "fire_id": "FIRE-201"},
            {"time": "14:34", "event": "Risk calculated", "detail": "Composite forest fire risk score calculated: 92/100", "icon": "alert", "fire_id": "FIRE-201"},
            {"time": "14:34", "event": "Fire severity classified", "detail": "Classified as CRITICAL severity (dry leaf fuel & wildlife corridor buffer)", "icon": "fire", "fire_id": "FIRE-201"},
            {"time": "14:35", "event": "Fire spread estimated", "detail": "Simulated spread envelope: +15m (1.8 km) and +30m (3.4 km) projected downwind", "icon": "wind", "fire_id": "FIRE-201"},
            {"time": "14:35", "event": "Resource recommended", "detail": "Unit WF-10 (Wildland Fire Engine) matched with lowest response cost", "icon": "truck", "fire_id": "FIRE-201"},
            {"time": "14:36", "event": "Route optimized", "detail": "Primary forest ridge trail cleared (ETA 6.5 min)", "icon": "route", "fire_id": "FIRE-201"},
            {"time": "14:37", "event": "Human authorization pending", "detail": "Forest division incident commander review required before dispatch", "icon": "user", "fire_id": "FIRE-201"},
        ]

    def _initial_alerts(self) -> List[dict]:
        return [
            {
                "id": "ALERT-001",
                "fire_id": "FIRE-201",
                "severity": "CRITICAL",
                "title": "CRITICAL FOREST FIRE ALERT",
                "location": "28.32°N, 77.18°E — Aravalli Forest Region, Haryana",
                "confidence": 94,
                "risk": "CRITICAL",
                "risk_score": 92,
                "population_at_risk": 640,
                "spread_risk": "HIGH",
                "recommended_unit": "WF-10",
                "eta_minutes": 6.5,
                "recommended_action": "HUMAN AUTHORIZATION REQUIRED",
                "acknowledged": False,
            }
        ]

    def get_fires(self) -> List[FireHotspot]:
        result = []
        for f in self._fires:
            fire = FireHotspot(**f)
            # Apply multipliers
            if self.wind_multiplier != 1.0:
                fire.wind_speed = min(60.0, fire.wind_speed * self.wind_multiplier)
            if self.intensity_multiplier != 1.0:
                fire.frp = min(200.0, fire.frp * self.intensity_multiplier)
                fire.confidence = min(99.0, fire.confidence * min(1.1, self.intensity_multiplier))
            result.append(fire)
        return result

    def get_resources(self) -> List[Resource]:
        return [Resource(**r) for r in self._resources]

    def get_stations(self) -> List[Station]:
        return [Station(**s) for s in self._stations]

    def get_fire(self, fire_id: str) -> Optional[FireHotspot]:
        for f in self._fires:
            if f["id"] == fire_id:
                fire = FireHotspot(**f)
                if self.wind_multiplier != 1.0:
                    fire.wind_speed = min(60.0, fire.wind_speed * self.wind_multiplier)
                if self.intensity_multiplier != 1.0:
                    fire.frp = min(200.0, fire.frp * self.intensity_multiplier)
                return fire
        return None

    def disable_unit(self, unit_id: str) -> bool:
        self.disabled_units.add(unit_id)
        self.timeline.append({
            "time": _now_time(),
            "event": f"Unit {unit_id} marked unavailable",
            "detail": f"Response plan recalculated — standby fallback unit matched",
            "icon": "alert",
            "fire_id": None,
        })
        return True

    def enable_unit(self, unit_id: str):
        self.disabled_units.discard(unit_id)

    def block_road(self):
        self.road_blocked = True
        self.timeline.append({
            "time": _now_time(),
            "event": "Response corridor blocked",
            "detail": "Primary route blocked — alternative bypass route calculated",
            "icon": "block",
            "fire_id": None,
        })

    def unblock_road(self):
        self.road_blocked = False

    def increase_wind(self):
        self.wind_multiplier = min(3.0, self.wind_multiplier + 0.5)
        self.timeline.append({
            "time": _now_time(),
            "event": "Fire spread escalated",
            "detail": f"Wind speed multiplier now {self.wind_multiplier:.1f}x — spread-risk zone expanded",
            "icon": "wind",
            "fire_id": None,
        })

    def increase_intensity(self):
        self.intensity_multiplier = min(2.5, self.intensity_multiplier + 0.4)
        self.timeline.append({
            "time": _now_time(),
            "event": "Fire severity escalated",
            "detail": f"FRP multiplier now {self.intensity_multiplier:.1f}x — risk score updated",
            "icon": "fire",
            "fire_id": None,
        })

    def increase_population(self):
        for f in self._fires:
            if f["id"] == "FIRE-201":
                f["population_at_risk"] = int(f["population_at_risk"] * 1.6)
                break
        self.timeline.append({
            "time": _now_time(),
            "event": "Population exposure increased",
            "detail": "Nearby forest fringe evacuation perimeter expanded — population exposure escalated",
            "icon": "alert",
            "fire_id": "FIRE-201",
        })

    def add_fire(self, fire_dict: dict):
        self._fires.append(fire_dict)
        self.timeline.append({
            "time": _now_time(),
            "event": f"New fire incident detected: {fire_dict['id']}",
            "detail": f"Satellite detection at {fire_dict['latitude']:.2f}°N, {fire_dict['longitude']:.2f}°E",
            "icon": "fire",
            "fire_id": fire_dict["id"],
        })

    def add_timeline_event(self, event: dict):
        self.timeline.append(event)

    def add_alert(self, alert: dict):
        self.alerts.append(alert)

    def reset(self):
        self._fires = copy.deepcopy(_INITIAL_FIRES)
        self._resources = copy.deepcopy(_INITIAL_RESOURCES)
        self._stations = copy.deepcopy(_INITIAL_STATIONS)
        self.disabled_units = set()
        self.road_blocked = False
        self.wind_multiplier = 1.0
        self.intensity_multiplier = 1.0
        self._counter = 200
        self.timeline = self._initial_timeline()
        self.alerts = self._initial_alerts()

    def next_fire_id(self) -> str:
        self._counter += 1
        return f"FIRE-{self._counter}"


def _now_time() -> str:
    from datetime import datetime
    return datetime.now().strftime("%H:%M")


# Global simulation state singleton
simulation_state = SimulationState()
