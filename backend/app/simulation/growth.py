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

Three quantities are kept apart on purpose, because they answer different
questions:

    standing biomass   what is growing in the chamber right now (unharvested)
    harvested yield    what has actually been cut and stored (whole cycles)
    cumulative biomass standing + harvested = everything the crop produced

A 30 day lettuce run (35 day cycle) therefore has 0 g harvested yield even
though the standing biomass is large - the crop simply is not ready yet.
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
    harvested_g: float = 0.0  # edible biomass harvested up to and including this day
    is_harvest_day: bool = False  # the crop reaches maturity and is cut on this day


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

        # Harvest happens at the end of the harvest day, so the harvested total
        # already includes this cycle on that day while the curve still shows
        # the mature crop being cut.
        harvests_done = day // cycle_length if day > 0 else 0
        is_harvest_day = day > 0 and day_in_cycle == cycle_length

        points.append(
            DailyGrowthPoint(
                day=day,
                cycle=cycle,
                day_in_cycle=day_in_cycle,
                biomass_g=standing,
                cumulative_biomass_g=harvested_total + standing,
                growth_fraction=fraction,
                harvested_g=harvests_done * potential_harvest_g,
                is_harvest_day=is_harvest_day,
            )
        )

    return points


def potential_harvest_g(crop: CropProfile, growth_factor: float, growing_area_m2: float) -> float:
    """Edible biomass one full cycle yields under these conditions (g)."""
    return crop.harvest_biomass_g * growth_factor * growing_area_m2


def harvest_days(simulation_days: int, cycle_length_days: int) -> list[int]:
    """Days on which a harvest happens inside the simulation window."""
    if cycle_length_days <= 0:
        return []
    return list(range(cycle_length_days, simulation_days + 1, cycle_length_days))


def next_harvest_day(simulation_days: int, cycle_length_days: int) -> int:
    """First harvest day after the simulation window ends."""
    if cycle_length_days <= 0:
        return simulation_days
    return (simulation_days // cycle_length_days + 1) * cycle_length_days


def total_yield_g(points: list[DailyGrowthPoint]) -> float:
    """Edible biomass produced by the end of the run (harvested + standing)."""
    return points[-1].cumulative_biomass_g if points else 0.0


def harvested_yield_g(points: list[DailyGrowthPoint]) -> float:
    """Edible biomass actually harvested by the end of the run (whole cycles only)."""
    return points[-1].harvested_g if points else 0.0


def standing_biomass_g(points: list[DailyGrowthPoint]) -> float:
    """
    Unharvested biomass still growing when the run ends.

    Defined as total minus harvested so the three summary numbers always add
    up. When the last day is a harvest day the crop was just cut, so the
    standing biomass is zero even though the curve peaks on that day.
    """
    if not points:
        return 0.0
    return max(points[-1].cumulative_biomass_g - points[-1].harvested_g, 0.0)


def average_growth_rate_g_per_day(points: list[DailyGrowthPoint]) -> float:
    """Mean biomass gain per day across the whole simulation window."""
    if len(points) < 2:
        return 0.0
    days = points[-1].day - points[0].day
    return (points[-1].cumulative_biomass_g - points[0].cumulative_biomass_g) / days
