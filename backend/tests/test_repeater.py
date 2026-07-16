"""Backend tests for the REWORKED Repeater-Finder endpoints (iteration_9).

Covers the new combinable-filter search screen contract:
- /api/repeater/bands   (dynamic bands from DACH cache)
- /api/repeater/suggest (prefix, case-insensitive, callsign+location)
- /api/repeater/search  (freq, bands, near+radius; alphabetic full-list mode)
- /api/repeater/geocode (Nominatim manual location fallback)
- /api/repeater/detail  (unchanged; regression)
- MongoDB collection repeater_coords (lazy coord backfill)
"""
import os
import time
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    return s


# --------------------------------------------------------------------------
# /api/repeater/bands
# --------------------------------------------------------------------------
class TestRepeaterBands:
    def test_bands_shape_and_expected_keys(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/bands", timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "bands" in data and isinstance(data["bands"], list)
        assert len(data["bands"]) > 0
        keys = [b["band"] for b in data["bands"]]
        counts = {b["band"]: b["count"] for b in data["bands"]}

        # Every returned band must be in the allowed enum and have count>0
        allowed = {"10m", "6m", "4m", "2m", "1.25m", "70cm", "33cm",
                   "23cm", "13cm", "9cm", "6cm", "3cm"}
        for b in data["bands"]:
            assert b["band"] in allowed, f"unexpected band {b['band']}"
            assert isinstance(b["count"], int) and b["count"] > 0

        # Core amateur DACH bands MUST be present
        assert "2m" in counts, f"missing 2m: {counts}"
        assert "70cm" in counts, f"missing 70cm: {counts}"

        # Sanity: 2m should be ~310 (allow wide drift), 70cm ~1479
        assert 200 <= counts["2m"] <= 500, f"2m count off: {counts['2m']}"
        assert 1000 <= counts["70cm"] <= 2500, f"70cm count off: {counts['70cm']}"

        # Ordering must be by band frequency (10m -> 3cm)
        order = ["10m", "6m", "4m", "2m", "1.25m", "70cm",
                 "33cm", "23cm", "13cm", "9cm", "6cm", "3cm"]
        idxs = [order.index(k) for k in keys]
        assert idxs == sorted(idxs), f"bands not freq-ordered: {keys}"


# --------------------------------------------------------------------------
# /api/repeater/suggest
# --------------------------------------------------------------------------
class TestRepeaterSuggest:
    def test_suggest_location_prefix_zug(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/suggest", params={"q": "Zug"}, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["query"] == "zug"
        assert isinstance(data["results"], list)
        assert len(data["results"]) > 0

        # Case-insensitive prefix on location (also token) OR callsign
        locs = [x["location"].lower() for x in data["results"]]
        calls = [x["call"].lower() for x in data["results"]]
        # Must include at least one entry whose location starts with "zugspitze"
        assert any(l.startswith("zugspitze") for l in locs), \
            f"no Zugspitze location: {locs[:8]}"

        # Every returned item must actually satisfy the prefix rule
        for it in data["results"]:
            call = it["call"].lower()
            loc = it["location"].lower()
            tokens = [t for t in __import__("re").split(r"[,\s/]+", loc) if t]
            assert (
                call.startswith("zug")
                or loc.startswith("zug")
                or any(t.startswith("zug") for t in tokens)
            ), f"item does not match prefix: {it}"

    def test_suggest_callsign_prefix_db0(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/suggest", params={"q": "db0"}, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["count"] > 0
        assert len(data["results"]) > 0
        # Top-ranked (callsign match) items must have call starting with DB0
        top_call_matches = [x for x in data["results"] if x["call"].lower().startswith("db0")]
        assert len(top_call_matches) > 0
        # And they must be sorted before pure location matches (rank 0 first)
        assert data["results"][0]["call"].lower().startswith("db0")

    def test_suggest_empty_query(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/suggest", params={"q": "  "}, timeout=30)
        assert r.status_code == 200
        assert r.json()["count"] == 0


# --------------------------------------------------------------------------
# /api/repeater/search
# --------------------------------------------------------------------------
class TestRepeaterSearch:
    def test_search_bands_2m_full_list_sorted(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/search", params={"bands": "2m"}, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["near"] is False
        assert data["pendingCoords"] == 0
        # count ~310 (allow drift)
        assert 200 <= data["count"] <= 500, f"unexpected 2m count {data['count']}"
        assert data["count"] == len(data["results"])
        for it in data["results"]:
            assert it["band"] == "2m", f"non-2m item: {it}"
        locs = [it["location"].lower() for it in data["results"]]
        assert locs == sorted(locs), "results not alphabetically sorted by location"

    def test_search_freq_145_6875(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/search",
                    params={"freq": 145.6875}, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["near"] is False
        assert 40 <= data["count"] <= 70, f"unexpected count {data['count']}"
        assert data["count"] == len(data["results"])
        for it in data["results"]:
            assert abs(it["freq"] - 145.6875) <= 0.0125 + 1e-9

    def test_search_no_criteria_returns_empty(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/search", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["count"] == 0 and d["results"] == [] and d["near"] is False

    def test_search_near_2m_munich_radius_30(self, api):
        params = {"bands": "2m", "near": "48.137,11.575", "radius": 30}
        r = api.get(f"{BASE_URL}/api/repeater/search", params=params, timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["near"] is True
        assert d["radius"] == 30
        assert isinstance(d["pendingCoords"], int) and d["pendingCoords"] >= 0
        dists = [it.get("distanceKm") for it in d["results"]]
        for it in d["results"]:
            assert isinstance(it["distanceKm"], (int, float))
            assert it["distanceKm"] <= 30
            assert it["band"] == "2m"
            # near-mode results include lat/lon
            assert "lat" in it and "lon" in it
        assert dists == sorted(dists), "near results not sorted by distance asc"

        # Wait for background coord backfill and re-query. pendingCoords must
        # not increase.
        first_pending = d["pendingCoords"]
        time.sleep(15)
        r2 = api.get(f"{BASE_URL}/api/repeater/search", params=params, timeout=120)
        d2 = r2.json()
        assert d2["pendingCoords"] <= first_pending, \
            f"pendingCoords grew: {first_pending} -> {d2['pendingCoords']}"

    def test_search_near_invalid_coords_returns_400(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/search",
                    params={"near": "abc", "radius": 5}, timeout=30)
        assert r.status_code == 400, r.text

    def test_search_freq_and_band_combined(self, api):
        # 145.6875 is inside 2m -> both filters combined should keep results
        r = api.get(f"{BASE_URL}/api/repeater/search",
                    params={"freq": 145.6875, "bands": "2m"}, timeout=120)
        assert r.status_code == 200
        d = r.json()
        assert d["count"] > 0
        for it in d["results"]:
            assert it["band"] == "2m"
            assert abs(it["freq"] - 145.6875) <= 0.0125 + 1e-9


# --------------------------------------------------------------------------
# /api/repeater/geocode
# --------------------------------------------------------------------------
class TestRepeaterGeocode:
    def test_geocode_muenchen(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/geocode",
                    params={"q": "München"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "lat" in d and "lon" in d and "display" in d
        assert 47.5 <= d["lat"] <= 48.5, f"lat off: {d['lat']}"
        assert 11.0 <= d["lon"] <= 12.0, f"lon off: {d['lon']}"

    def test_geocode_empty_returns_400(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/geocode",
                    params={"q": "   "}, timeout=15)
        assert r.status_code == 400


# --------------------------------------------------------------------------
# /api/repeater/detail  (regression)
# --------------------------------------------------------------------------
class TestRepeaterDetail:
    def test_detail_from_de_2m_result(self, api):
        s = api.get(f"{BASE_URL}/api/repeater/search",
                    params={"bands": "2m"}, timeout=120)
        de = [x for x in s.json()["results"] if x["state_id"] == "DE"]
        assert de
        target = de[0]
        r = api.get(f"{BASE_URL}/api/repeater/detail",
                    params={"state_id": "DE", "id": target["id"]}, timeout=45)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["state_id"] == "DE" and d["id"] == target["id"]
        assert d["country"] == "Deutschland"
        assert d.get("downlink")
        assert d.get("uplink")
        assert d.get("offset")

    def test_detail_invalid_params_returns_400(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/detail",
                    params={"state_id": "XX", "id": "abc"}, timeout=15)
        assert r.status_code == 400


# --------------------------------------------------------------------------
# MongoDB repeater_coords collection
# --------------------------------------------------------------------------
class TestRepeaterCoordsPersistence:
    def test_repeater_coords_collection_populated(self, api):
        """After a radius query, the coord backfill worker must persist coords
        in MongoDB collection `repeater_coords`."""
        # Kick off a radius query to trigger lazy backfill (2m@Munich).
        api.get(
            f"{BASE_URL}/api/repeater/search",
            params={"bands": "2m", "near": "48.137,11.575", "radius": 50},
            timeout=120,
        )
        # Give the background worker some time.
        time.sleep(10)

        # Access MongoDB directly via pymongo.
        try:
            from pymongo import MongoClient
        except ImportError:
            pytest.skip("pymongo not installed")
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.environ.get("DB_NAME", "test_database")
        c = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        col = c[db_name]["repeater_coords"]
        count = col.count_documents({})
        assert count > 0, f"repeater_coords empty (expected > 0)"
        # Every doc must have lat/lon numeric
        sample = col.find_one({})
        assert isinstance(sample["lat"], (int, float))
        assert isinstance(sample["lon"], (int, float))
        c.close()
