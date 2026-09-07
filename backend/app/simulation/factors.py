"""
Environmental response factors.

Every function here maps one input parameter to a dimensionless multiplier
where 1.0 means "no effect compared to the Earth reference condition".
The growth model in `engine.py` simply multiplies them together:

    finalGrowth = baselineGrowth
                  x lightFactor
                  x waterFactor
                  x gravityFactor
                  x radiationFactor
                  x co2Factor

All curve shapes and steepness values come from `simulation_constants.py`.
Phase 1 uses deliberately simple, transparent shapes; Phase 2 can swap any
individual function for a calibrated one without touching the others.
"""

from __future__ import annotations

import math

from app.config import simulation_constants as constants
from app.simulation.crops import CropProfile


def _clamp(value: float, low: float = 0.0, high: float | None = None) -> float:
    if value < low:
        return low
    if high is not None and value > high:
        return high
    return value


def gravity_factor(gravity_g: float, crop: CropProfile) -> float:
    """
    Reduced gravity (0 g .. 1 g): linear penalty that reaches
    MICROGRAVITY_GROWTH_PENALTY x crop sensitivity at 0 g.
    Hypergravity (> 1 g): linear penalty of HYPERGRAVITY_PENALTY_PER_G per g.

    Example (average crop): 1 g -> 1.00, 0.38 g (Mars) -> 0.907, 0 g -> 0.85
    """
    if gravity_g < constants.EARTH_REFERENCE_GRAVITY_G:
        shortfall = constants.EARTH_REFERENCE_GRAVITY_G - gravity_g
        penalty = constants.MICROGRAVITY_GROWTH_PENALTY * crop.microgravity_sensitivity * shortfall
    else:
        excess = gravity_g - constants.EARTH_REFERENCE_GRAVITY_G
        penalty = constants.HYPERGRAVITY_PENALTY_PER_G * excess
    return _clamp(1.0 - penalty)


def radiation_factor(radiation_mgy_per_day: float, crop: CropProfile) -> float:
    """
    Exponential decay above Earth background dose rate:

        factor = exp(-k x sensitivity x (dose - background))

    Doses at or below background give 1.0.
    Example (average crop, k = 0.25): 0.3 mGy/day -> 0.93, 1 mGy/day -> 0.78
    """
    excess_dose = radiation_mgy_per_day - constants.EARTH_BACKGROUND_RADIATION_MGY_PER_DAY
    if excess_dose <= 0:
        return 1.0
    exponent = constants.RADIATION_DECAY_PER_MGY_PER_DAY * crop.radiation_sensitivity * excess_dose
    return math.exp(-exponent)


def water_factor(water_availability_percent: float) -> float:
    """
    Power-law response to the share of the crop's water demand that is met.
    With exponent 1.0 this is linear: 95 % water -> 0.95 growth.
    """
    fraction = _clamp(water_availability_percent / 100.0, 0.0, 1.0)
    return fraction**constants.WATER_RESPONSE_EXPONENT


def light_factor(light_hours: float, crop: CropProfile) -> float:
    """
    Saturating response to photoperiod, normalised so the crop's optimal
    photoperiod gives exactly 1.0:

        response(h) = h / (h + LIGHT_SATURATION_HOURS)
        factor      = response(h) / response(optimal)

    Hours beyond the optimum are penalised slightly (plants need a dark
    period), so 24 h light is a bit worse than the optimum, not better.
    Example (optimum 16 h): 0 h -> 0, 8 h -> 0.72, 16 h -> 1.0, 20 h -> ~1.0, 24 h -> 0.96
    """
    if light_hours <= 0:
        return 0.0

    def response(hours: float) -> float:
        return hours / (hours + constants.LIGHT_SATURATION_HOURS)

    factor = response(light_hours) / response(crop.optimal_light_hours)
    if light_hours > crop.optimal_light_hours:
        excess_hours = light_hours - crop.optimal_light_hours
        factor *= 1.0 - constants.EXCESS_LIGHT_PENALTY_PER_HOUR * excess_hours
    return _clamp(factor)


def co2_factor(co2_ppm: float) -> float:
    """
    Rectangular-hyperbola response normalised to Earth ambient CO2:

        response(c) = c / (c + CO2_HALF_SATURATION_PPM)
        factor      = response(c) / response(EARTH_AMBIENT_CO2_PPM)

    Example (half-saturation 150 ppm): 420 ppm -> 1.0, 1000 ppm -> 1.18, 3000 ppm -> 1.29
    """
    if co2_ppm <= 0:
        return 0.0

    def response(ppm: float) -> float:
        return ppm / (ppm + constants.CO2_HALF_SATURATION_PPM)

    return response(co2_ppm) / response(constants.EARTH_AMBIENT_CO2_PPM)


def combined_growth_factor(
    crop: CropProfile,
    gravity_g: float,
    radiation_mgy_per_day: float,
    water_availability_percent: float,
    light_hours: float,
    co2_ppm: float,
) -> dict[str, float]:
    """
    Evaluate every factor once and return them together with their product.
    The individual values are returned too so the UI can explain *why* growth
    changed, not just that it did.
    """
    factors = {
        "light": light_factor(light_hours, crop),
        "water": water_factor(water_availability_percent),
        "gravity": gravity_factor(gravity_g, crop),
        "radiation": radiation_factor(radiation_mgy_per_day, crop),
        "co2": co2_factor(co2_ppm),
    }
    combined = 1.0
    for value in factors.values():
        combined *= value
    factors["combined"] = combined
    return factors
