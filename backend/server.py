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
import re
import asyncio
import html as _htmllib
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


# ---------------------------------------------------------------------------
# Repeater-Finder — RepeaterBook (ROW) public pages, server-side daily cache.
# No API key. Attribution "Daten: RepeaterBook.com" is shown in the app.
# ---------------------------------------------------------------------------
RB_BASE = "https://www.repeaterbook.com/row_repeaters"
RB_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120 Safari/537.36"
)
RB_COUNTRIES = {"DE": "Deutschland", "AT": "Österreich", "CH": "Schweiz"}
RB_FREQ_TOL = 0.0125 + 1e-9

_rb_cache: dict = {"ts": 0.0, "repeaters": []}
_rb_lock = asyncio.Lock()


def _rb_clean(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = _htmllib.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def _rb_decode(s: str) -> str:
    s = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), s or "")
    return _htmllib.unescape(s).strip()


def _rb_status(td: str) -> str:
    if "🟢" in td or re.search(r"on-?air", td, re.I):
        return "on-air"
    if "🔴" in td or re.search(r"off-?air", td, re.I):
        return "off-air"
    if "🟡" in td:
        return "unknown"
    return _rb_clean(td) or "unknown"


def _parse_rb_list(html: str, state_id: str) -> list:
    country = RB_COUNTRIES.get(state_id, state_id)
    out = []
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.S | re.I):
        m_id = re.search(r'data-rpt-id="(\d+)"', row)
        if not m_id:
            continue
        tds = re.findall(r"<td\b[^>]*>(.*?)</td>", row, re.S | re.I)
        if len(tds) < 7:
            continue
        freq_td = tds[1]
        m_freq = re.search(r">\s*([0-9]+\.[0-9]+)\s*<", freq_td)
        if not m_freq:
            m_freq = re.search(r"([0-9]+\.[0-9]+)", _rb_clean(freq_td))
        if not m_freq:
            continue
        try:
            freq = float(m_freq.group(1))
        except ValueError:
            continue
        m_off = re.search(r'<span[^>]*text-muted[^>]*>([^<]*)</span>', freq_td)
        modes = " ".join(
            _rb_clean(x) for x in re.findall(r'<span[^>]*mode-badge[^>]*>(.*?)</span>', tds[5], re.S | re.I)
        ) or _rb_clean(tds[5])
        out.append({
            "id": m_id.group(1),
            "state_id": state_id,
            "country": country,
            "countryCode": state_id,
            "call": _rb_clean(tds[4]),
            "freq": freq,
            "offsetDir": _rb_clean(m_off.group(1)) if m_off else "",
            "tone": _rb_clean(tds[2]),
            "location": _rb_clean(tds[3]),
            "modes": modes,
            "status": _rb_status(tds[6]),
        })
    return out


async def _fetch_rb_state(hc: httpx.AsyncClient, state_id: str) -> list:
    params = {"state_id": state_id, "loc": "%", "county_id": "%", "freq": "%", "status_id": "%", "call": "%"}
    r = await hc.get(f"{RB_BASE}/Display_SS.php", params=params)
    if r.status_code != 200:
        return []
    return _parse_rb_list(r.text, state_id)


async def _get_rb_repeaters(force: bool = False) -> list:
    now = _time.time()
    if not force and _rb_cache["repeaters"] and now - _rb_cache["ts"] < _CACHE_TTL:
        return _rb_cache["repeaters"]
    async with _rb_lock:
        now = _time.time()
        if not force and _rb_cache["repeaters"] and now - _rb_cache["ts"] < _CACHE_TTL:
            return _rb_cache["repeaters"]
        combined: list = []
        async with httpx.AsyncClient(
            timeout=90, headers={"User-Agent": RB_UA}, follow_redirects=True
        ) as hc:
            results = await asyncio.gather(
                *[_fetch_rb_state(hc, sid) for sid in RB_COUNTRIES], return_exceptions=True
            )
        for res in results:
            if isinstance(res, list):
                combined.extend(res)
        if combined:
            _rb_cache["repeaters"] = combined
            _rb_cache["ts"] = now
        return combined


def _parse_rb_detail(html: str) -> dict:
    d: dict = {}
    m = re.search(r"radius_result\.php\?lat=([\-0-9.]+)&(?:amp;)?long=([\-0-9.]+)", html)
    if m:
        try:
            d["lat"] = float(m.group(1))
            d["lon"] = float(m.group(2))
        except ValueError:
            pass
    for name, key in [("Callsign", "call"), ("Location", "location"), ("Country", "countryCode")]:
        mm = re.search(r'"name":"%s","value":"([^"]*)"' % re.escape(name), html)
        if mm:
            d[key] = _rb_decode(mm.group(1))
    h2 = re.sub(r"<script.*?</script>", " ", html, flags=re.S | re.I)
    h2 = re.sub(r"<style.*?</style>", " ", h2, flags=re.S | re.I)
    h2 = re.sub(r'title="[^"]*"', " ", h2)
    lines = [re.sub(r"\s+", " ", x).strip() for x in re.sub(r"<[^>]+>", "\n", h2).split("\n")]
    lines = [x for x in lines if x]

    def after(label: str) -> str:
        for i, l in enumerate(lines):
            if l == label and i + 1 < len(lines):
                return lines[i + 1]
        return ""

    d["downlink"] = after("Downlink")
    d["uplink"] = after("Uplink")
    d["offset"] = after("Offset")
    d["bandwidth"] = after("Bandwidth")
    sponsor = after("Web links")
    if sponsor and not sponsor.lower().startswith(("http", "local time", "reviewed")):
        d["sponsor"] = sponsor
    for lbl in ("CTCSS", "Tone", "PL", "Color Code", "DCS"):
        v = after(lbl)
        if v and re.search(r"[0-9A-Za-z]", v):
            d["tone"] = v
            break
    return d


@api_router.get("/repeater/search")
async def repeater_search(freq: float, mode: str = ""):
    try:
        reps = await _get_rb_repeaters()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="RepeaterBook nicht erreichbar")
    if not reps:
        raise HTTPException(status_code=502, detail="RepeaterBook-Daten nicht verfügbar")
    mode_l = mode.lower().strip()
    matches = [r for r in reps if abs(r["freq"] - freq) <= RB_FREQ_TOL]
    if mode_l:
        matches = [r for r in matches if mode_l in r["modes"].lower()]
    matches.sort(key=lambda r: (r["freq"], r["call"]))
    return {"query": freq, "count": len(matches), "results": matches}


@api_router.get("/repeater/detail")
async def repeater_detail(state_id: str, id: str):
    state_id = (state_id or "").upper()
    if not re.fullmatch(r"[A-Z]{2}", state_id) or not re.fullmatch(r"\d+", id or ""):
        raise HTTPException(status_code=400, detail="Ungültige Parameter")
    try:
        async with httpx.AsyncClient(
            timeout=30, headers={"User-Agent": RB_UA}, follow_redirects=True
        ) as hc:
            r = await hc.get(f"{RB_BASE}/details.php", params={"state_id": state_id, "ID": id})
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="RepeaterBook nicht erreichbar")
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="Detailseite nicht verfügbar")
    d = _parse_rb_detail(r.text)
    d.update({"id": id, "state_id": state_id, "country": RB_COUNTRIES.get(state_id, state_id)})
    return d


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
