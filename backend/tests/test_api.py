BASE_REQUEST = {
    "crop": "lettuce",
    "gravity": 0.0,
    "radiation": 0.3,
    "waterAvailability": 100,
    "lightHours": 16,
    "co2Level": 1000,
    "simulationDays": 30,
    "growingArea": 10,
}


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_simulate_returns_expected_shape(client):
    response = client.post("/api/simulate", json=BASE_REQUEST)
    assert response.status_code == 200
    body = response.json()
    for key in (
        "cropYield",
        "growthRate",
        "waterUsed",
        "waterRecovered",
        "co2Removed",
        "estimatedOxygenProduced",
        "spaceGrowthPercentage",
        "dailyGrowthData",
        "dailyWaterData",
        "dailyLifeSupportData",
        "comparison",
        "disclaimer",
    ):
        assert key in body
    assert len(body["dailyGrowthData"]) == BASE_REQUEST["simulationDays"] + 1
    assert body["comparison"]["earthYield"] > body["comparison"]["spaceYield"]


def test_simulate_defaults_when_body_is_empty(client):
    response = client.post("/api/simulate", json={})
    assert response.status_code == 200
    assert response.json()["crop"]["key"] == "lettuce"


def test_simulate_rejects_unknown_crop(client):
    response = client.post("/api/simulate", json={**BASE_REQUEST, "crop": "banana"})
    assert response.status_code == 422
    assert "unsupported crop" in response.text


def test_simulate_rejects_out_of_range_values(client):
    for field, value in (("gravity", 5), ("radiation", -1), ("waterAvailability", 150), ("lightHours", 25), ("co2Level", 10), ("simulationDays", 0), ("growingArea", 0)):
        response = client.post("/api/simulate", json={**BASE_REQUEST, field: value})
        assert response.status_code == 422, field


def test_simulate_rejects_bad_comparison_mode(client):
    response = client.post("/api/simulate", json={**BASE_REQUEST, "earthComparisonMode": "weird"})
    assert response.status_code == 422


def test_radiation_changes_outputs_through_api(client):
    low = client.post("/api/simulate", json={**BASE_REQUEST, "radiation": 0.1}).json()
    high = client.post("/api/simulate", json={**BASE_REQUEST, "radiation": 2.0}).json()
    assert high["cropYield"] < low["cropYield"]
    assert high["estimatedOxygenProduced"] < low["estimatedOxygenProduced"]
    assert high["spaceGrowthPercentage"] < low["spaceGrowthPercentage"]


def test_crops_and_config_endpoints(client):
    crops = client.get("/api/crops").json()["crops"]
    assert {c["key"] for c in crops} == {"lettuce", "tomato", "radish"}
    config = client.get("/api/config").json()
    assert set(config["parameters"]) >= {"gravity", "radiation", "waterAvailability", "lightHours", "co2Level", "simulationDays"}
    assert config["durationOptions"] == [7, 14, 30, 60, 90]
