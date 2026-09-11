import pytest

from app.simulation.engine import SimulationInput, run_simulation
from app.simulation.impact import FACTOR_ORDER, decompose_impact


def make_input(**overrides):
    base = dict(
        crop="lettuce",
        gravity=0.0,
        radiation=0.3,
        water_availability=100.0,
        light_hours=16.0,
        co2_level=1000.0,
        simulation_days=30,
        growing_area=10.0,
    )
    base.update(overrides)
    return SimulationInput(**base)


def test_contributions_add_up_to_the_yield_difference():
    for overrides in ({}, {"earth_comparison_mode": "baseline", "water_availability": 80, "co2_level": 3000},
                      {"gravity": 0.38, "radiation": 2.0}, {"gravity": 1.5, "light_hours": 8}):
        result = run_simulation(make_input(**overrides))
        breakdown = result.impact
        total = sum(step.contribution_points for step in breakdown.steps)
        assert total == pytest.approx(breakdown.combined_percent)
        assert breakdown.combined_percent == pytest.approx(result.yield_difference_percent, abs=1e-6)
        assert breakdown.steps[-1].running_percent == pytest.approx(result.space_growth_percentage, abs=1e-6)


def test_matched_mode_gives_resources_zero_contribution():
    result = run_simulation(make_input(co2_level=3000, water_availability=70, light_hours=8))
    by_key = {step.key: step for step in result.impact.steps}
    for key in ("water", "light", "co2"):
        assert by_key[key].contribution_points == pytest.approx(0.0)
        assert by_key[key].percent == pytest.approx(0.0)
    # ...but the absolute response is still reported
    assert by_key["co2"].response_percent > 0
    assert by_key["water"].response_percent < 0
    assert by_key["gravity"].percent == pytest.approx(-15.0)


def test_limiting_and_boosting_factors():
    result = run_simulation(make_input(earth_comparison_mode="baseline"))
    breakdown = result.impact
    assert breakdown.limiting_factor == "gravity"
    assert breakdown.boosting_factor == "co2"

    earth_like = run_simulation(make_input(gravity=1.0, radiation=0.01))
    assert earth_like.impact.limiting_factor is None
    assert earth_like.impact.boosting_factor is None
    assert earth_like.impact.combined_percent == pytest.approx(0.0)


def test_steps_follow_the_fixed_order():
    result = run_simulation(make_input())
    assert [step.key for step in result.impact.steps] == FACTOR_ORDER


def test_zero_earth_reference_is_flagged_as_undefined():
    result = run_simulation(make_input(water_availability=0))
    assert not result.comparison_defined
    assert result.space.crop_yield_g == 0.0
    # both runs produced nothing: reported as identical rather than -100 %
    assert result.space_growth_percentage == pytest.approx(100.0)
    assert result.yield_difference_percent == pytest.approx(0.0)


def test_decompose_handles_both_factors_zero():
    factors = {"light": 1.0, "water": 0.0, "gravity": 0.85, "radiation": 1.0, "co2": 1.0, "combined": 0.0}
    breakdown = decompose_impact(factors, factors)
    assert breakdown.combined_percent == pytest.approx(0.0)
