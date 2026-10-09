"""
Resource Optimizer — Core differentiator.
Selects the best available and suitable resource for an incident.
Does NOT simply select nearest station.
Uses weighted scoring considering incident risk, resource capability, and constraints.
"""
from typing import List, Optional, Dict, Any
from app.models.resource import Resource, AllocationResult
from app.models.fire import FireHotspot
from app.services.routing_service import calculate_route, haversine_km


# Capability-incident type matching for forest and wildland fires
INCIDENT_CAPABILITY_REQUIREMENTS = {
    "CRITICAL": {"wildland_suppression": 2.0, "fire_suppression": 1.5, "rough_terrain": 1.5, "aerial_firefighting": 1.5, "forest_pumping": 1.4},
    "HIGH": {"wildland_suppression": 1.8, "fire_suppression": 1.2, "rough_terrain": 1.2, "rapid_containment": 1.2, "water_supply": 1.2},
    "MEDIUM": {"wildland_suppression": 1.0, "rapid_containment": 1.0, "trail_reconnaissance": 1.0},
    "LOW": {"trail_reconnaissance": 0.8, "wildland_suppression": 0.5},
}

LAND_COVER_CAPABILITY = {
    "forest": {"wildland_suppression": 2.0, "rough_terrain": 1.8, "aerial_firefighting": 1.6, "forest_pumping": 1.5, "hand_line_cutting": 1.4},
    "scrubland": {"wildland_suppression": 1.5, "rapid_containment": 1.4, "rough_terrain": 1.2},
    "mixed_vegetation": {"wildland_suppression": 1.4, "water_supply": 1.2},
    "agricultural": {"water_supply": 1.5, "wildland_suppression": 1.0},
    "forest_fringe": {"wildland_suppression": 1.2, "rapid_containment": 1.0},
}

HIGH_POPULATION_CAPABILITIES = {"wildland_rescue", "rapid_containment", "evacuation"}


def _capability_score(resource: Resource, fire: FireHotspot) -> float:
    """Score a firefighting resource's capability match to the incident."""
    required = INCIDENT_CAPABILITY_REQUIREMENTS.get(fire.severity, {})
    land_req = LAND_COVER_CAPABILITY.get(fire.land_cover, {})
    all_req = {**required, **land_req}

    score = 0.0
    for cap, weight in all_req.items():
        if cap in resource.capability:
            score += weight

    # High population exposure bonus for fire rescue / rapid containment
    if fire.population_at_risk > 1000:
        for cap in HIGH_POPULATION_CAPABILITIES:
            if cap in resource.capability:
                score += 0.5

    return score


def _availability_score(resource: Resource) -> float:
    """Returns 0 for unavailable, penalty for non-ideal."""
    if resource.availability == "AVAILABLE":
        return 1.0
    elif resource.availability == "EN_ROUTE":
        return 0.3
    else:
        return 0.0  # BUSY, MAINTENANCE, OFFLINE


def score_resource(
    resource: Resource,
    fire: FireHotspot,
    road_blocked: bool = False,
    disabled_units: List[str] = None,
) -> float:
    """
    Composite score for resource-incident match.
    Higher score = better assignment.
    Returns -1.0 if unavailable/disabled.
    """
    if disabled_units and resource.id in disabled_units:
        return -1.0

    avail = _availability_score(resource)
    if avail == 0.0:
        return -1.0

    # Distance component (0–1, inversely proportional, max 120 km)
    dist_km = haversine_km(resource.latitude, resource.longitude, fire.latitude, fire.longitude)
    dist_score = max(0.0, 1.0 - dist_km / 120.0)

    # Apply road blocked penalty
    if road_blocked:
        dist_score *= 0.7

    # ETA score: prefer low ETA
    speed_eff = resource.estimated_speed_kmh * 0.75
    eta = (dist_km * 1.35 / speed_eff) * 60.0
    eta_score = max(0.0, 1.0 - eta / 90.0)  # Penalty beyond 90 min

    # Capability score
    cap_score = _capability_score(resource, fire) / 5.0  # normalize

    # Risk-weighted priority: higher risk fire needs better match
    risk_weight = fire.risk_score / 100.0

    # Composite
    composite = (
        0.30 * dist_score
        + 0.30 * eta_score
        + 0.25 * cap_score
        + 0.10 * avail
        + 0.05 * risk_weight
    )

    return round(composite, 4)


