"""
CO2 removal and O2 production (atmosphere revitalisation).

Instead of a separate "CO2 uptake rate" that could drift out of sync with the
growth curve, the gas exchange is derived from the biomass the plants
actually put on each day. That keeps the three outputs consistent: if
radiation cuts growth, CO2 removal and O2 production drop with it.

    totalBiomassGain(day) = edibleBiomassGain(day) / harvestIndex
    dryMassGain(day)      = totalBiomassGain(day) x dryMatterFraction
    carbonFixed(day)      = dryMassGain(day) x CARBON_FRACTION_OF_DRY_MASS
    co2Removed(day)       = carbonFixed(day) x (44 / 12)
    o2Produced(day)       = co2Removed(day) x (32 / 44)

Since the growth curve already includes the environment factors, no extra
CO2 or light scaling is needed here.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config import simulation_constants as constants
from app.simulation.crops import CropProfile
from app.simulation.growth import DailyGrowthPoint


@dataclass(frozen=True)
class DailyGasPoint:
    day: int
    co2_removed_g: float
    o2_produced_g: float
    cumulative_co2_removed_g: float
    cumulative_o2_produced_g: float


def co2_removed_for_biomass_gain(crop: CropProfile, edible_biomass_gain_g: float) -> float:
    """Grams of CO2 fixed to build the given gain in edible fresh biomass."""
    if edible_biomass_gain_g <= 0:
        return 0.0
    total_fresh_gain = edible_biomass_gain_g / crop.harvest_index
    dry_mass_gain = total_fresh_gain * crop.dry_matter_fraction
    carbon_fixed = dry_mass_gain * constants.CARBON_FRACTION_OF_DRY_MASS
    return carbon_fixed * constants.CO2_PER_CARBON_MASS_RATIO


def o2_for_co2_removed(co2_removed_g: float) -> float:
    """Grams of O2 released per grams of CO2 fixed (photosynthesis stoichiometry)."""
    return co2_removed_g * constants.O2_PER_CO2_MASS_RATIO


def simulate_gas_exchange(
    crop: CropProfile,
    growth_points: list[DailyGrowthPoint],
) -> list[DailyGasPoint]:
    """One point per day, aligned with `growth_points`."""
    points: list[DailyGasPoint] = []
    co2_total = 0.0
    o2_total = 0.0
    previous_cumulative_biomass = growth_points[0].cumulative_biomass_g if growth_points else 0.0

    for point in growth_points:
        # Using cumulative biomass keeps harvest days from showing a negative
        # gain when the standing biomass resets for the next cycle.
        gain = point.cumulative_biomass_g - previous_cumulative_biomass
        previous_cumulative_biomass = point.cumulative_biomass_g

        co2 = co2_removed_for_biomass_gain(crop, gain)
        o2 = o2_for_co2_removed(co2)
        co2_total += co2
        o2_total += o2

        points.append(
            DailyGasPoint(
                day=point.day,
                co2_removed_g=co2,
                o2_produced_g=o2,
                cumulative_co2_removed_g=co2_total,
                cumulative_o2_produced_g=o2_total,
            )
        )

    return points


def total_co2_removed_g(points: list[DailyGasPoint]) -> float:
    return points[-1].cumulative_co2_removed_g if points else 0.0


def total_o2_produced_g(points: list[DailyGasPoint]) -> float:
    return points[-1].cumulative_o2_produced_g if points else 0.0


def crew_o2_days_supported(total_o2_g: float) -> float:
    """How many person-days of oxygen the produced O2 corresponds to."""
    return total_o2_g / (constants.CREW_MEMBER_O2_KG_PER_DAY * 1000.0)


def crew_co2_days_removed(total_co2_g: float) -> float:
    """How many person-days of exhaled CO2 the plants absorbed."""
    return total_co2_g / (constants.CREW_MEMBER_CO2_KG_PER_DAY * 1000.0)
