"""
Typed access to the crop baseline parameters.

The engine works with `CropProfile` objects instead of raw dictionaries so the
rest of the code gets attribute access, type hints and one place to add
derived values (e.g. total biomass from edible biomass and harvest index).

Phase 2 idea: build `CropProfile` objects from NASA GeneLab / OSDR derived
values instead of the static table in `simulation_constants.py`. Nothing in
the engine has to change for that.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config import simulation_constants as constants


@dataclass(frozen=True)
class CropProfile:
    key: str
    name: str
    emoji: str
    description: str
    growth_duration_days: int
    harvest_biomass_g: float  # edible fresh biomass per m^2 at harvest
    harvest_index: float
    dry_matter_fraction: float
    peak_water_l_per_day: float  # per m^2 at full canopy
    optimal_light_hours: float
    radiation_sensitivity: float
    microgravity_sensitivity: float

    @property
    def total_biomass_g(self) -> float:
        """Whole-plant fresh biomass per m^2 (edible part / harvest index)."""
        return self.harvest_biomass_g / self.harvest_index

    @property
    def baseline_growth_rate_g_per_day(self) -> float:
        """Average edible biomass gain per m^2 per day over one cycle."""
        return self.harvest_biomass_g / self.growth_duration_days

    def to_dict(self) -> dict:
        """Serialisable summary used by the /api/crops endpoint."""
        return {
            "key": self.key,
            "name": self.name,
            "emoji": self.emoji,
            "description": self.description,
            "growthDurationDays": self.growth_duration_days,
            "harvestBiomassG": self.harvest_biomass_g,
            "baselineGrowthRateGPerDay": round(self.baseline_growth_rate_g_per_day, 2),
            "peakWaterLPerDay": self.peak_water_l_per_day,
            "optimalLightHours": self.optimal_light_hours,
            "radiationSensitivity": self.radiation_sensitivity,
            "microgravitySensitivity": self.microgravity_sensitivity,
        }


def _build_profiles() -> dict[str, CropProfile]:
    profiles: dict[str, CropProfile] = {}
    for key, raw in constants.CROP_BASELINES.items():
        profiles[key] = CropProfile(key=key, **raw)
    return profiles


_PROFILES = _build_profiles()


def list_crop_keys() -> list[str]:
    return list(_PROFILES.keys())


def list_crops() -> list[CropProfile]:
    return list(_PROFILES.values())


def get_crop(key: str) -> CropProfile:
    """Look up a crop by key (case-insensitive). Raises KeyError if unknown."""
    normalised = key.strip().lower()
    if normalised not in _PROFILES:
        raise KeyError(f"Unknown crop '{key}'. Available crops: {', '.join(list_crop_keys())}")
    return _PROFILES[normalised]
