"""
Risk Engine — Transparent, weighted risk scoring.
Weights are configurable and displayed to end users for explainability.
"""
from app.models.incident import RiskBreakdown

# Default weights (must sum to 1.0)
DEFAULT_WEIGHTS = {
    "fire_intensity": 0.25,
    "population_exposure": 0.20,
    "spread_risk": 0.15,
    "infrastructure_exposure": 0.15,
    "wind_conditions": 0.10,
    "fire_confidence": 0.10,
    "accessibility": 0.05,
}


def _spread_risk_to_float(spread_risk: str) -> float:
    mapping = {"HIGH": 1.0, "MEDIUM": 0.6, "LOW": 0.3, "VERY_LOW": 0.1}
    return mapping.get(spread_risk.upper(), 0.5)


def _infra_risk_to_float(infra_risk: str) -> float:
    mapping = {"HIGH": 1.0, "MEDIUM": 0.6, "LOW": 0.3, "VERY_LOW": 0.1}
    return mapping.get(infra_risk.upper(), 0.5)


def calculate_risk(
    frp: float,
    confidence: float,
    population_at_risk: int,
    infrastructure_risk: str,
    spread_risk: str,
    wind_speed: float,
    wind_direction: float,
    land_cover: str = "unknown",
    eta_minutes: float = 15.0,
    weights: dict = None,
) -> RiskBreakdown:
    """
    Calculate weighted risk score.
    Each component is scored 0–100 and then weighted.
    Final score is 0–100.
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS

    # --- Fire Intensity (FRP-based) ---
    # FRP range 0–150 typical for significant events
    intensity_raw = min(100.0, (frp / 100.0) * 100.0)
    fire_intensity_score = intensity_raw * weights["fire_intensity"]

    # --- Population Exposure ---
    # Scale: 0 = 0, 5000+ = 100
    pop_raw = min(100.0, (population_at_risk / 5000.0) * 100.0)
    population_score = pop_raw * weights["population_exposure"]

    # --- Spread Risk ---
    spread_raw = _spread_risk_to_float(spread_risk) * 100.0
    spread_score = spread_raw * weights["spread_risk"]

    # --- Infrastructure Exposure ---
    infra_raw = _infra_risk_to_float(infrastructure_risk) * 100.0
    infra_score = infra_raw * weights["infrastructure_exposure"]

    # --- Wind Conditions ---
    # Wind above 30 km/h is very high risk
    wind_raw = min(100.0, (wind_speed / 30.0) * 100.0)
    wind_score = wind_raw * weights["wind_conditions"]

    # --- Fire Confidence ---
    conf_score = (confidence / 100.0) * 100.0 * weights["fire_confidence"]

    # --- Accessibility ---
    # Lower ETA = better accessibility = lower risk penalty
    # ETA 0–5 min = great access (score 0), 30+ min = poor access (score 100)
    access_raw = min(100.0, (eta_minutes / 30.0) * 100.0)
    access_score = access_raw * weights["accessibility"]

    total = (
        fire_intensity_score
        + population_score
        + spread_score
        + infra_score
        + wind_score
        + conf_score
        + access_score
    )
    total = max(0.0, min(100.0, total))

    # Determine level
    if total >= 85:
        level = "CRITICAL"
    elif total >= 70:
        level = "HIGH"
    elif total >= 45:
        level = "MEDIUM"
    else:
        level = "LOW"

    return RiskBreakdown(
        fire_intensity=round(fire_intensity_score, 1),
        population_exposure=round(population_score, 1),
        spread_risk=round(spread_score, 1),
        infrastructure_exposure=round(infra_score, 1),
        wind_conditions=round(wind_score, 1),
        fire_confidence=round(conf_score, 1),
        accessibility=round(access_score, 1),
        total=round(total, 1),
        level=level,
    )
