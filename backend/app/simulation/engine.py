"""
Simulation engine - the single entry point the API calls.

    run_simulation(SimulationInput) -> SimulationResult

The engine orchestrates the individual modules:

    factors.py       environment multipliers (light, water, gravity, radiation, CO2)
    growth.py        daily biomass curve
    water.py         daily water use / recovery
    gas_exchange.py  daily CO2 removal / O2 production

and runs the whole pipeline twice: once for the user's space scenario and
once for an Earth reference scenario, so the caller gets the comparison for
free. No formulas live in this file - only wiring and bookkeeping.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.config import simulation_constants as constants
from app.simulation import factors, gas_exchange, growth, water
from app.simulation.crops import CropProfile, get_crop


# ---------------------------------------------------------------------------
# Input / output containers (plain dataclasses; the API layer maps them to
# Pydantic models so the engine stays framework-free)
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class SimulationInput:
    crop: str
    gravity: float
    radiation: float
    water_availability: float
    light_hours: float
    co2_level: float
    simulation_days: int
    growing_area: float = constants.PARAMETER_RANGES["growingArea"]["default"]
    # "matched": Earth run keeps the user's water/light/CO2 (isolates gravity + radiation)
    # "baseline": Earth run also resets water/light/CO2 to the crop's reference values
    earth_comparison_mode: str = "matched"


@dataclass(frozen=True)
class ScenarioResult:
    """Everything the pipeline produced for one environment."""

    label: str
    factors: dict[str, float]
    crop_yield_g: float
    growth_rate_g_per_day: float
    water_used_l: float
    water_recovered_l: float
    co2_removed_g: float
    o2_produced_g: float
    daily_growth: list[growth.DailyGrowthPoint] = field(repr=False)
    daily_water: list[water.DailyWaterPoint] = field(repr=False)
    daily_gas: list[gas_exchange.DailyGasPoint] = field(repr=False)


@dataclass(frozen=True)
class SimulationResult:
    crop: CropProfile
    inputs: SimulationInput
    space: ScenarioResult
    earth: ScenarioResult

    # -- comparison helpers --------------------------------------------------
    @property
    def space_growth_percentage(self) -> float:
        """Space yield as a percentage of the Earth yield (100 = identical)."""
        if self.earth.crop_yield_g <= 0:
            return 0.0
        return 100.0 * self.space.crop_yield_g / self.earth.crop_yield_g

    @property
    def yield_difference_percent(self) -> float:
        """Signed difference, e.g. -16.0 means space yields 16 % less than Earth."""
        return self.space_growth_percentage - 100.0

    @property
    def yield_difference_g(self) -> float:
        return self.space.crop_yield_g - self.earth.crop_yield_g

    @property
    def cycles_completed(self) -> int:
        return self.inputs.simulation_days // self.crop.growth_duration_days


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------
def _run_scenario(
    label: str,
    crop: CropProfile,
    gravity: float,
    radiation: float,
    water_availability: float,
    light_hours: float,
    co2_level: float,
    simulation_days: int,
    growing_area: float,
) -> ScenarioResult:
    env = factors.combined_growth_factor(
        crop,
        gravity_g=gravity,
        radiation_mgy_per_day=radiation,
        water_availability_percent=water_availability,
        light_hours=light_hours,
        co2_ppm=co2_level,
    )

    daily_growth = growth.simulate_growth(crop, env["combined"], simulation_days, growing_area)
    daily_water = water.simulate_water(
        crop,
        daily_growth,
        water_availability_percent=water_availability,
        light_scale=env["light"],
        growing_area_m2=growing_area,
    )
    daily_gas = gas_exchange.simulate_gas_exchange(crop, daily_growth)

    return ScenarioResult(
        label=label,
        factors=env,
        crop_yield_g=growth.total_yield_g(daily_growth),
        growth_rate_g_per_day=growth.average_growth_rate_g_per_day(daily_growth),
        water_used_l=water.total_water_used_l(daily_water),
        water_recovered_l=water.total_water_recovered_l(daily_water),
        co2_removed_g=gas_exchange.total_co2_removed_g(daily_gas),
        o2_produced_g=gas_exchange.total_o2_produced_g(daily_gas),
        daily_growth=daily_growth,
        daily_water=daily_water,
        daily_gas=daily_gas,
    )


def earth_reference_conditions(params: SimulationInput, crop: CropProfile) -> dict[str, float]:
    """
    Conditions for the Earth comparison run.

    matched  -> Earth gravity + background radiation, user's resources kept
    baseline -> Earth gravity + background radiation + reference resources
                (100 % water, crop's optimal photoperiod, ambient CO2)
    """
    conditions = {
        "gravity": constants.EARTH_REFERENCE_GRAVITY_G,
        "radiation": constants.EARTH_BACKGROUND_RADIATION_MGY_PER_DAY,
        "water_availability": params.water_availability,
        "light_hours": params.light_hours,
        "co2_level": params.co2_level,
    }
    if params.earth_comparison_mode == "baseline":
        conditions.update(
            water_availability=constants.EARTH_REFERENCE_WATER_AVAILABILITY,
            light_hours=crop.optimal_light_hours,
            co2_level=constants.EARTH_AMBIENT_CO2_PPM,
        )
    return conditions


def run_simulation(params: SimulationInput) -> SimulationResult:
    """Run the space scenario and its Earth reference and bundle the results."""
    crop = get_crop(params.crop)

    space = _run_scenario(
        "space",
        crop,
        gravity=params.gravity,
        radiation=params.radiation,
        water_availability=params.water_availability,
        light_hours=params.light_hours,
        co2_level=params.co2_level,
        simulation_days=params.simulation_days,
        growing_area=params.growing_area,
    )

    earth_conditions = earth_reference_conditions(params, crop)
    earth = _run_scenario(
        "earth",
        crop,
        simulation_days=params.simulation_days,
        growing_area=params.growing_area,
        **earth_conditions,
    )

    return SimulationResult(crop=crop, inputs=params, space=space, earth=earth)
