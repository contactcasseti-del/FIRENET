from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.simulation_state import simulation_state
from app.services.resource_optimizer import allocate_resource
from app.services.fire_verification import calculate_verification
from app.services.risk_engine import calculate_risk
from app.services.spread_engine import calculate_spread
from app.models.fire import FireHotspot, FireHotspotCreate
import random
import math

router = APIRouter(prefix="/simulation", tags=["simulation"])


class DisableUnitRequest(BaseModel):
    unit_id: str


class SimulateFireRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence: Optional[float] = None
    frp: Optional[float] = None


@router.post("/disable-unit")
async def disable_unit(req: DisableUnitRequest):
    """Mark a unit as unavailable and recalculate response plan."""
    fire = simulation_state.get_fire("FIRE-101")
    resources = simulation_state.get_resources()

    # Before state
    before_disabled = list(simulation_state.disabled_units)
    before_alloc = allocate_resource(fire, resources, simulation_state.road_blocked, before_disabled)

    simulation_state.disable_unit(req.unit_id)

    # After state
    after_disabled = list(simulation_state.disabled_units)
    after_alloc = allocate_resource(fire, resources, simulation_state.road_blocked, after_disabled)

    simulation_state.add_timeline_event({
        "time": _now(),
        "event": f"Response plan recalculated",
        "detail": f"Unit {req.unit_id} unavailable — {after_alloc.recommended_unit if after_alloc else 'No unit'} now recommended",
        "icon": "recalculate",
        "fire_id": "FIRE-101",
    })

    return {
        "action": "unit_disabled",
        "unit_id": req.unit_id,
        "explanation": f"Response plan recalculated because unit {req.unit_id} became unavailable.",
        "before": {
            "unit": before_alloc.recommended_unit if before_alloc else None,
            "eta_minutes": before_alloc.eta_minutes if before_alloc else None,
            "explanation": before_alloc.explanation if before_alloc else None,
        },
        "after": {
            "unit": after_alloc.recommended_unit if after_alloc else None,
            "eta_minutes": after_alloc.eta_minutes if after_alloc else None,
            "explanation": after_alloc.explanation if after_alloc else None,
            "allocation": after_alloc.model_dump() if after_alloc else None,
        },
    }


@router.post("/enable-unit")
async def enable_unit(req: DisableUnitRequest):
    """Re-enable a previously disabled unit."""
    simulation_state.enable_unit(req.unit_id)
    return {"action": "unit_enabled", "unit_id": req.unit_id}


@router.post("/block-road")
async def block_road():
    """Block primary forest route and recalculate routes."""
    fire = simulation_state.get_fire("FIRE-101")
    resources = simulation_state.get_resources()
    disabled = list(simulation_state.disabled_units)

    before_alloc = allocate_resource(fire, resources, False, disabled)
    simulation_state.block_road()
    after_alloc = allocate_resource(fire, resources, True, disabled)

    simulation_state.add_timeline_event({
        "time": _now(),
        "event": "Forest access trail blocked — alternative firebreak route active",
        "detail": f"Primary forest corridor blocked. New ETA: {after_alloc.eta_minutes:.1f} min via alternative firebreak route",
        "icon": "block",
        "fire_id": "FIRE-101",
    })

    return {
        "action": "road_blocked",
        "explanation": "Primary forest route blocked — alternative firebreak route calculated with updated ETA.",
        "before": {
            "unit": before_alloc.recommended_unit if before_alloc else None,
            "eta_minutes": before_alloc.eta_minutes if before_alloc else None,
            "road_blocked": False,
        },
        "after": {
            "unit": after_alloc.recommended_unit if after_alloc else None,
            "eta_minutes": after_alloc.eta_minutes if after_alloc else None,
            "road_blocked": True,
            "allocation": after_alloc.model_dump() if after_alloc else None,
        },
    }


@router.post("/unblock-road")
async def unblock_road():
    simulation_state.unblock_road()
    return {"action": "road_unblocked"}


