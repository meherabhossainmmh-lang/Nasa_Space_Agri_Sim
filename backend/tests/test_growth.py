import pytest

from app.simulation import growth
from app.simulation.crops import get_crop

LETTUCE = get_crop("lettuce")  # 35 day cycle, 2000 g/m^2


def test_logistic_progress_endpoints():
    assert growth.logistic_progress(0, 35) == pytest.approx(0.0)
    assert growth.logistic_progress(35, 35) == pytest.approx(1.0)
    assert 0.4 < growth.logistic_progress(17, 35) < 0.6


def test_full_cycle_reaches_harvest_biomass():
    points = growth.simulate_growth(LETTUCE, growth_factor=1.0, simulation_days=35, growing_area_m2=1.0)
    assert len(points) == 36
    assert points[0].biomass_g == pytest.approx(0.0)
    assert points[-1].biomass_g == pytest.approx(LETTUCE.harvest_biomass_g)
    assert growth.total_yield_g(points) == pytest.approx(LETTUCE.harvest_biomass_g)


def test_growth_factor_scales_yield():
    full = growth.simulate_growth(LETTUCE, 1.0, 35, 1.0)
    reduced = growth.simulate_growth(LETTUCE, 0.8, 35, 1.0)
    assert growth.total_yield_g(reduced) == pytest.approx(0.8 * growth.total_yield_g(full))


def test_area_scales_yield():
    one = growth.simulate_growth(LETTUCE, 1.0, 35, 1.0)
    ten = growth.simulate_growth(LETTUCE, 1.0, 35, 10.0)
    assert growth.total_yield_g(ten) == pytest.approx(10 * growth.total_yield_g(one))


def test_biomass_is_monotonic_within_a_cycle():
    points = growth.simulate_growth(LETTUCE, 1.0, 35, 1.0)
    for a, b in zip(points, points[1:]):
        assert b.biomass_g >= a.biomass_g


def test_multiple_cycles_accumulate_harvests():
    points = growth.simulate_growth(LETTUCE, 1.0, 90, 1.0)
    # 90 days = 2 full cycles (70 days) + 20 days into the third
    assert points[35].cycle == 1 and points[36].cycle == 2
    assert points[36].day_in_cycle == 1
    assert points[70].cumulative_biomass_g == pytest.approx(2 * LETTUCE.harvest_biomass_g)
    assert points[-1].cycle == 3
    assert growth.total_yield_g(points) > 2 * LETTUCE.harvest_biomass_g
    # cumulative never decreases
    for a, b in zip(points, points[1:]):
        assert b.cumulative_biomass_g >= a.cumulative_biomass_g - 1e-9


def test_short_run_gives_partial_yield():
    points = growth.simulate_growth(LETTUCE, 1.0, 7, 1.0)
    assert 0 < growth.total_yield_g(points) < LETTUCE.harvest_biomass_g
    assert growth.average_growth_rate_g_per_day(points) > 0


def test_no_harvest_inside_a_short_window():
    # 30 day lettuce run, 35 day cycle: lots of standing biomass, nothing harvested
    points = growth.simulate_growth(LETTUCE, 1.0, 30, 1.0)
    assert growth.harvested_yield_g(points) == 0.0
    assert growth.standing_biomass_g(points) == pytest.approx(growth.total_yield_g(points))
    assert not any(p.is_harvest_day for p in points)
    assert growth.harvest_days(30, 35) == []
    assert growth.next_harvest_day(30, 35) == 35


def test_harvest_day_moves_biomass_from_standing_to_harvested():
    points = growth.simulate_growth(LETTUCE, 1.0, 36, 1.0)
    harvest = points[35]
    assert harvest.is_harvest_day
    assert harvest.harvested_g == pytest.approx(LETTUCE.harvest_biomass_g)
    # the day after the harvest the new cycle starts almost from zero
    assert points[36].biomass_g < 0.05 * LETTUCE.harvest_biomass_g
    assert points[36].harvested_g == pytest.approx(LETTUCE.harvest_biomass_g)


def test_standing_plus_harvested_equals_total():
    for days in (7, 35, 36, 90, 200):
        points = growth.simulate_growth(LETTUCE, 0.9, days, 3.0)
        total = growth.harvested_yield_g(points) + growth.standing_biomass_g(points)
        assert total == pytest.approx(growth.total_yield_g(points))
        for p in points:
            assert p.harvested_g <= p.cumulative_biomass_g + 1e-9


def test_harvest_days_and_next_harvest_for_multiple_cycles():
    assert growth.harvest_days(90, 35) == [35, 70]
    assert growth.next_harvest_day(90, 35) == 105
    assert growth.harvest_days(70, 35) == [35, 70]
    assert growth.next_harvest_day(70, 35) == 105
    assert growth.potential_harvest_g(LETTUCE, 0.5, 10.0) == pytest.approx(0.5 * 10.0 * LETTUCE.harvest_biomass_g)
