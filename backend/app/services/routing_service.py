"""
Deterministic routing service.
Uses straight-line distance with realistic road-network multipliers.
Falls back gracefully when external routing APIs are unavailable.
"""
import math
from typing import List, Optional, Tuple
from app.models.resource import Route


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in km."""
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _interpolate_route(
    lat1: float, lon1: float, lat2: float, lon2: float, steps: int = 8
) -> List[List[float]]:
    """Generate waypoints along a slightly curved route for map display."""
    waypoints = []
    for i in range(steps + 1):
        t = i / steps
        # Add slight curve using midpoint displacement
        mid_lat = lat1 + (lat2 - lat1) * t
        mid_lon = lon1 + (lon2 - lon1) * t
        # Slight perpendicular offset in middle
        if 0.2 < t < 0.8:
            perp_offset = math.sin(math.pi * t) * 0.003
            mid_lat += perp_offset
        waypoints.append([mid_lat, mid_lon])
    return waypoints


def _interpolate_alt_route(
    lat1: float, lon1: float, lat2: float, lon2: float, steps: int = 8
) -> List[List[float]]:
    """Alternative route with different deviation."""
    waypoints = []
    for i in range(steps + 1):
        t = i / steps
        mid_lat = lat1 + (lat2 - lat1) * t
        mid_lon = lon1 + (lon2 - lon1) * t
        if 0.2 < t < 0.8:
            perp_offset = -math.sin(math.pi * t) * 0.005
            perp_offset_lon = math.sin(math.pi * t) * 0.004
            mid_lat += perp_offset
            mid_lon += perp_offset_lon
        waypoints.append([mid_lat, mid_lon])
    return waypoints


# Road network multiplier: straight-line to road-network distance ratio
ROAD_NETWORK_MULTIPLIER = 1.35
# Average urban traffic speed factor
URBAN_SPEED_FACTOR = 0.75


def calculate_route(
    resource_lat: float,
    resource_lon: float,
    fire_lat: float,
    fire_lon: float,
    resource_id: str,
    fire_id: str,
    speed_kmh: float = 60.0,
    road_blocked: bool = False,
    blocked_road_penalty_km: float = 4.0,
) -> Route:
    """
    Calculate estimated route and ETA from resource to fire.
    Uses deterministic heuristics — clearly an estimate.
    """
    straight_km = haversine_km(resource_lat, resource_lon, fire_lat, fire_lon)
    road_km = straight_km * ROAD_NETWORK_MULTIPLIER

    effective_speed = speed_kmh * URBAN_SPEED_FACTOR
    eta_minutes = (road_km / effective_speed) * 60.0

    waypoints = _interpolate_route(resource_lat, resource_lon, fire_lat, fire_lon)

    alt_distance = None
    alt_eta = None
    alt_waypoints = None

    if road_blocked:
        # Add distance penalty for road blockage
        road_km += blocked_road_penalty_km
        eta_minutes = (road_km / effective_speed) * 60.0
        alt_distance = road_km + blocked_road_penalty_km * 0.5
        alt_eta = (alt_distance / effective_speed) * 60.0
        alt_waypoints = _interpolate_alt_route(resource_lat, resource_lon, fire_lat, fire_lon)

    return Route(
        resource_id=resource_id,
        fire_id=fire_id,
        waypoints=waypoints,
        distance_km=round(road_km, 2),
        eta_minutes=round(eta_minutes, 1),
        road_blocked=road_blocked,
        alternative_route=alt_waypoints,
        alternative_distance_km=round(alt_distance, 2) if alt_distance else None,
        alternative_eta_minutes=round(alt_eta, 1) if alt_eta else None,
    )
