"""
NASA FIRMS adapter — graceful fallback to demo data when API key is missing.
"""
import httpx
from typing import List, Optional
from app.models.fire import FireHotspot
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)

FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"


async def fetch_firms_data(
    lat_min: float = 27.0,
    lat_max: float = 30.0,
    lon_min: float = 76.0,
    lon_max: float = 78.5,
    days: int = 1,
    source: str = "VIIRS_SNPP_NRT",
) -> tuple[List[dict], bool]:
    """
    Fetch data from NASA FIRMS API.
    Returns (data, is_live) tuple.
    Falls back gracefully if API key is missing or request fails.
    """
    settings = get_settings()

    if not settings.nasa_firms_map_key:
        logger.info("NASA_FIRMS_MAP_KEY not set — using demo data")
        return [], False

    url = f"{FIRMS_BASE_URL}/{settings.nasa_firms_map_key}/{source}/{lon_min},{lat_min},{lon_max},{lat_max}/{days}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()

        # Parse CSV response
        lines = response.text.strip().split("\n")
        if len(lines) < 2:
            return [], False

        headers = [h.strip() for h in lines[0].split(",")]
        records = []
        for line in lines[1:]:
            values = [v.strip() for v in line.split(",")]
            if len(values) == len(headers):
                records.append(dict(zip(headers, values)))

        logger.info(f"Fetched {len(records)} records from NASA FIRMS")
        return records, True

    except Exception as e:
        logger.warning(f"NASA FIRMS fetch failed: {e} — falling back to demo data")
        return [], False


def firms_record_to_hotspot(record: dict, index: int) -> Optional[FireHotspot]:
    """Convert a FIRMS CSV record to a FireHotspot."""
    try:
        return FireHotspot(
            id=f"FIRMS-{index:04d}",
            latitude=float(record.get("latitude", 0)),
            longitude=float(record.get("longitude", 0)),
            confidence=float(record.get("confidence", 50)) if record.get("confidence", "").isdigit() else 50.0,
            frp=float(record.get("frp", 10)),
            brightness=float(record.get("bright_ti4", record.get("brightness", 300))),
            satellite=record.get("satellite", "UNKNOWN"),
            instrument=record.get("instrument", "UNKNOWN"),
            acquisition_date=record.get("acq_date", ""),
            acquisition_time=record.get("acq_time", ""),
            day_night=record.get("daynight", "D"),
            land_cover="unknown",
            severity="MEDIUM",
            status="ACTIVE",
            area_name="FIRMS Detection",
            state="India",
        )
    except Exception as e:
        logger.warning(f"Failed to parse FIRMS record: {e}")
        return None
