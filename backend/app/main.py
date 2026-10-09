"""
FIRENET Backend — FastAPI Application
Emergency Response Orchestration Engine
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api import fires, stations, resources, incidents, simulation, alerts, analytics

settings = get_settings()

app = FastAPI(
    title="FIRENET API",
    description="AI-Powered Forest Fire Detection, Risk Assessment & Emergency Response Coordination — Decision Support Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(fires.router, prefix="/api/v1")
app.include_router(stations.router, prefix="/api/v1")
app.include_router(resources.router, prefix="/api/v1")
app.include_router(incidents.router, prefix="/api/v1")
app.include_router(simulation.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")


@app.get("/")
@app.get("/api")
@app.get("/api/")
async def root():
    return {
        "service": "FIRENET",
        "version": "1.0.0",
        "description": "AI-Powered Forest Fire Detection, Risk Assessment & Emergency Response Coordination",
        "demo_mode": not bool(settings.nasa_firms_map_key),
        "status": "operational",
        "disclaimer": "FIRENET is a decision-support system for wildfire emergency operations. All emergency unit dispatches require explicit human authorization.",
    }


@app.get("/api/v1/health")
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "demo_mode": not bool(settings.nasa_firms_map_key),
        "nasa_firms": "configured" if settings.nasa_firms_map_key else "not configured (demo mode)",
        "weather_api": "configured" if settings.weather_api_key else "not configured (demo mode)",
    }
