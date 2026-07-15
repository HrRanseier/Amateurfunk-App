from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
import time as _time
import httpx
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# ---------------------------------------------------------------------------
# Flugfunk (aviation radio) — OpenAIP proxy. API key stays server-side only.
# ---------------------------------------------------------------------------
OPENAIP_API_KEY = os.environ.get("OPENAIP_API_KEY", "")
OPENAIP_BASE = "https://api.core.openaip.net/api"
_country_cache: dict = {}  # country -> {"ts": float, "airports": [...]}
_CACHE_TTL = 24 * 3600


def _simplify_airport(a: dict) -> dict:
    freqs = []
    for f in (a.get("frequencies") or []):
        raw = f.get("value")
        try:
            val = float(str(raw).replace(",", "."))
        except (TypeError, ValueError):
            continue
        freqs.append({
            "name": f.get("name") or "FREQ",
            "value": raw,
            "valueMHz": val,
            "primary": bool(f.get("primary")),
        })
    return {
        "name": a.get("name"),
        "icao": a.get("icaoCode"),
        "iata": a.get("iataCode"),
        "country": a.get("country"),
        "frequencies": freqs,
    }


async def _fetch_country_airports(country: str) -> list:
    now = _time.time()
    cached = _country_cache.get(country)
    if cached and cached["airports"] and now - cached["ts"] < _CACHE_TTL:
        return cached["airports"]
    airports: list = []
    async with httpx.AsyncClient(timeout=30) as hc:
        page = 1
        while page <= 5:
            params = {"country": country, "limit": 1000, "page": page, "apiKey": OPENAIP_API_KEY}
            r = await hc.get(f"{OPENAIP_BASE}/airports", params=params)
            if r.status_code != 200:
                break
            data = r.json()
            airports.extend(_simplify_airport(a) for a in data.get("items", []))
            if page >= int(data.get("totalPages", 1)):
                break
            page += 1
    airports = [a for a in airports if a["frequencies"]]
    _country_cache[country] = {"ts": now, "airports": airports}
    return airports


@api_router.get("/flugfunk/airports")
async def flugfunk_airports(search: str):
    if not OPENAIP_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAIP API key not configured")
    params = {"search": search, "limit": 20, "apiKey": OPENAIP_API_KEY}
    try:
        async with httpx.AsyncClient(timeout=15) as hc:
            r = await hc.get(f"{OPENAIP_BASE}/airports", params=params)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="OpenAIP nicht erreichbar")
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="OpenAIP-Anfrage fehlgeschlagen")
    airports = [_simplify_airport(a) for a in r.json().get("items", [])]
    return {"airports": airports}


@api_router.get("/flugfunk/frequency")
async def flugfunk_frequency(mhz: float, country: str = "DE"):
    if not OPENAIP_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAIP API key not configured")
    country = (country or "DE").upper()
    try:
        airports = await _fetch_country_airports(country)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="OpenAIP nicht erreichbar")
    tol = 0.005 + 1e-9
    matches = []
    for a in airports:
        hits = [f for f in a["frequencies"] if abs(f["valueMHz"] - mhz) <= tol]
        if hits:
            m = dict(a)
            m["matched"] = hits
            matches.append(m)
    return {"query": mhz, "country": country, "matches": matches}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
