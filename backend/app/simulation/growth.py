"""
Crop growth over time.

The crop follows a logistic (S-shaped) biomass curve across its growth cycle.
The combined environment factor from `factors.py` scales the whole curve, so
worse conditions mean a lower harvest at the same day count.

    biomass(day) = harvestBiomass x growthFactor x area x logistic(day / cycleLength)

If the simulation runs longer than one cycle the crop is harvested and the
next cycle starts on the following day (continuous production, the way a
space greenhouse would actually be operated). `cumulative_biomass` keeps the
harvested total so yield keeps climbing across cycles.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from app.config import simulation_constants as constants
from app.simulation.crops import CropProfile


@dataclass(frozen=True)
class DailyGrowthPoint:
    day: int
    cycle: int  # 1-based index of the crop cycle this day belongs to
    day_in_cycle: int
    biomass_g: float  # standing edible biomass on this day
    cumulative_biomass_g: float  # standing biomass + everything harvested so far
    growth_fraction: float  # 0..1 position on the logistic curve


def logistic_progress(day_in_cycle: int, cycle_length_days: int) -> float:
    """
    Normalised logistic curve on [0, 1] that is exactly 0 at day 0 and exactly
    1 at the end of the cycle (the raw logistic never quite reaches either).
    """
    if cycle_length_days <= 0:
        return 1.0
    t = min(max(day_in_cycle / cycle_length_days, 0.0), 1.0)
    k = constants.LOGISTIC_STEEPNESS

    def raw(x: float) -> float:
        return 1.0 / (1.0 + math.exp(-k * (x - 0.5)))

    low, high = raw(0.0), raw(1.0)
    return (raw(t) - low) / (high - low)


def simulate_growth(
    crop: CropProfile,
    growth_factor: float,
    simulation_days: int,
    growing_area_m2: float,
) -> list[DailyGrowthPoint]:
    """
    Produce one data point per day from day 0 (planting) to `simulation_days`.

    growth_factor   combined environment multiplier (1.0 = Earth reference)
    growing_area_m2 scales the per-m^2 baseline to the actual growing area
    """
    cycle_length = crop.growth_duration_days
    potential_harvest_g = crop.harvest_biomass_g * growth_factor * growing_area_m2

    points: list[DailyGrowthPoint] = []
    harvested_total = 0.0

    for day in range(simulation_days + 1):
        # Day 0 is planting. Each cycle covers days 1..cycle_length, the day
        # after a harvest is day 1 of the next cycle.
        if day == 0:
            cycle, day_in_cycle = 1, 0
        else:
            cycle = (day - 1) // cycle_length + 1
            day_in_cycle = (day - 1) % cycle_length + 1

        # Add the previous cycle's harvest to the running total once we move on.
        completed_cycles = (day - 1) // cycle_length if day > 0 else 0
        harvested_total = completed_cycles * potential_harvest_g

        fraction = logistic_progress(day_in_cycle, cycle_length)
        standing = potential_harvest_g * fraction

        points.append(
            DailyGrowthPoint(
                day=day,
                cycle=cycle,
                day_in_cycle=day_in_cycle,
                biomass_g=standing,
                cumulative_biomass_g=harvested_total + standing,
                growth_fraction=fraction,
            )
        )

    return points


def total_yield_g(points: list[DailyGrowthPoint]) -> float:
    """Edible biomass produced by the end of the run (harvested + standing)."""
    return points[-1].cumulative_biomass_g if points else 0.0


def average_growth_rate_g_per_day(points: list[DailyGrowthPoint]) -> float:
    """Mean biomass gain per day across the whole simulation window."""
    if len(points) < 2:
        return 0.0
    days = points[-1].day - points[0].day
    return (points[-1].cumulative_biomass_g - points[0].cumulative_biomass_g) / days
