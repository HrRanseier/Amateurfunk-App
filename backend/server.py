from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import math
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

# Amateur-radio band boundaries (MHz). A frequency is tagged with the first
# matching band; bands are surfaced to the app dynamically (only those that
# actually occur in the DACH cache). Ordered low→high frequency (10m … 3cm).
RB_BANDS = [
    ("10m", 28.0, 29.7),
    ("6m", 50.0, 54.0),
    ("4m", 70.0, 70.5),
    ("2m", 144.0, 148.0),
    ("1.25m", 219.0, 225.0),
    ("70cm", 420.0, 450.0),
    ("33cm", 900.0, 930.0),
    ("23cm", 1240.0, 1300.0),
    ("13cm", 2300.0, 2450.0),
    ("9cm", 3300.0, 3500.0),
    ("6cm", 5650.0, 5925.0),
    ("3cm", 10000.0, 10500.0),
]


def _band_for_freq(f: float) -> str:
    for key, lo, hi in RB_BANDS:
        if lo <= f <= hi:
            return key
    return ""


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


# Coordinate cache. Persisted in MongoDB (collection repeater_coords) and
# mirrored in memory. Populated LAZILY: a repeater's coords are fetched (and
# stored forever) only the first time it appears in a real user search result.
_coords: dict = {}          # "DE-123" -> (lat, lon)
_coords_seen: set = set()   # keys already known or queued (dedupe)
_coord_queue: "Optional[asyncio.Queue]" = None

# OpenStreetMap Nominatim (manual location fallback). Keyless, but must be
# rate-limited to <=1 req/s and send a descriptive User-Agent.
NOMINATIM_UA = "FunkToolbox/1.0 (Amateur Radio Repeater Finder)"
_nominatim_lock = asyncio.Lock()
_nominatim_last = 0.0


async def _load_coords_from_db():
    async for doc in db.repeater_coords.find({}, {"_id": 1, "lat": 1, "lon": 1}):
        _coords[doc["_id"]] = (doc["lat"], doc["lon"])
        _coords_seen.add(doc["_id"])


async def _fetch_coord(hc: httpx.AsyncClient, state_id: str, rid: str) -> bool:
    try:
        r = await hc.get(f"{RB_BASE}/details.php", params={"state_id": state_id, "ID": rid})
        if r.status_code == 200:
            d = _parse_rb_detail(r.text)
            if "lat" in d and "lon" in d:
                key = f"{state_id}-{rid}"
                _coords[key] = (d["lat"], d["lon"])
                await db.repeater_coords.update_one(
                    {"_id": key},
                    {"$set": {"lat": d["lat"], "lon": d["lon"], "ts": _time.time()}},
                    upsert=True,
                )
                return True
    except Exception:
        pass
    return False


async def _coord_worker():
    async with httpx.AsyncClient(
        timeout=30, headers={"User-Agent": RB_UA}, follow_redirects=True
    ) as hc:
        while True:
            try:
                state_id, rid = await _coord_queue.get()
                if f"{state_id}-{rid}" not in _coords:
                    await _fetch_coord(hc, state_id, rid)
                _coord_queue.task_done()
                await asyncio.sleep(0.3)  # polite throttle
            except Exception:
                await asyncio.sleep(0.5)


def _enqueue_coords(items: list):
    if _coord_queue is None:
        return
    for r in items:
        key = f"{r['state_id']}-{r['id']}"
        if key in _coords_seen:
            continue
        _coords_seen.add(key)
        try:
            _coord_queue.put_nowait((r["state_id"], r["id"]))
        except asyncio.QueueFull:
            _coords_seen.discard(key)
            break


async def _warm_coords_sync(cand: list, cap: int = 30, deadline: float = 8.0):
    """Bounded synchronous coord fetch so a fresh radius query returns useful
    results immediately (small freq/band sets fully resolve); the rest is left
    to the background worker."""
    missing = [r for r in cand if f"{r['state_id']}-{r['id']}" not in _coords][:cap]
    if not missing:
        return
    sem = asyncio.Semaphore(10)
    async with httpx.AsyncClient(
        timeout=20, headers={"User-Agent": RB_UA}, follow_redirects=True
    ) as hc:
        async def one(r):
            _coords_seen.add(f"{r['state_id']}-{r['id']}")
            async with sem:
                await _fetch_coord(hc, r["state_id"], r["id"])

        try:
            await asyncio.wait_for(asyncio.gather(*[one(r) for r in missing]), timeout=deadline)
        except asyncio.TimeoutError:
            pass


async def _require_reps() -> list:
    try:
        reps = await _get_rb_repeaters()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="RepeaterBook nicht erreichbar")
    if not reps:
        raise HTTPException(status_code=502, detail="RepeaterBook-Daten nicht verfügbar")
    return reps


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
            "band": _band_for_freq(freq),
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


