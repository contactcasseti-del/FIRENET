from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class RiskBreakdown(BaseModel):
    fire_intensity: float
    population_exposure: float
    spread_risk: float
    infrastructure_exposure: float
    wind_conditions: float
    fire_confidence: float
    accessibility: float
    total: float
    level: str


class VerificationResult(BaseModel):
    score: float
    category: str
    label: str
    factors: Dict[str, float]


class SpreadZone(BaseModel):
    time_label: str
    center: List[float]
    radius_km: float
    direction_bias: float
    polygon: List[List[float]]


class SpreadPrediction(BaseModel):
    fire_id: str
    wind_speed: float
    wind_direction: float
    zones: List[SpreadZone]
    spread_risk: str
    explanation: str


class IncidentIntelligence(BaseModel):
    fire_id: str
    severity: str
    verification: VerificationResult
    risk: RiskBreakdown
    spread: SpreadPrediction
    nearby_population: int
    nearby_infrastructure: List[str]
    nearby_hospitals: List[str]
    nearby_schools: List[str]
    highways: List[str]


class TimelineEvent(BaseModel):
    timestamp: str
    event: str
    detail: str
    icon: str = "info"


class WhatIfResult(BaseModel):
    scenario: str
    before: Dict[str, Any]
    after: Dict[str, Any]
    explanation: str
    timeline_events: List[TimelineEvent]
