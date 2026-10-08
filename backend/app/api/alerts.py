from fastapi import APIRouter
from app.services.simulation_state import simulation_state

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("")
async def list_alerts():
    return {"alerts": simulation_state.alerts}


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    for alert in simulation_state.alerts:
        if alert["id"] == alert_id:
            alert["acknowledged"] = True
            return {"acknowledged": True, "alert_id": alert_id}
    return {"acknowledged": False, "error": "Alert not found"}


@router.get("/timeline")
async def get_timeline():
    return {"timeline": simulation_state.timeline}