@router.post("/increase-wind")
async def increase_wind():
    simulation_state.increase_wind()
    fire = simulation_state.get_fire("FIRE-101")
    spread = calculate_spread(
        latitude=fire.latitude,
        longitude=fire.longitude,
        wind_speed=fire.wind_speed,
        wind_direction=fire.wind_direction,
        frp=fire.frp,
        humidity=fire.humidity,
        temperature=fire.temperature,
        land_cover=fire.land_cover,
        fire_id="FIRE-101",
    )
    return {
        "action": "wind_increased",
        "wind_multiplier": simulation_state.wind_multiplier,
        "new_wind_speed": fire.wind_speed,
        "spread": spread.model_dump(),
    }


@router.post("/increase-intensity")
async def increase_intensity():
    simulation_state.increase_intensity()
    fire = simulation_state.get_fire("FIRE-101")
    verification = calculate_verification(
        satellite_confidence=fire.confidence,
        frp=fire.frp,
        brightness=fire.brightness or 310.0,
        wind_speed=fire.wind_speed,
        humidity=fire.humidity,
        land_cover=fire.land_cover,
    )
    risk = calculate_risk(
        frp=fire.frp,
        confidence=fire.confidence,
        population_at_risk=fire.population_at_risk,
        infrastructure_risk=fire.infrastructure_risk,
        spread_risk=fire.spread_risk,
        wind_speed=fire.wind_speed,
        wind_direction=fire.wind_direction,
    )
    return {
        "action": "intensity_increased",
        "intensity_multiplier": simulation_state.intensity_multiplier,
        "new_frp": fire.frp,
        "verification": verification.model_dump(),
        "risk": risk.model_dump(),
    }


@router.post("/increase-population")
async def increase_population():
    """Simulate population exposure increase around FIRE-101."""
    simulation_state.increase_population()
    fire = simulation_state.get_fire("FIRE-101")
    return {
        "action": "population_increased",
        "new_population": fire.population_at_risk,
        "fire_id": "FIRE-101",
        "explanation": f"Evacuation perimeter expanded. Forest fringe population at risk increased to {fire.population_at_risk:,} people.",
    }


@router.post("/authorize-dispatch")
async def authorize_dispatch():
    """Record human incident commander authorization and unit dispatch."""
    simulation_state.add_timeline_event({
        "time": _now(),
        "event": "Human authorization confirmed",
        "detail": "Forest incident commander authorized dispatch — Unit WF-10 deployed",
        "icon": "check",
        "fire_id": "FIRE-101",
    })
    simulation_state.add_timeline_event({
        "time": _now(),
        "event": "Unit dispatched",
        "detail": "Unit WF-10 (Wildland Fire Engine) en route from Aravalli Range Forest Post",
        "icon": "truck",
        "fire_id": "FIRE-101",
    })
    simulation_state.add_timeline_event({
        "time": _now(),
        "event": "Response monitored",
        "detail": "Real-time forest corridor telemetry active — ETA 6.5 min",
        "icon": "route",
        "fire_id": "FIRE-101",
    })
    return {
        "action": "dispatch_authorized",
        "unit_id": "WF-10",
        "status": "EN_ROUTE",
        "message": "Human authorization logged. Unit WF-10 en route and response actively monitored.",
    }


