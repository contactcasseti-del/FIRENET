from fastapi import APIRouter, Query
from typing import Optional
from app.services.simulation_state import simulation_state
from app.services.resource_optimizer import allocate_resource, allocate_all_resources, get_candidate_resources
from app.services.routing_service import calculate_route
from app.services.fire_verification import calculate_verification
from app.services.risk_engine import calculate_risk
from app.services.spread_engine import calculate_spread
from app.services.population_service import get_nearby_context

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("/{fire_id}/intelligence")
async def get_incident_intelligence(fire_id: str):
    """Full incident intelligence: verification, risk, spread, resources, context."""
    fire = simulation_state.get_fire(fire_id)
    if not fire:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Fire {fire_id} not found")

    resources = simulation_state.get_resources()
    disabled = list(simulation_state.disabled_units)
    road_blocked = simulation_state.road_blocked

    # Verification
    verification = calculate_verification(
        satellite_confidence=fire.confidence,
        frp=fire.frp,
        brightness=fire.brightness or 310.0,
        wind_speed=fire.wind_speed,
        humidity=fire.humidity,
        land_cover=fire.land_cover,
    )

    # Resource allocation
    allocation = allocate_resource(fire, resources, road_blocked, disabled)
    eta = allocation.eta_minutes if allocation else 20.0

    # Candidate resources evaluation
    suitable_resources = get_candidate_resources(fire, resources, road_blocked, disabled)

    # Risk
    risk = calculate_risk(
        frp=fire.frp,
        confidence=fire.confidence,
        population_at_risk=fire.population_at_risk,
        infrastructure_risk=fire.infrastructure_risk,
        spread_risk=fire.spread_risk,
        wind_speed=fire.wind_speed,
        wind_direction=fire.wind_direction,
        land_cover=fire.land_cover,
        eta_minutes=eta,
    )

    # Spread
    spread = calculate_spread(
        latitude=fire.latitude,
        longitude=fire.longitude,
        wind_speed=fire.wind_speed,
        wind_direction=fire.wind_direction,
        frp=fire.frp,
        humidity=fire.humidity,
        temperature=fire.temperature,
        land_cover=fire.land_cover,
        fire_id=fire_id,
    )

    # Context
    context = get_nearby_context(fire.latitude, fire.longitude)

    return {
        "fire_id": fire_id,
        "fire": fire.model_dump(),
        "verification": verification.model_dump(),
        "risk": risk.model_dump(),
        "spread": spread.model_dump(),
        "allocation": allocation.model_dump() if allocation else None,
        "suitable_resources": suitable_resources,
        "context": context,
        "demo_mode": True,
        "road_blocked": road_blocked,
        "disabled_units": disabled,
    }


@router.get("/{fire_id}/allocation")
async def get_allocation(fire_id: str):
    """Get resource allocation recommendation for a fire."""
    fire = simulation_state.get_fire(fire_id)
    if not fire:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Fire {fire_id} not found")

    resources = simulation_state.get_resources()
    disabled = list(simulation_state.disabled_units)
    road_blocked = simulation_state.road_blocked

    allocation = allocate_resource(fire, resources, road_blocked, disabled)
    if not allocation:
        return {"error": "No available resources", "fire_id": fire_id}

    return allocation.model_dump()


@router.get("/allocations/all")
async def get_all_allocations():
    """Get resource allocations for all active fires."""
    fires = [f for f in simulation_state.get_fires() if f.status == "ACTIVE"]
    resources = simulation_state.get_resources()
    disabled = list(simulation_state.disabled_units)
    road_blocked = simulation_state.road_blocked

    allocations = allocate_all_resources(fires, resources, disabled, road_blocked)
    return {
        "allocations": {k: v.model_dump() for k, v in allocations.items()},
        "disabled_units": disabled,
        "road_blocked": road_blocked,
    }
