import math

import pytest

from app.config import simulation_constants as constants
from app.simulation import factors
from app.simulation.crops import get_crop

LETTUCE = get_crop("lettuce")


def test_gravity_factor_is_one_on_earth_and_lower_in_microgravity():
    assert factors.gravity_factor(1.0, LETTUCE) == pytest.approx(1.0)
    micro = factors.gravity_factor(0.0, LETTUCE)
    mars = factors.gravity_factor(0.38, LETTUCE)
    assert micro < mars < 1.0
    assert micro == pytest.approx(1.0 - constants.MICROGRAVITY_GROWTH_PENALTY)


def test_hypergravity_also_penalised():
    assert factors.gravity_factor(2.0, LETTUCE) < 1.0


def test_radiation_factor_decreases_monotonically():
    doses = [0.0, 0.01, 0.3, 1.0, 3.0]
    values = [factors.radiation_factor(d, LETTUCE) for d in doses]
    assert values[0] == 1.0 and values[1] == 1.0
    assert all(a >= b for a, b in zip(values, values[1:]))
    assert values[-1] > 0.0


def test_radiation_sensitivity_matters():
    tomato = get_crop("tomato")
    radish = get_crop("radish")
    assert factors.radiation_factor(1.0, tomato) < factors.radiation_factor(1.0, radish)


def test_water_factor_linear_by_default():
    assert factors.water_factor(100) == pytest.approx(1.0)
    assert factors.water_factor(95) == pytest.approx(0.95 ** constants.WATER_RESPONSE_EXPONENT)
    assert factors.water_factor(0) == 0.0
    assert factors.water_factor(150) == pytest.approx(1.0)  # capped


def test_light_factor_saturates_and_peaks_near_optimum():
    assert factors.light_factor(0, LETTUCE) == 0.0
    assert factors.light_factor(LETTUCE.optimal_light_hours, LETTUCE) == pytest.approx(1.0)
    assert factors.light_factor(8, LETTUCE) < 1.0
    # 24 h is not dramatically better than the optimum
    assert factors.light_factor(24, LETTUCE) < 1.05


def test_co2_factor_normalised_to_earth_ambient():
    assert factors.co2_factor(constants.EARTH_AMBIENT_CO2_PPM) == pytest.approx(1.0)
    assert factors.co2_factor(1000) > 1.0
    assert factors.co2_factor(3000) > factors.co2_factor(1000)
    assert factors.co2_factor(300) < 1.0


def test_combined_factor_is_product_of_parts():
    result = factors.combined_growth_factor(LETTUCE, 0.0, 0.3, 90, 16, 1000)
    expected = math.prod(v for k, v in result.items() if k != "combined")
    assert result["combined"] == pytest.approx(expected)
