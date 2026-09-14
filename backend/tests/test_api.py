import pytest

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


def test_validation_errors_have_flat_message_and_fields(client):
    response = client.post("/api/simulate", json={**BASE_REQUEST, "gravity": 9, "crop": "kale"})
    assert response.status_code == 422
    body = response.json()
    assert body["error"] == "validation_error"
    assert set(body["fields"]) == {"gravity", "crop"}
    assert "gravity" in body["message"] and "crop" in body["message"]
    assert isinstance(body["detail"], list)


def test_malformed_json_is_a_422_not_a_500(client):
    response = client.post("/api/simulate", content="{not json", headers={"Content-Type": "application/json"})
    assert response.status_code == 422
    assert response.json()["error"] == "validation_error"


def test_harvest_summary_separates_standing_and_harvested(client):
    body = client.post("/api/simulate", json={"crop": "lettuce", "simulationDays": 30}).json()
    harvest = body["harvest"]
    assert harvest["harvestWithinWindow"] is False
    assert harvest["harvestedYield"] == 0.0
    assert harvest["standingBiomass"] == body["cropYield"]
    assert harvest["nextHarvestDay"] == 35 and harvest["daysUntilNextHarvest"] == 5
    assert body["space"]["harvestedYield"] == 0.0
    assert body["dailyGrowthData"][-1]["spaceHarvested"] == 0.0

    body = client.post("/api/simulate", json={"crop": "lettuce", "simulationDays": 90}).json()
    harvest = body["harvest"]
    assert harvest["harvestDays"] == [35, 70] and harvest["cyclesCompleted"] == 2
    assert harvest["harvestedYield"] > 0
    assert body["dailyGrowthData"][35]["isHarvestDay"] is True
    assert body["dailyGrowthData"][35]["spaceHarvested"] > 0


def test_water_balance_reports_demand_supplied_deficit_and_recovered(client):
    body = client.post("/api/simulate", json={"waterAvailability": 60}).json()
    balance = body["lifeSupport"]["water"]
    assert balance["demand"] == pytest.approx(balance["supplied"] + balance["deficit"], abs=0.05)
    assert balance["deficitPercent"] == pytest.approx(40.0, abs=0.1)
    assert balance["recovered"] == pytest.approx(0.9 * balance["supplied"], abs=0.05)
    assert balance["netConsumed"] == pytest.approx(balance["supplied"] - balance["recovered"], abs=0.05)
    assert body["space"]["waterDeficit"] == balance["deficit"]
    # the old flat fields keep their meaning (supplied water)
    assert body["waterUsed"] == balance["supplied"]
    last = body["dailyLifeSupportData"][-1]
    assert last["waterDemand"] > last["waterUsed"] > 0
    assert last["cumulativeWaterDeficit"] == pytest.approx(balance["deficit"], abs=0.05)


def test_comparison_includes_impact_breakdown(client):
    body = client.post("/api/simulate", json=BASE_REQUEST).json()
    comparison = body["comparison"]
    assert comparison["isDefined"] is True
    impact = comparison["impact"]
    assert [f["key"] for f in impact["factors"]] == ["gravity", "radiation", "water", "light", "co2"]
    assert impact["combinedPercent"] == pytest.approx(comparison["differencePercent"], abs=0.15)
    assert sum(f["contributionPoints"] for f in impact["factors"]) == pytest.approx(impact["combinedPercent"], abs=0.3)
    assert impact["limitingFactor"] == "gravity"

    dry = client.post("/api/simulate", json={**BASE_REQUEST, "waterAvailability": 0}).json()
    assert dry["comparison"]["isDefined"] is False
    assert dry["comparison"]["impact"] is None
    assert dry["cropYield"] == 0.0


def test_config_describes_the_model_assumptions(client):
    body = client.get("/api/config").json()
    keys = [a["key"] for a in body["assumptions"]]
    assert {"growth", "gravity", "radiation", "water", "light", "co2", "waterLoop", "gasExchange"} <= set(keys)
    loop = next(a for a in body["assumptions"] if a["key"] == "waterLoop")
    assert loop["constants"]["recoveryEfficiency"] == pytest.approx(0.9)
    assert body["modelStatus"]["phase"] == "Phase 1"
    assert "not validated" in body["modelStatus"]["validation"].lower()

    alone = client.get("/api/assumptions")
    assert alone.status_code == 200
    assert alone.json()["assumptions"] == body["assumptions"]


def test_presets_are_labelled_as_scenarios(client):
    body = client.get("/api/config").json()
    assert [p["label"] for p in body["gravityPresets"]] == ["Microgravity", "Moon-like", "Mars-like", "Earth-like"]
    assert [p["label"] for p in body["radiationPresets"]] == [
        "Earth surface-like",
        "Mars-like",
        "ISS-like",
        "Deep-space-like",
    ]
    assert all(p["description"] for p in body["gravityPresets"] + body["radiationPresets"])
    assert "Phase 1" in body["presetNote"]


def test_daily_growth_carries_cycle_position(client):
    body = client.post("/api/simulate", json={"crop": "lettuce", "simulationDays": 36}).json()
    rows = body["dailyGrowthData"]
    assert rows[0]["growthFraction"] == 0.0 and rows[0]["dayInCycle"] == 0
    assert rows[35]["growthFraction"] == pytest.approx(1.0) and rows[35]["dayInCycle"] == 35
    assert rows[36]["dayInCycle"] == 1 and rows[36]["growthFraction"] < 0.05
