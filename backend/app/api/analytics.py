from fastapi import APIRouter
from app.services.simulation_state import simulation_state

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("")
async def get_analytics():
    fires = simulation_state.get_fires()
    resources = simulation_state.get_resources()

    total = len(fires)
    critical = sum(1 for f in fires if f.severity == "CRITICAL")
    high = sum(1 for f in fires if f.severity == "HIGH")
    medium = sum(1 for f in fires if f.severity == "MEDIUM")
    low = sum(1 for f in fires if f.severity == "LOW")
    active = sum(1 for f in fires if f.status == "ACTIVE")
    monitoring = sum(1 for f in fires if f.status == "MONITORING")

    verified = sum(1 for f in fires if f.verification_score >= 70)
    suspected = sum(1 for f in fires if f.verification_score < 70)

    resources_available = sum(1 for r in resources if r.availability == "AVAILABLE")
    resources_deployed = sum(1 for r in resources if r.availability in ("EN_ROUTE", "BUSY"))
    resources_offline = sum(1 for r in resources if r.availability in ("OFFLINE", "MAINTENANCE"))

    total_pop = sum(f.population_at_risk for f in fires if f.status == "ACTIVE")

    avg_eta = None
    etas = [f.eta_minutes for f in fires if f.eta_minutes is not None]
    if etas:
        avg_eta = round(sum(etas) / len(etas), 1)

    # Fires by hour (synthetic distribution)
    fires_by_hour = [
        {"hour": "08:00", "count": 1},
        {"hour": "09:00", "count": 2},
        {"hour": "10:00", "count": 1},
        {"hour": "11:00", "count": 0},
        {"hour": "12:00", "count": 1},
        {"hour": "13:00", "count": 2},
        {"hour": "14:00", "count": 4},
        {"hour": "15:00", "count": total - 11},
    ]

    risk_distribution = [
        {"level": "CRITICAL", "count": critical},
        {"level": "HIGH", "count": high},
        {"level": "MEDIUM", "count": medium},
        {"level": "LOW", "count": low},
    ]

    severity_distribution = [
        {"name": "Critical", "value": critical},
        {"name": "High", "value": high},
        {"name": "Medium", "value": medium},
        {"name": "Low", "value": low},
    ]

    resource_utilization = [
        {"name": "Available", "value": resources_available},
        {"name": "Deployed", "value": resources_deployed},
        {"name": "Offline", "value": resources_offline},
        {"name": "Disabled", "value": len(simulation_state.disabled_units)},
    ]

    response_times = [
        {"unit": f.assigned_unit, "eta": round(f.eta_minutes, 1)}
        for f in fires if f.eta_minutes and f.assigned_unit
    ]

    population_by_incident = [
        {
            "incident": f.id,
            "label": f"{f.id} ({f.area_name.split(' ')[0]})",
            "population": f.population_at_risk,
            "severity": f.severity,
        }
        for f in sorted(fires, key=lambda x: x.population_at_risk, reverse=True)
        if f.status == "ACTIVE"
    ]

    return {
        "summary": {
            "total_fires": total,
            "active_fires": active,
            "monitoring": monitoring,
            "critical_fires": critical,
            "high_fires": high,
            "medium_fires": medium,
            "low_fires": low,
            "verified_fires": verified,
            "suspected_alerts": suspected,
            "average_response_eta": avg_eta,
            "resources_available": resources_available,
            "resources_deployed": resources_deployed,
            "resources_offline": resources_offline,
            "population_at_risk": total_pop,
        },
        "charts": {
            "fires_by_hour": fires_by_hour,
            "risk_distribution": risk_distribution,
            "severity_distribution": severity_distribution,
            "resource_utilization": resource_utilization,
            "response_times": response_times,
            "population_by_incident": population_by_incident,
        },
    }
