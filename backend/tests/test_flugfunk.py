"""Backend tests for the Flugfunk / OpenAIP proxy endpoints."""
import os
import pytest
import requests

BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "https://funk-toolbox.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    return s


# ---- /api/flugfunk/airports ----
class TestFlugfunkAirports:
    def test_search_eddm_returns_muenchen(self, api):
        r = api.get(f"{BASE_URL}/api/flugfunk/airports", params={"search": "EDDM"}, timeout=30)
        assert r.status_code == 200, r.text
        assert r.headers.get("content-type", "").startswith("application/json")
        data = r.json()
        assert "airports" in data and isinstance(data["airports"], list)
        assert len(data["airports"]) >= 1, "expected at least one airport for EDDM"
        # Find MUENCHEN/EDDM
        target = None
        for a in data["airports"]:
            if (a.get("icao") or "").upper() == "EDDM" or "MUENCHEN" in (a.get("name") or "").upper() or "MÜNCHEN" in (a.get("name") or "").upper():
                target = a
                break
        assert target is not None, f"MUENCHEN/EDDM not found in results: {[a.get('name') for a in data['airports']]}"
        assert "frequencies" in target and isinstance(target["frequencies"], list)
        assert len(target["frequencies"]) >= 1
        # each frequency has name + value
        for f in target["frequencies"]:
            assert "name" in f and f["name"]
            assert "value" in f and f["value"]

    def test_search_missing_param_returns_422(self, api):
        r = api.get(f"{BASE_URL}/api/flugfunk/airports", timeout=15)
        assert r.status_code == 422, r.text


# ---- /api/flugfunk/frequency ----
class TestFlugfunkFrequency:
    def test_frequency_118705_matches_muenchen_tower_north(self, api):
        r = api.get(f"{BASE_URL}/api/flugfunk/frequency", params={"mhz": 118.705, "country": "DE"}, timeout=60)
        assert r.status_code == 200, r.text
        assert r.headers.get("content-type", "").startswith("application/json")
        data = r.json()
        assert "matches" in data and isinstance(data["matches"], list)
        assert data.get("query") == 118.705
        assert (data.get("country") or "").upper() == "DE"
        assert len(data["matches"]) >= 1, "expected at least one match for 118.705 MHz in DE"
        found = False
        for a in data["matches"]:
            name = (a.get("name") or "").upper()
            if "MUENCHEN" in name or "MÜNCHEN" in name:
                assert "matched" in a and isinstance(a["matched"], list) and len(a["matched"]) >= 1
                names = " | ".join((m.get("name") or "").upper() for m in a["matched"])
                if "TOWER NORTH" in names or "TWR NORTH" in names or "TOWER" in names:
                    found = True
                    break
        assert found, f"MUENCHEN 'TOWER NORTH' not found in matches: {[(a.get('name'), [m.get('name') for m in a.get('matched', [])]) for a in data['matches']]}"

    def test_frequency_missing_mhz_returns_422(self, api):
        r = api.get(f"{BASE_URL}/api/flugfunk/frequency", timeout=15)
        assert r.status_code == 422, r.text
        assert r.headers.get("content-type", "").startswith("application/json")
