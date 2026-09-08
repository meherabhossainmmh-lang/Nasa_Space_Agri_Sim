import pytest

from app.config import simulation_constants as constants
from app.simulation import gas_exchange, growth
from app.simulation.crops import get_crop

LETTUCE = get_crop("lettuce")


def test_stoichiometry_ratio():
    co2 = gas_exchange.co2_removed_for_biomass_gain(LETTUCE, 100.0)
    o2 = gas_exchange.o2_for_co2_removed(co2)
    assert o2 / co2 == pytest.approx(32.0 / 44.0)
    assert gas_exchange.co2_removed_for_biomass_gain(LETTUCE, -5.0) == 0.0


def test_totals_match_full_cycle_biomass():
    pts_growth = growth.simulate_growth(LETTUCE, 1.0, 35, 1.0)
    pts_gas = gas_exchange.simulate_gas_exchange(LETTUCE, pts_growth)
    expected_co2 = gas_exchange.co2_removed_for_biomass_gain(LETTUCE, LETTUCE.harvest_biomass_g)
    assert gas_exchange.total_co2_removed_g(pts_gas) == pytest.approx(expected_co2)
    assert gas_exchange.total_o2_produced_g(pts_gas) == pytest.approx(
        expected_co2 * constants.O2_PER_CO2_MASS_RATIO
    )


def test_no_negative_days_across_harvest():
    pts_growth = growth.simulate_growth(LETTUCE, 1.0, 90, 1.0)
    pts_gas = gas_exchange.simulate_gas_exchange(LETTUCE, pts_growth)
    assert all(p.co2_removed_g >= 0 for p in pts_gas)
    assert all(p.o2_produced_g >= 0 for p in pts_gas)


def test_worse_growth_means_less_gas_exchange():
    good = gas_exchange.simulate_gas_exchange(LETTUCE, growth.simulate_growth(LETTUCE, 1.0, 35, 1.0))
    bad = gas_exchange.simulate_gas_exchange(LETTUCE, growth.simulate_growth(LETTUCE, 0.7, 35, 1.0))
    assert gas_exchange.total_o2_produced_g(bad) == pytest.approx(0.7 * gas_exchange.total_o2_produced_g(good))


def test_crew_scale_helpers():
    assert gas_exchange.crew_o2_days_supported(840.0) == pytest.approx(1.0)
    assert gas_exchange.crew_co2_days_removed(1000.0) == pytest.approx(1.0)
