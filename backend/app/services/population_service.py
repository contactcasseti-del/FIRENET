"""
Forest communities, ecosystem buffers, and wilderness infrastructure context service.
Uses realistic synthetic geographic demo data for wildfire decision support.
NOT presented as live real-world measurements.
"""
from typing import List, Dict, Any
import math


# Synthetic forest fringe villages, eco-hamlets, and tribal settlements
DEMO_POPULATION_ZONES = [
    # Aravalli Region
    {"name": "Mangar Bani Eco-Hamlet", "lat": 28.350, "lon": 77.165, "population": 650, "type": "forest_hamlet"},
    {"name": "Damdama Forest Village", "lat": 28.305, "lon": 77.140, "population": 820, "type": "fringe_village"},
    {"name": "Sohna Ridge Community", "lat": 28.250, "lon": 77.060, "population": 1200, "type": "fringe_village"},
    # Sariska Region
    {"name": "Tehla Buffer Hamlet", "lat": 27.280, "lon": 76.430, "population": 480, "type": "forest_hamlet"},
    {"name": "Thana Ghazi Border Settlement", "lat": 27.400, "lon": 76.320, "population": 950, "type": "fringe_village"},
    # Jim Corbett Region
    {"name": "Dhangarhi Gate Settlement", "lat": 29.540, "lon": 78.820, "population": 360, "type": "forest_hamlet"},
    {"name": "Mohan River Forest Community", "lat": 29.590, "lon": 78.910, "population": 410, "type": "forest_hamlet"},
    # Dudhwa Region
    {"name": "Palia Buffer Hamlet", "lat": 28.460, "lon": 80.580, "population": 540, "type": "forest_hamlet"},
    {"name": "Belrayan Forest Village", "lat": 28.530, "lon": 80.720, "population": 610, "type": "fringe_village"},
    # Ranthambore Region
    {"name": "Kailashpuri Forest Hamlet", "lat": 26.040, "lon": 76.540, "population": 320, "type": "forest_hamlet"},
    {"name": "Sawai Madhopur Fringe Settlement", "lat": 26.010, "lon": 76.400, "population": 890, "type": "fringe_village"},
    # Rajaji Region
    {"name": "Chilla Gujjar Settlement", "lat": 30.040, "lon": 78.230, "population": 290, "type": "forest_hamlet"},
    {"name": "Mohand Foothill Hamlet", "lat": 30.150, "lon": 77.920, "population": 420, "type": "fringe_village"},
    # Asola Ridge
    {"name": "Asola Ridge Buffer Hamlet", "lat": 28.480, "lon": 77.250, "population": 550, "type": "fringe_village"},
]

# Synthetic critical wilderness infrastructure & eco-sensitive assets
DEMO_INFRASTRUCTURE = [
    {"name": "Aravalli Wildlife Corridor Access Trail", "lat": 28.330, "lon": 77.170, "type": "FOREST_CORRIDOR"},
    {"name": "Sariska Core Range Firebreak & Watchtower", "lat": 27.330, "lon": 76.450, "type": "FIREBREAK"},
    {"name": "Jim Corbett Ramganga River Intake Post", "lat": 29.520, "lon": 78.760, "type": "WATER_INTAKE"},
    {"name": "Dudhwa Terai Grassland Firebreak System", "lat": 28.500, "lon": 80.620, "type": "FIREBREAK"},
    {"name": "Ranthambore Plateau Watchtower & Relay Post", "lat": 26.030, "lon": 76.490, "type": "WATCHTOWER"},
    {"name": "Rajaji Shivalik Elephant Corridor Route", "lat": 30.070, "lon": 78.210, "type": "FOREST_CORRIDOR"},
    {"name": "Kalesar Foothill Fire Trail Line", "lat": 30.330, "lon": 77.570, "type": "FIREBREAK"},
    {"name": "Asola Sanctuary Sanctuary Boundary Fence", "lat": 28.495, "lon": 77.235, "type": "PROTECTED_FOREST"},
]

# Synthetic ranger posts & emergency medical centers
DEMO_HOSPITALS = [
    {"name": "Aravalli Forest Ranger First Aid Station", "lat": 28.340, "lon": 77.110},
    {"name": "Sariska Wildlife Trauma Aid Unit", "lat": 27.340, "lon": 76.420},
    {"name": "Ramnagar Forest Emergency Health Post", "lat": 29.510, "lon": 78.750},
    {"name": "Dudhwa Field Ranger Medical Camp", "lat": 28.480, "lon": 80.600},
    {"name": "Ranthambore Wildlife Medical Center", "lat": 26.020, "lon": 76.480},
    {"name": "Haridwar Forest Medical Post", "lat": 30.050, "lon": 78.190},
]

# Synthetic nature research stations & forest education centers
DEMO_SCHOOLS = [
    {"name": "Aravalli Biodiversity Interpretive Center", "lat": 28.345, "lon": 77.130},
    {"name": "Sariska Nature Conservation Field Post", "lat": 27.350, "lon": 76.430},
    {"name": "Corbett Wildlife Research Base", "lat": 29.530, "lon": 78.780},
    {"name": "Dudhwa Eco-Education Center", "lat": 28.490, "lon": 80.610},
    {"name": "Wildlife Institute of India Field Outpost", "lat": 30.070, "lon": 78.200},
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))


def get_nearby_context(
    latitude: float,
    longitude: float,
    radius_km: float = 35.0,
) -> Dict[str, Any]:
    """Get forest communities and ecosystem context within radius of forest fire."""
    nearby_pop = [
        z for z in DEMO_POPULATION_ZONES
        if haversine_km(latitude, longitude, z["lat"], z["lon"]) <= radius_km
    ]
    total_pop = sum(int(z["population"] * max(0.2, 1.0 - haversine_km(latitude, longitude, z["lat"], z["lon"]) / radius_km)) for z in nearby_pop)

    nearby_infra = [
        i["name"] for i in DEMO_INFRASTRUCTURE
        if haversine_km(latitude, longitude, i["lat"], i["lon"]) <= radius_km
    ]
    nearby_hospitals = [
        h["name"] for h in DEMO_HOSPITALS
        if haversine_km(latitude, longitude, h["lat"], h["lon"]) <= radius_km
    ]
    nearby_schools = [
        s["name"] for s in DEMO_SCHOOLS
        if haversine_km(latitude, longitude, s["lat"], s["lon"]) <= radius_km
    ]

    # Forest corridors & firebreak trails
    highways = [
        i["name"] for i in DEMO_INFRASTRUCTURE
        if haversine_km(latitude, longitude, i["lat"], i["lon"]) <= radius_km
    ]

    return {
        "population_at_risk": max(80, total_pop),
        "nearby_settlements": [z["name"] for z in nearby_pop],
        "infrastructure": nearby_infra,
        "hospitals": nearby_hospitals,
        "schools": nearby_schools,
        "highways": highways,
    }
