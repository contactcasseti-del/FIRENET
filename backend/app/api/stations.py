from fastapi import APIRouter
from app.services.simulation_state import simulation_state

router = APIRouter(prefix="/stations", tags=["stations"])


@router.get("")
async def list_stations():
    stations = simulation_state.get_stations()
    return {
        "count": len(stations),
        "stations": [s.model_dump() for s in stations],
    }