@router.post("/new-fire")
async def simulate_new_fire(req: SimulateFireRequest):
    """Simulate a new fire detection with full analysis pipeline."""
    import random

    # Use provided or random coords in North India forest belt
    lat = req.latitude or round(random.uniform(27.5, 30.2), 4)
    lon = req.longitude or round(random.uniform(76.5, 79.5), 4)
    conf = req.confidence or round(random.uniform(65, 92), 1)
    frp = req.frp or round(random.uniform(25, 85), 1)

    fire_id = simulation_state.next_fire_id()
    wind_speed = round(random.uniform(12, 32), 1)
    wind_dir = round(random.uniform(160, 240), 0)
    humidity = round(random.uniform(18, 40), 1)
    temp = round(random.uniform(32, 41), 1)
    pop = random.randint(120, 950)

    land_covers = ["forest", "scrubland", "mixed_vegetation"]
    land_cover = random.choice(land_covers)

    verification = calculate_verification(conf, frp, 310.0, wind_speed, humidity, land_cover)
    risk = calculate_risk(
        frp=frp,
        confidence=conf,
        population_at_risk=pop,
        infrastructure_risk="MEDIUM",
        spread_risk="MEDIUM",
        wind_speed=wind_speed,
        wind_direction=wind_dir,
        land_cover=land_cover,
    )
    spread = calculate_spread(lat, lon, wind_speed, wind_dir, frp, humidity, temp, land_cover, fire_id)

    severity = risk.level
    spread_risk_level = spread.spread_risk

    fire_dict = {
        "id": fire_id,
        "latitude": lat,
        "longitude": lon,
        "confidence": conf,
        "frp": frp,
        "brightness": round(frp * 3.5 + 280, 1),
        "satellite": "NOAA-20",
        "instrument": "VIIRS",
        "acquisition_date": "2026-10-09",
        "acquisition_time": _now().replace(":", ""),
        "day_night": "D",
        "land_cover": land_cover,
        "fuel_type": "Dry Deciduous Forest Litter & Scrub",
        "terrain_type": "Foothill Forest Ridge",
        "ecosystem_zone": "Wildlife Habitat Buffer",
        "severity": severity,
        "status": "ACTIVE",
        "population_at_risk": pop,
        "infrastructure_risk": "MEDIUM",
        "spread_risk": spread_risk_level,
        "risk_score": risk.total,
        "verification_score": verification.score,
        "wind_speed": wind_speed,
        "wind_direction": wind_dir,
        "humidity": humidity,
        "temperature": temp,
        "assigned_unit": None,
        "eta_minutes": None,
        "area_name": f"Simulated Forest Hotspot ({lat:.2f}°N, {lon:.2f}°E)",
        "state": "Forest Range",
    }

    simulation_state.add_fire(fire_dict)

    # Allocate resource
    fire_obj = FireHotspot(**fire_dict)
    resources = simulation_state.get_resources()
    disabled = list(simulation_state.disabled_units)
    allocation = allocate_resource(fire_obj, resources, simulation_state.road_blocked, disabled)

    simulation_state.add_timeline_event({
        "time": _now(),
        "event": f"AI-assisted verification: {fire_id}",
        "detail": f"Score {verification.score:.0f}/100 — {verification.label}",
        "icon": "shield",
        "fire_id": fire_id,
    })
    simulation_state.add_timeline_event({
        "time": _now(),
        "event": f"Risk assessed: {fire_id}",
        "detail": f"Risk {risk.total:.0f}/100 — {risk.level}",
        "icon": "alert",
        "fire_id": fire_id,
    })
    if allocation:
        simulation_state.add_timeline_event({
            "time": _now(),
            "event": f"Unit {allocation.recommended_unit} recommended for {fire_id}",
            "detail": allocation.explanation,
            "icon": "truck",
            "fire_id": fire_id,
        })

    return {
        "fire_id": fire_id,
        "fire": fire_dict,
        "verification": verification.model_dump(),
        "risk": risk.model_dump(),
        "spread": spread.model_dump(),
        "allocation": allocation.model_dump() if allocation else None,
    }


@router.post("/reset")
async def reset_scenario():
    """Reset to primary FIRE-101 forest fire demo scenario."""
    simulation_state.reset()
    return {"action": "reset", "message": "Scenario reset to primary FIRE-101 forest fire demo state"}


@router.get("/state")
async def get_state():
    return {
        "disabled_units": list(simulation_state.disabled_units),
        "road_blocked": simulation_state.road_blocked,
        "wind_multiplier": simulation_state.wind_multiplier,
        "intensity_multiplier": simulation_state.intensity_multiplier,
        "fire_count": len(simulation_state._fires),
        "timeline": simulation_state.timeline[-20:],  # last 20 events
        "alerts": simulation_state.alerts,
    }


def _now() -> str:
    from datetime import datetime
    return datetime.now().strftime("%H:%M")
