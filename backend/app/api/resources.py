from fastapi import APIRouter
from app.services.simulation_state import simulation_state

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("")
async def list_resources():
    resources = simulation_state.get_resources()
    disabled = simulation_state.disabled_units
    result = []
    for r in resources:
        d = r.model_dump()
        if r.id in disabled:
            d["availability"] = "OFFLINE"
            d["current_status"] = "UNAVAILABLE"
        result.append(d)
    return {
        "count": len(result),
        "resources": result,
        "disabled_units": list(disabled),
    }
