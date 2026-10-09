"""
Fire Verification Engine — AI-Assisted Verification Score.
This is an interpretable, deterministic scoring model — not claimed to be ML inference.
"""
from typing import Dict
from app.models.incident import VerificationResult


def calculate_verification(
    satellite_confidence: float,
    frp: float,
    brightness: float = 300.0,
    wind_speed: float = 10.0,
    humidity: float = 50.0,
    land_cover: str = "unknown",
    temporal_consistent: bool = True,
    cloud_risk: float = 0.0,
) -> VerificationResult:
    """
    Calculate AI-assisted verification score.
    Returns a 0–100 score with category and explanatory factors.
    """
    factors: Dict[str, float] = {}

    # 1. Satellite confidence (30 pts max)
    sat_score = min(30.0, satellite_confidence * 0.30)
    factors["satellite_confidence"] = round(sat_score, 1)

    # 2. FRP contribution (25 pts max) — higher FRP = more confident
    frp_normalized = min(1.0, frp / 100.0)
    frp_score = round(frp_normalized * 25.0, 1)
    factors["fire_radiative_power"] = frp_score

    # 3. Brightness temperature (15 pts max)
    # Typical active fire > 310K, very strong > 350K
    bright_score = max(0.0, min(15.0, (brightness - 280.0) / 5.0))
    factors["brightness_temperature"] = round(bright_score, 1)

    # 4. Weather support (15 pts max) — low humidity + high wind = fire-supporting
    weather_support = 0.0
    if humidity < 30:
        weather_support += 8.0
    elif humidity < 50:
        weather_support += 5.0
    else:
        weather_support += 2.0
    if wind_speed > 20:
        weather_support += 7.0
    elif wind_speed > 10:
        weather_support += 4.0
    else:
        weather_support += 1.0
    factors["weather_support"] = round(min(15.0, weather_support), 1)

    # 5. Land cover support (10 pts max)
    land_cover_scores = {
        "forest": 10.0,
        "mixed_vegetation": 9.0,
        "scrubland": 8.0,
        "agricultural": 7.0,
        "bamboo_brake": 8.5,
        "dense_canopy": 9.5,
        "pine_needle_duff": 10.0,
        "water": 0.0,
        "unknown": 4.0,
    }
    land_score = land_cover_scores.get(land_cover, 4.0)
    factors["land_cover_support"] = land_score

    # 6. Temporal consistency bonus (5 pts max)
    temp_score = 5.0 if temporal_consistent else 0.0
    factors["temporal_consistency"] = temp_score

    # 7. Cloud risk penalty (reduces score)
    cloud_penalty = min(10.0, cloud_risk * 0.1)
    factors["cloud_risk_penalty"] = -round(cloud_penalty, 1)

    raw_score = (
        sat_score + frp_score + bright_score + weather_support + land_score + temp_score - cloud_penalty
    )
    score = max(0.0, min(100.0, raw_score))

    # Determine category
    if score >= 85:
        category = "CRITICAL_HIGH_CONFIDENCE"
        label = "CRITICAL / HIGH CONFIDENCE"
    elif score >= 70:
        category = "HIGH_CONFIDENCE"
        label = "HIGH CONFIDENCE"
    elif score >= 40:
        category = "NEEDS_VERIFICATION"
        label = "NEEDS VERIFICATION"
    else:
        category = "LOW_CONFIDENCE"
        label = "LOW CONFIDENCE"

    return VerificationResult(
        score=round(score, 1),
        category=category,
        label=label,
        factors=factors,
    )
