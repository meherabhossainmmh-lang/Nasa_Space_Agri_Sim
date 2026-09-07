"""
Water usage and recovery.

Daily water demand follows the canopy: a seedling transpires only a small
fraction of what a full canopy does, so demand ramps up with the growth
fraction of the logistic curve.

    demand(day)    = peakWaterPerDay x area x lightScale
                     x (seedlingFraction + (1 - seedlingFraction) x growthFraction)
    used(day)      = demand(day) x waterAvailability / 100
    recovered(day) = used(day) x WATER_RECOVERY_EFFICIENCY

`lightScale` is the light factor: longer photoperiods mean more hours of
transpiration. Water that plants use does not disappear - most of it is
transpired into the cabin air and can be condensed back, which is what the
recovery efficiency represents (closed-loop assumption from the constants).
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config import simulation_constants as constants
from app.simulation.crops import CropProfile
from app.simulation.growth import DailyGrowthPoint


@dataclass(frozen=True)
class DailyWaterPoint:
    day: int
    water_used_l: float  # litres consumed on this day
    water_recovered_l: float  # litres returned to the loop on this day
    cumulative_water_used_l: float
    cumulative_water_recovered_l: float


def daily_water_demand_l(
    crop: CropProfile,
    growth_fraction: float,
    growing_area_m2: float,
    light_scale: float,
) -> float:
    """Water a healthy canopy at this growth stage would want (before shortage)."""
    seedling = constants.SEEDLING_ACTIVITY_FRACTION
    canopy_scale = seedling + (1.0 - seedling) * growth_fraction
    return crop.peak_water_l_per_day * growing_area_m2 * light_scale * canopy_scale


def simulate_water(
    crop: CropProfile,
    growth_points: list[DailyGrowthPoint],
    water_availability_percent: float,
    light_scale: float,
    growing_area_m2: float,
) -> list[DailyWaterPoint]:
    """One point per day, aligned with `growth_points` (day 0 uses no water)."""
    availability = min(max(water_availability_percent, 0.0), 100.0) / 100.0
    efficiency = constants.WATER_RECOVERY_EFFICIENCY

    points: list[DailyWaterPoint] = []
    used_total = 0.0
    recovered_total = 0.0

    for point in growth_points:
        if point.day == 0:
            used = 0.0
        else:
            demand = daily_water_demand_l(crop, point.growth_fraction, growing_area_m2, light_scale)
            used = demand * availability
        recovered = used * efficiency

        used_total += used
        recovered_total += recovered
        points.append(
            DailyWaterPoint(
                day=point.day,
                water_used_l=used,
                water_recovered_l=recovered,
                cumulative_water_used_l=used_total,
                cumulative_water_recovered_l=recovered_total,
            )
        )

    return points


def total_water_used_l(points: list[DailyWaterPoint]) -> float:
    return points[-1].cumulative_water_used_l if points else 0.0


def total_water_recovered_l(points: list[DailyWaterPoint]) -> float:
    return points[-1].cumulative_water_recovered_l if points else 0.0