def allocate_resource(
    fire: FireHotspot,
    resources: List[Resource],
    road_blocked: bool = False,
    disabled_units: List[str] = None,
) -> Optional[AllocationResult]:
    """
    Select the best available resource for a fire incident.
    Returns AllocationResult with explanation.
    """
    if disabled_units is None:
        disabled_units = []

    scores = []
    for resource in resources:
        s = score_resource(resource, fire, road_blocked, disabled_units)
        if s > 0:
            scores.append((s, resource))

    if not scores:
        return None

    scores.sort(key=lambda x: x[0], reverse=True)
    best_score, best_resource = scores[0]

    # Calculate route
    route = calculate_route(
        resource_lat=best_resource.latitude,
        resource_lon=best_resource.longitude,
        fire_lat=fire.latitude,
        fire_lon=fire.longitude,
        resource_id=best_resource.id,
        fire_id=fire.id,
        speed_kmh=best_resource.estimated_speed_kmh,
        road_blocked=road_blocked,
    )

    # Find fallback
    fallback_unit = None
    fallback_eta = None
    if len(scores) > 1:
        _, fallback_resource = scores[1]
        fallback_route = calculate_route(
            resource_lat=fallback_resource.latitude,
            resource_lon=fallback_resource.longitude,
            fire_lat=fire.latitude,
            fire_lon=fire.longitude,
            resource_id=fallback_resource.id,
            fire_id=fire.id,
            speed_kmh=fallback_resource.estimated_speed_kmh,
            road_blocked=road_blocked,
        )
        fallback_unit = fallback_resource.id
        fallback_eta = fallback_route.eta_minutes

    # Build explanation
    reasons = []
    if best_resource.availability == "AVAILABLE":
        reasons.append("is available")
    cap_match = _capability_score(best_resource, fire)
    if cap_match > 2.0:
        reasons.append("has strong capability match for this incident type")
    elif cap_match > 0:
        reasons.append("has adequate capability for this incident")
    dist_km = haversine_km(best_resource.latitude, best_resource.longitude, fire.latitude, fire.longitude)
    reasons.append(f"provides the lowest weighted response cost ({dist_km:.1f} km, ETA {route.eta_minutes:.1f} min)")
    if road_blocked:
        reasons.append("route accounts for road blockage")
    if disabled_units:
        reasons.append(f"selected after {', '.join(disabled_units)} became unavailable")

    explanation = f"Unit {best_resource.id} was recommended because it " + ", and ".join(reasons) + "."

    return AllocationResult(
        fire_id=fire.id,
        recommended_unit=best_resource.id,
        unit_name=best_resource.name,
        unit_type=best_resource.type,
        station_name=best_resource.station_name,
        distance_km=route.distance_km,
        eta_minutes=route.eta_minutes,
        explanation=explanation,
        score=best_score,
        route=route,
        fallback_unit=fallback_unit,
        fallback_eta_minutes=fallback_eta,
    )


def allocate_all_resources(
    fires: List[FireHotspot],
    resources: List[Resource],
    disabled_units: List[str] = None,
    road_blocked: bool = False,
) -> Dict[str, AllocationResult]:
    """
    Multi-fire resource allocation.
    Greedy assignment sorted by risk score (highest risk first).
    Each resource can only be assigned once.
    """
    if disabled_units is None:
        disabled_units = []

    sorted_fires = sorted(fires, key=lambda f: f.risk_score, reverse=True)
    assigned_units = set(disabled_units)
    results = {}

    for fire in sorted_fires:
        if fire.status not in ("ACTIVE",):
            continue
        available = [r for r in resources if r.id not in assigned_units]
        result = allocate_resource(fire, available, road_blocked, list(assigned_units))
        if result:
            results[fire.id] = result
            assigned_units.add(result.recommended_unit)

    return results


def get_candidate_resources(
    fire: FireHotspot,
    resources: List[Resource],
    road_blocked: bool = False,
    disabled_units: List[str] = None,
) -> List[Dict[str, Any]]:
    """
    Evaluate all available and standby firefighting resources for an incident.
    Returns structured unit evaluation records for display in decision support panel.
    """
    if disabled_units is None:
        disabled_units = []

    candidates = []
    friendly_type_map = {
        "WILDLAND_FIRE_ENGINE": "Wildland Fire Engine",
        "FOREST_WATER_BOWSER": "Forest Water Bowser",
        "FOREST_FIREFIGHTING_TEAM": "Forest Firefighting Crew",
        "FOREST_PATROL_UNIT": "Forest Patrol QRT",
        "WILDLAND_RESCUE_TEAM": "Wildland Rescue Team",
        "AERIAL_FIRE_SUPPORT": "Aerial Fire Support",
        "FIRE_ENGINE": "Wildland Fire Engine",
        "WATER_TANKER": "Forest Water Bowser",
        "RESCUE_UNIT": "Wildland Rescue Team",
        "AERIAL_LADDER_UNIT": "Aerial Fire Support",
        "HAZMAT_UNIT": "Forest Patrol QRT",
        "SUPPORT_UNIT": "Forest Firefighting Crew",
    }

    for r in resources:
        dist_km = haversine_km(r.latitude, r.longitude, fire.latitude, fire.longitude)
        if road_blocked:
            speed_eff = r.estimated_speed_kmh * 0.55
            dist_eff = dist_km * 1.65
        else:
            speed_eff = r.estimated_speed_kmh * 0.75
            dist_eff = dist_km * 1.35
        eta = max(1.0, (dist_eff / max(20.0, speed_eff)) * 60.0)

        cap_score = _capability_score(r, fire)
        if cap_score >= 2.0:
            cap_match = "Optimal Match"
        elif cap_score >= 1.0:
            cap_match = "Suitable Match"
        else:
            cap_match = "Secondary Match"

        is_disabled = r.id in disabled_units
        avail = "OFFLINE" if is_disabled else r.availability
        score = score_resource(r, fire, road_blocked, disabled_units)

        candidates.append({
            "id": r.id,
            "name": r.name,
            "type": friendly_type_map.get(r.type, r.type.replace("_", " ").title()),
            "station_name": r.station_name,
            "availability": avail,
            "distance_km": round(dist_km, 1),
            "eta_minutes": round(eta, 1),
            "capability_match": cap_match,
            "score": score,
        })

    # Sort available candidates with positive scores first, then by score descending
    candidates.sort(key=lambda x: (x["score"] > 0, x["score"]), reverse=True)
    return candidates
