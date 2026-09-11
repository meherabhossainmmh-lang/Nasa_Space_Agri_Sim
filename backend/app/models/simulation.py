"""
Pydantic schemas for the simulation API.

The request model enforces the parameter ranges defined once in
`simulation_constants.PARAMETER_RANGES`, so the API, the docs and the UI
sliders can never disagree about what a valid input is.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.config import simulation_constants as constants
from app.simulation.crops import list_crop_keys

_R = constants.PARAMETER_RANGES


def _range_field(name: str, description: str, **extra):
    spec = _R[name]
    return Field(
        default=spec["default"],
        ge=spec["min"],
        le=spec["max"],
        description=f"{description} ({spec['unit']}, {spec['min']}-{spec['max']})",
        **extra,
    )


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------
class SimulationRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "crop": "lettuce",
                "gravity": 0.0,
                "radiation": 0.3,
                "waterAvailability": 100,
                "lightHours": 16,
                "co2Level": 1000,
                "simulationDays": 30,
                "growingArea": 10,
                "earthComparisonMode": "matched",
            }
        }
    )

    crop: str = Field(default=constants.DEFAULT_CROP, description="Crop key: lettuce, tomato or radish")
    gravity: float = _range_field("gravity", "Gravity level, Earth = 1.0")
    radiation: float = _range_field("radiation", "Absorbed radiation dose rate")
    waterAvailability: float = _range_field("waterAvailability", "Share of crop water demand that is met")
    lightHours: float = _range_field("lightHours", "Photoperiod")
    co2Level: float = _range_field("co2Level", "Cabin CO2 concentration")
    simulationDays: int = _range_field("simulationDays", "Length of the simulated period")
    growingArea: float = _range_field("growingArea", "Cultivated area")
    earthComparisonMode: Literal["matched", "baseline"] = Field(
        default="matched",
        description=(
            "matched: Earth reference keeps your water/light/CO2 settings; "
            "baseline: Earth reference also uses reference resources"
        ),
    )

    @field_validator("crop")
    @classmethod
    def crop_must_be_supported(cls, value: str) -> str:
        key = value.strip().lower()
        if key not in list_crop_keys():
            raise ValueError(f"unsupported crop '{value}', choose one of: {', '.join(list_crop_keys())}")
        return key


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------
class GrowthFactors(BaseModel):
    light: float
    water: float
    gravity: float
    radiation: float
    co2: float
    combined: float


class DailyGrowthEntry(BaseModel):
    day: int
    cycle: int
    earthBiomass: float = Field(description="Standing (unharvested) biomass on Earth that day (g)")
    spaceBiomass: float = Field(description="Standing (unharvested) biomass in space that day (g)")
    earthCumulative: float = Field(description="Standing + harvested so far on Earth (g)")
    spaceCumulative: float = Field(description="Standing + harvested so far in space (g)")
    earthHarvested: float = Field(0.0, description="Harvested so far on Earth (g)")
    spaceHarvested: float = Field(0.0, description="Harvested so far in space (g)")
    isHarvestDay: bool = Field(False, description="The crop is harvested at the end of this day")


class DailyWaterEntry(BaseModel):
    day: int
    waterUsed: float = Field(description="Water actually supplied to the crop that day (L)")
    waterRecovered: float
    cumulativeWaterUsed: float
    cumulativeWaterRecovered: float
    waterDemand: float = Field(0.0, description="What a healthy canopy would want that day (L)")
    waterDeficit: float = Field(0.0, description="Unmet demand that day (L)")
    cumulativeWaterDemand: float = 0.0
    cumulativeWaterDeficit: float = 0.0


class DailyLifeSupportEntry(BaseModel):
    day: int
    waterUsed: float
    waterRecovered: float
    co2Removed: float
    o2Produced: float
    cumulativeWaterUsed: float
    cumulativeWaterRecovered: float
    cumulativeCo2Removed: float
    cumulativeO2Produced: float
    waterDemand: float = 0.0
    waterDeficit: float = 0.0
    cumulativeWaterDemand: float = 0.0
    cumulativeWaterDeficit: float = 0.0


class ScenarioSummary(BaseModel):
    cropYield: float = Field(description="Edible biomass produced over the run: harvested + standing (g)")
    harvestedYield: float = Field(0.0, description="Edible biomass actually harvested (whole cycles) (g)")
    standingBiomass: float = Field(0.0, description="Unharvested biomass still growing at the end (g)")
    potentialHarvest: float = Field(0.0, description="What one full cycle yields under these conditions (g)")
    growthRate: float = Field(description="Average biomass gain (g/day)")
    waterUsed: float = Field(description="Total water supplied to the crop (L)")
    waterRecovered: float = Field(description="Total water returned to the loop (L)")
    waterDemand: float = Field(0.0, description="Total water a healthy canopy would have wanted (L)")
    waterDeficit: float = Field(0.0, description="Total unmet demand (L)")
    co2Removed: float = Field(description="Total CO2 fixed by the crop (g)")
    estimatedOxygenProduced: float = Field(description="Total O2 released (g)")
    factors: GrowthFactors


class ComparisonSummary(BaseModel):
    earthYield: float
    spaceYield: float
    differenceGrams: float
    differencePercent: float = Field(description="Signed, e.g. -16 means space yields 16 % less")
    spaceGrowthPercentage: float = Field(description="Space yield as % of Earth yield")
    earthComparisonMode: Literal["matched", "baseline"]


class CropSummary(BaseModel):
    key: str
    name: str
    emoji: str
    growthDurationDays: int
    harvestBiomassG: float
    cyclesCompleted: int


class HarvestSummary(BaseModel):
    """
    Keeps 'what is growing' apart from 'what has been harvested'.

    A 30 day lettuce run (35 day cycle) has a large standing biomass but zero
    harvested yield - the crop is simply not ready inside the window.
    """

    standingBiomass: float = Field(description="Unharvested biomass at the end of the run (g)")
    harvestedYield: float = Field(description="Biomass harvested inside the window (g)")
    cumulativeBiomass: float = Field(description="Standing + harvested = total produced (g)")
    potentialHarvest: float = Field(description="Yield of one full cycle under the space conditions (g)")
    cycleLengthDays: int
    cyclesCompleted: int
    harvestDays: list[int] = Field(description="Days inside the window on which a harvest happens")
    nextHarvestDay: int = Field(description="First harvest day after the window ends")
    daysUntilNextHarvest: int = Field(description="Days from the end of the window to the next harvest")
    harvestWithinWindow: bool
    simulationDays: int


class WaterBalance(BaseModel):
    """Water loop totals for the space scenario, all in litres."""

    demand: float = Field(description="What a healthy canopy would have wanted")
    supplied: float = Field(description="What the system actually delivered (= used)")
    deficit: float = Field(description="Unmet demand = demand - supplied")
    recovered: float = Field(description="Supplied water captured again as condensate")
    netConsumed: float = Field(description="Supplied - recovered: fresh make-up water needed")
    recoveryEfficiency: float = Field(description="Assumed recovery fraction (constant)")
    deficitPercent: float = Field(description="Deficit as % of demand")


class LifeSupportContext(BaseModel):
    crewO2DaysSupported: float = Field(description="Person-days of O2 the produced oxygen covers")
    crewCo2DaysRemoved: float = Field(description="Person-days of exhaled CO2 the crop absorbed")
    waterRecoveryEfficiency: float
    water: WaterBalance | None = None


class SimulationResponse(BaseModel):
    # headline numbers for the space scenario (what the metric cards show)
    cropYield: float
    growthRate: float
    waterUsed: float
    waterRecovered: float
    co2Removed: float
    estimatedOxygenProduced: float
    spaceGrowthPercentage: float

    # full detail
    crop: CropSummary
    inputs: SimulationRequest
    space: ScenarioSummary
    earth: ScenarioSummary
    comparison: ComparisonSummary
    harvest: HarvestSummary
    lifeSupport: LifeSupportContext

    # time series for the charts
    dailyGrowthData: list[DailyGrowthEntry]
    dailyWaterData: list[DailyWaterEntry]
    dailyLifeSupportData: list[DailyLifeSupportEntry]

    disclaimer: str


class ParameterRange(BaseModel):
    min: float
    max: float
    step: float
    default: float
    unit: str


class Preset(BaseModel):
    label: str
    value: float


class SimulationConfigResponse(BaseModel):
    """Everything the UI needs to render its controls (single source of truth)."""

    crops: list[dict]
    defaultCrop: str
    parameters: dict[str, ParameterRange]
    durationOptions: list[int]
    gravityPresets: list[Preset]
    radiationPresets: list[Preset]
    disclaimer: str
