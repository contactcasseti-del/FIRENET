"""
Spread-Risk Engine.
Generates estimated spread-risk zones for visualization.
NOT scientifically guaranteed fire-spread physics.
Clearly labeled as ESTIMATED SPREAD-RISK.
"""
import math
from typing import List
from app.models.incident import SpreadZone, SpreadPrediction


def _generate_ellipse_polygon(
    center_lat: float,
    center_lon: float,
    radius_km: float,
    wind_direction_deg: float,
    wind_elongation: float = 1.5,
    points: int = 32,
) -> List[List[float]]:
    """
    Generate an approximate elliptical polygon biased in wind direction.
    All coordinates are [lat, lon].
    """
    polygon = []
    R = 6371.0  # Earth radius in km

    for i in range(points):
        angle_deg = (i / points) * 360.0
        angle_rad = math.radians(angle_deg)

        # Ellipse radii: elongated in wind direction
        wind_rad = math.radians(wind_direction_deg)
        # dot product with wind vector
        dot = math.cos(angle_rad) * math.cos(wind_rad) + math.sin(angle_rad) * math.sin(wind_rad)
        effective_radius = radius_km * (1.0 + (wind_elongation - 1.0) * max(0.0, dot))

        # Convert to lat/lon offset
        d_lat = (effective_radius / R) * math.cos(angle_rad) * (180.0 / math.pi)
        d_lon = (
            (effective_radius / R)
            * math.sin(angle_rad)
            * (180.0 / math.pi)
            / math.cos(math.radians(center_lat))
        )

        polygon.append([center_lat + d_lat, center_lon + d_lon])

    # Close polygon
    polygon.append(polygon[0])
    return polygon


def calculate_spread(
    latitude: float,
    longitude: float,
    wind_speed: float,
    wind_direction: float,
    frp: float,
    humidity: float,
    temperature: float,
    land_cover: str = "mixed_vegetation",
    fire_id: str = "UNKNOWN",
) -> SpreadPrediction:
    """
    Calculate estimated spread-risk zones for 0, +15, and +30 minutes.
    Zones expand in approximate wind direction.
    """
    # Base spread rate (km/min) — highly simplified heuristic
    # Higher FRP, lower humidity, higher wind = faster spread
    humidity_factor = max(0.1, (100.0 - humidity) / 100.0)
    wind_factor = max(0.1, wind_speed / 30.0)
    frp_factor = max(0.1, min(2.0, frp / 50.0))

    land_cover_multipliers = {
        "forest": 1.4,
        "mixed_vegetation": 1.2,
        "scrubland": 1.3,
        "agricultural": 1.0,
        "bamboo_brake": 1.35,
        "dense_canopy": 1.45,
        "pine_needle_duff": 1.6,
        "water": 0.0,
        "unknown": 1.0,
    }
    land_mult = land_cover_multipliers.get(land_cover, 1.0)

    base_rate_km_min = 0.08 * humidity_factor * wind_factor * frp_factor * land_mult

    # Wind elongation — how much ellipse stretches in wind direction
    wind_elongation = 1.0 + wind_factor * 0.8

    zones = []

    # Current zone (fire perimeter)
    current_radius = max(0.1, frp / 200.0)  # FRP-proportional current size
    zones.append(
        SpreadZone(
            time_label="CURRENT",
            center=[latitude, longitude],
            radius_km=round(current_radius, 2),
            direction_bias=wind_direction,
            polygon=_generate_ellipse_polygon(
                latitude, longitude, current_radius, wind_direction, 1.2
            ),
        )
    )

    # +15 min zone
    r15 = current_radius + base_rate_km_min * 15
    zones.append(
        SpreadZone(
            time_label="+15 MIN",
            center=[latitude, longitude],
            radius_km=round(r15, 2),
            direction_bias=wind_direction,
            polygon=_generate_ellipse_polygon(
                latitude, longitude, r15, wind_direction, wind_elongation
            ),
        )
    )

    # +30 min zone
    r30 = current_radius + base_rate_km_min * 30
    zones.append(
        SpreadZone(
            time_label="+30 MIN",
            center=[latitude, longitude],
            radius_km=round(r30, 2),
            direction_bias=wind_direction,
            polygon=_generate_ellipse_polygon(
                latitude, longitude, r30, wind_direction, wind_elongation * 1.2
            ),
        )
    )

    # Determine spread risk level
    growth_rate = r30 - current_radius
    if growth_rate > 1.5:
        spread_risk = "HIGH"
    elif growth_rate > 0.7:
        spread_risk = "MEDIUM"
    else:
        spread_risk = "LOW"

    explanation = (
        f"Estimated spread-risk based on wind speed {wind_speed:.0f} km/h from "
        f"{wind_direction:.0f}°, humidity {humidity:.0f}%, and FRP {frp:.1f}. "
        f"Projected {growth_rate:.1f} km expansion over 30 minutes. "
        f"This is an ESTIMATED spread-risk zone, not a guaranteed trajectory."
    )

    return SpreadPrediction(
        fire_id=fire_id,
        wind_speed=wind_speed,
        wind_direction=wind_direction,
        zones=zones,
        spread_risk=spread_risk,
        explanation=explanation,
    )
