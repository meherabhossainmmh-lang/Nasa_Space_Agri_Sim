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
    earthBiomass: float
    spaceBiomass: float
    earthCumulative: float
    spaceCumulative: float


class DailyWaterEntry(BaseModel):
    day: int
    waterUsed: float
    waterRecovered: float
    cumulativeWaterUsed: float
    cumulativeWaterRecovered: float


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


class ScenarioSummary(BaseModel):
    cropYield: float = Field(description="Edible biomass produced over the run (g)")
    growthRate: float = Field(description="Average biomass gain (g/day)")
    waterUsed: float = Field(description="Total water consumed (L)")
    waterRecovered: float = Field(description="Total water returned to the loop (L)")
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


class LifeSupportContext(BaseModel):
    crewO2DaysSupported: float = Field(description="Person-days of O2 the produced oxygen covers")
    crewCo2DaysRemoved: float = Field(description="Person-days of exhaled CO2 the crop absorbed")
    waterRecoveryEfficiency: float


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
