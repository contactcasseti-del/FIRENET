import os
from typing import List, Optional
from functools import lru_cache


class Settings:
    nasa_firms_map_key: Optional[str] = os.environ.get("NASA_FIRMS_MAP_KEY", None)
    weather_api_key: Optional[str] = os.environ.get("WEATHER_API_KEY", None)
    map_api_key: Optional[str] = os.environ.get("MAP_API_KEY", None)
    database_url: Optional[str] = os.environ.get("DATABASE_URL", None)
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    def __init__(self):
        # Load .env if present
        try:
            from dotenv import load_dotenv
            load_dotenv()
            self.nasa_firms_map_key = os.environ.get("NASA_FIRMS_MAP_KEY", None)
            self.weather_api_key = os.environ.get("WEATHER_API_KEY", None)
            self.map_api_key = os.environ.get("MAP_API_KEY", None)
            self.database_url = os.environ.get("DATABASE_URL", None)
        except ImportError:
            pass


@lru_cache()
def get_settings() -> Settings:
    return Settings()
