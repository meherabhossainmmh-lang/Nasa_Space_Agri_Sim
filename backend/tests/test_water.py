import pytest

from app.config import simulation_constants as constants
from app.simulation import growth, water
from app.simulation.crops import get_crop

LETTUCE = get_crop("lettuce")


def _run(availability=100.0, days=35, area=1.0, light_scale=1.0, growth_factor=1.0):
    g = growth.simulate_growth(LETTUCE, growth_factor, days, area)
    return water.simulate_water(LETTUCE, g, availability, light_scale, area)


def test_day_zero_uses_no_water_and_totals_accumulate():
    pts = _run()
    assert pts[0].water_used_l == 0.0
    assert pts[-1].cumulative_water_used_l == pytest.approx(sum(p.water_used_l for p in pts))
    assert water.total_water_used_l(pts) > 0


def test_recovery_follows_efficiency():
    pts = _run()
    assert water.total_water_recovered_l(pts) == pytest.approx(
        constants.WATER_RECOVERY_EFFICIENCY * water.total_water_used_l(pts)
    )


def test_less_available_water_means_less_used():
    full = water.total_water_used_l(_run(100))
    reduced = water.total_water_used_l(_run(95))
    assert reduced == pytest.approx(0.95 * full)


def test_demand_never_exceeds_peak():
    pts = _run()
    peak = LETTUCE.peak_water_l_per_day
    assert max(p.water_used_l for p in pts) <= peak + 1e-9
    # full canopy at harvest day should be at the peak
    assert pts[-1].water_used_l == pytest.approx(peak)


def test_area_and_light_scale_usage():
    base = water.total_water_used_l(_run())
    assert water.total_water_used_l(_run(area=2.0)) == pytest.approx(2 * base)
    assert water.total_water_used_l(_run(light_scale=0.5)) == pytest.approx(0.5 * base)
