import pytest

from app.config import simulation_constants as constants
from app.simulation.engine import SimulationInput, run_simulation


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


def test_space_yield_lower_than_earth_in_microgravity_with_radiation():
    result = run_simulation(make_input())
    assert result.space.crop_yield_g < result.earth.crop_yield_g
    assert result.yield_difference_percent < 0
    assert result.space_growth_percentage == pytest.approx(
        100 * result.space.crop_yield_g / result.earth.crop_yield_g
    )


def test_earth_conditions_give_identical_scenarios():
    result = run_simulation(make_input(gravity=1.0, radiation=0.01))
    assert result.space.crop_yield_g == pytest.approx(result.earth.crop_yield_g)
    assert result.yield_difference_percent == pytest.approx(0.0)


def test_more_radiation_reduces_growth_yield_and_oxygen():
    low = run_simulation(make_input(radiation=0.1))
    high = run_simulation(make_input(radiation=1.5))
    assert high.space.crop_yield_g < low.space.crop_yield_g
    assert high.space.growth_rate_g_per_day < low.space.growth_rate_g_per_day
    assert high.space.o2_produced_g < low.space.o2_produced_g
    assert high.space.co2_removed_g < low.space.co2_removed_g
    # the Earth reference must not react to space radiation
    assert high.earth.crop_yield_g == pytest.approx(low.earth.crop_yield_g)


def test_five_percent_less_water_reduces_growth_and_water_metrics():
    full = run_simulation(make_input(water_availability=100))
    less = run_simulation(make_input(water_availability=95))
    assert less.space.crop_yield_g == pytest.approx(0.95 * full.space.crop_yield_g)
    assert less.space.water_used_l < full.space.water_used_l
    assert less.space.water_recovered_l < full.space.water_recovered_l


def test_all_daily_series_have_same_length():
    result = run_simulation(make_input(simulation_days=14))
    for scenario in (result.space, result.earth):
        assert len(scenario.daily_growth) == 15
        assert len(scenario.daily_water) == 15
        assert len(scenario.daily_gas) == 15


def test_baseline_mode_uses_reference_resources():
    matched = run_simulation(make_input(co2_level=3000, earth_comparison_mode="matched"))
    baseline = run_simulation(make_input(co2_level=3000, earth_comparison_mode="baseline"))
    assert matched.earth.factors["co2"] > 1.0
    assert baseline.earth.factors["co2"] == pytest.approx(1.0)
    # in baseline mode a full Earth cycle equals the crop's baseline biomass x area
    full = run_simulation(make_input(simulation_days=35, earth_comparison_mode="baseline"))
    assert full.earth.crop_yield_g == pytest.approx(full.crop.harvest_biomass_g * 10.0)


def test_cycles_completed():
    assert run_simulation(make_input(simulation_days=90)).cycles_completed == 2
    assert run_simulation(make_input(simulation_days=7)).cycles_completed == 0


def test_unknown_crop_raises():
    with pytest.raises(KeyError):
        run_simulation(make_input(crop="banana"))
