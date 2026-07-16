"""Backend tests for the Repeater-Finder / RepeaterBook proxy endpoints."""
import os

import pytest
import requests

from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    return s


# ---- /api/repeater/search ----
class TestRepeaterSearch:
    def test_search_145_6875_returns_dach_results(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/search", params={"freq": 145.6875}, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("query") == 145.6875
        assert "count" in data and isinstance(data["count"], int)
        assert "results" in data and isinstance(data["results"], list)
        # count ~53 -> allow a wide tolerance for scraped data drift
        assert 40 <= data["count"] <= 70, f"unexpected count {data['count']}"
        assert data["count"] == len(data["results"])

        codes = {r_.get("countryCode") for r_ in data["results"]}
        assert {"DE", "AT", "CH"}.issubset(codes), f"missing DACH codes: {codes}"

        # Each item has required fields; freq within ±0.0125 MHz of query
        required = {"id", "state_id", "call", "freq", "offsetDir", "tone", "location", "modes", "status"}
        for it in data["results"]:
            missing = required - set(it)
            assert not missing, f"missing keys {missing} in {it}"
            assert abs(it["freq"] - 145.6875) <= 0.0125 + 1e-9

    def test_search_145_600_count_expected(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/search", params={"freq": 145.600}, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("query") == 145.6
        # target ~54
        assert 40 <= data["count"] <= 70, f"unexpected count {data['count']}"
        assert len(data["results"]) == data["count"]

    def test_search_missing_freq_returns_422(self, api):
        r = api.get(f"{BASE_URL}/api/repeater/search", timeout=15)
        assert r.status_code == 422, r.text


# ---- /api/repeater/detail ----
class TestRepeaterDetail:
    def test_detail_from_de_result_of_145_600(self, api):
        s = api.get(f"{BASE_URL}/api/repeater/search", params={"freq": 145.600}, timeout=120)
        assert s.status_code == 200
        de_items = [x for x in s.json()["results"] if x.get("state_id") == "DE"]
        assert de_items, "no DE results for 145.600 MHz"
        target = de_items[0]
        r = api.get(
            f"{BASE_URL}/api/repeater/detail",
            params={"state_id": "DE", "id": target["id"]},
            timeout=45,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("state_id") == "DE"
        assert d.get("id") == target["id"]
        assert d.get("country") == "Deutschland"
        # downlink/uplink/offset are strings extracted from HTML
        assert d.get("downlink"), f"missing downlink: {d}"
        assert d.get("uplink"), f"missing uplink: {d}"
        assert d.get("offset"), f"missing offset: {d}"
        # call/location commonly present
        assert "call" in d or "location" in d
        # lat/lon usually present
        # (soft assert -> log if missing, don't fail flakily)

    def test_detail_invalid_params_returns_400(self, api):
        r = api.get(
            f"{BASE_URL}/api/repeater/detail", params={"state_id": "XX", "id": "abc"}, timeout=15
        )
        assert r.status_code == 400, r.text

    def test_detail_invalid_state_only_returns_400(self, api):
        r = api.get(
            f"{BASE_URL}/api/repeater/detail", params={"state_id": "germany", "id": "123"}, timeout=15
        )
        assert r.status_code == 400, r.text
