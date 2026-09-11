"""
Water usage and recovery.

Daily water demand follows the canopy: a seedling transpires only a small
fraction of what a full canopy does, so demand ramps up with the growth
fraction of the logistic curve.

    demand(day)    = peakWaterPerDay x area x lightScale
                     x (seedlingFraction + (1 - seedlingFraction) x growthFraction)
    supplied(day)  = demand(day) x waterAvailability / 100
    deficit(day)   = demand(day) - supplied(day)
    recovered(day) = supplied(day) x WATER_RECOVERY_EFFICIENCY

Four quantities, kept apart on purpose:

    demand     what a healthy canopy would want at this growth stage
    supplied   what the system actually delivers (= "used" by the plants)
    deficit    unmet demand - the shortage that is already reducing growth
               through the water factor in `factors.py`
    recovered  the share of the supplied water captured again as condensate

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
    water_used_l: float  # litres actually supplied to (and used by) the crop on this day
    water_recovered_l: float  # litres returned to the loop on this day
    cumulative_water_used_l: float
    cumulative_water_recovered_l: float
    water_demand_l: float = 0.0  # litres a healthy canopy would want on this day
    water_deficit_l: float = 0.0  # unmet demand on this day
    cumulative_water_demand_l: float = 0.0
    cumulative_water_deficit_l: float = 0.0


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
    demand_total = 0.0
    used_total = 0.0
    deficit_total = 0.0
    recovered_total = 0.0

    for point in growth_points:
        if point.day == 0:
            demand = 0.0
        else:
            demand = daily_water_demand_l(crop, point.growth_fraction, growing_area_m2, light_scale)
        supplied = demand * availability
        deficit = max(demand - supplied, 0.0)
        recovered = supplied * efficiency

        demand_total += demand
        used_total += supplied
        deficit_total += deficit
        recovered_total += recovered
        points.append(
            DailyWaterPoint(
                day=point.day,
                water_used_l=supplied,
                water_recovered_l=recovered,
                cumulative_water_used_l=used_total,
                cumulative_water_recovered_l=recovered_total,
                water_demand_l=demand,
                water_deficit_l=deficit,
                cumulative_water_demand_l=demand_total,
                cumulative_water_deficit_l=deficit_total,
            )
        )

    return points


def total_water_used_l(points: list[DailyWaterPoint]) -> float:
    return points[-1].cumulative_water_used_l if points else 0.0


def total_water_recovered_l(points: list[DailyWaterPoint]) -> float:
    return points[-1].cumulative_water_recovered_l if points else 0.0


def total_water_demand_l(points: list[DailyWaterPoint]) -> float:
    return points[-1].cumulative_water_demand_l if points else 0.0


def total_water_deficit_l(points: list[DailyWaterPoint]) -> float:
    return points[-1].cumulative_water_deficit_l if points else 0.0