@api_router.get("/repeater/bands")
async def repeater_bands():
    reps = await _require_reps()
    counts: dict = {}
    for r in reps:
        b = r.get("band")
        if b:
            counts[b] = counts.get(b, 0) + 1
    order = [k for k, _, _ in RB_BANDS]
    result = [{"band": b, "count": counts[b]} for b in order if b in counts]
    return {"bands": result}


@api_router.get("/repeater/suggest")
async def repeater_suggest(q: str, limit: int = 15):
    ql = q.strip().lower()
    if not ql:
        return {"query": ql, "count": 0, "results": []}
    reps = await _require_reps()
    out = []
    for r in reps:
        call = r["call"].lower()
        loc = r["location"].lower()
        tokens = [t for t in re.split(r"[,\s/]+", loc) if t]
        if call.startswith(ql) or loc.startswith(ql) or any(t.startswith(ql) for t in tokens):
            out.append(r)

    def rank(r):
        call = r["call"].lower()
        loc = r["location"].lower()
        if call.startswith(ql):
            return (0, loc)
        if loc.startswith(ql):
            return (1, loc)
        return (2, loc)

    out.sort(key=rank)
    top = out[:limit]
    _enqueue_coords(top)
    return {"query": ql, "count": len(out), "results": top}


@api_router.get("/repeater/geocode")
async def repeater_geocode(q: str):
    global _nominatim_last
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Ort fehlt")
    async with _nominatim_lock:
        wait = 1.0 - (_time.time() - _nominatim_last)
        if wait > 0:
            await asyncio.sleep(wait)
        _nominatim_last = _time.time()
        try:
            async with httpx.AsyncClient(timeout=15, headers={"User-Agent": NOMINATIM_UA}) as hc:
                r = await hc.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"q": query, "format": "json", "limit": 1, "addressdetails": 0},
                )
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail="Geocoding nicht erreichbar")
    data = r.json() if r.status_code == 200 else []
    if not data:
        raise HTTPException(status_code=404, detail="Ort nicht gefunden")
    top = data[0]
    return {"lat": float(top["lat"]), "lon": float(top["lon"]), "display": top.get("display_name", query)}


@api_router.get("/repeater/search")
async def repeater_search(
    freq: Optional[float] = None,
    bands: str = "",
    near: str = "",
    radius: float = 30.0,
):
    reps = await _require_reps()

    cand = reps
    if freq is not None:
        cand = [r for r in cand if abs(r["freq"] - freq) <= RB_FREQ_TOL]

    band_set = {b.strip() for b in bands.split(",") if b.strip()}
    if band_set:
        cand = [r for r in cand if r.get("band") in band_set]

    near_active = False
    plat = plon = 0.0
    if near.strip():
        parts = near.split(",")
        try:
            plat = float(parts[0])
            plon = float(parts[1])
            near_active = True
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Ungültige Koordinaten")

    if freq is None and not band_set and not near_active:
        return {"count": 0, "results": [], "near": False, "pendingCoords": 0}

    if near_active:
        # Lazily warm coords for this real result set (bounded sync + background).
        await _warm_coords_sync(cand)
        _enqueue_coords(cand)
        out = []
        pending = 0
        for r in cand:
            c = _coords.get(f"{r['state_id']}-{r['id']}")
            if c is None:
                pending += 1
                continue
            dist = _haversine_km(plat, plon, c[0], c[1])
            if dist <= radius:
                rr = dict(r)
                rr["distanceKm"] = round(dist, 1)
                rr["lat"] = c[0]
                rr["lon"] = c[1]
                out.append(rr)
        out.sort(key=lambda r: r["distanceKm"])
        return {"count": len(out), "results": out, "near": True, "radius": radius, "pendingCoords": pending}

    _enqueue_coords(cand)
    cand = sorted(cand, key=lambda r: (r["location"].lower(), r["freq"]))
    return {"count": len(cand), "results": cand, "near": False, "pendingCoords": 0}


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

@app.on_event("startup")
async def _startup():
    # Prepare the lazy coordinate worker + warm the RepeaterBook DACH list cache
    # in the background so the first user search is served instantly.
    global _coord_queue
    _coord_queue = asyncio.Queue(maxsize=6000)

    async def _run():
        try:
            await _load_coords_from_db()
            logger.info("Loaded %d cached repeater coords", len(_coords))
        except Exception as e:  # pragma: no cover
            logger.warning("Coord load failed: %s", e)
        asyncio.create_task(_coord_worker())
        try:
            reps = await _get_rb_repeaters()
            logger.info("RepeaterBook cache warmed: %d repeaters", len(reps))
        except Exception as e:  # pragma: no cover
            logger.warning("RepeaterBook warmup failed: %s", e)

    asyncio.create_task(_run())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
