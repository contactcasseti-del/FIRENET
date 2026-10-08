from fastapi import APIRouter
from app.services.simulation_state import simulation_state

router = APIRouter(prefix="/fires", tags=["fires"])


@router.get("")
async def list_fires():
    fires = simulation_state.get_fires()
    return {
        "demo_mode": True,
        "count": len(fires),
        "fires": [f.model_dump() for f in fires],
    }


@router.get("/{fire_id}")
async def get_fire(fire_id: str):
    fire = simulation_state.get_fire(fire_id)
    if not fire:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Fire {fire_id} not found")
    return fire.model_dump()
