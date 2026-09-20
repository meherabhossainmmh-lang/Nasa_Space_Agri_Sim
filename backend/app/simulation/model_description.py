"""
Human-readable description of the Phase 1 model, built from the constants.

The dashboard shows a collapsible "model assumptions" panel. Rather than
hard-coding the numbers a second time in the frontend, the backend describes
its own model here, so a change in `simulation_constants.py` is reflected in
the UI automatically and the constants stay the single source of truth.
"""

from __future__ import annotations

from app.config import simulation_constants as constants

MODEL_STATUS = {
    "phase": "Phase 1",
    "kind": "Mathematical prototype",
    "dataSource": "Documented simulation assumptions (no measured datasets)",
    "validation": "Not validated against NASA or experimental data",
    "planned": [
        "Phase 2 - NASA open-science calibration (GeneLab / OSDR) and model expansion: "
        "climate and nutrient controls (temperature, relative humidity, nutrients, pressure) "
        "and crew-atmosphere balance (human metabolic demand, closed-loop crop + crew life support)",
        "Phase 3 - ML / model fitting: replacing assumed response curves with fitted parameters",
        "Phase 4 - full mission digital twin built on the calibrated model",
    ],
}


def describe_assumptions() -> list[dict]:
    """One entry per model component: formula, constants and a plain-language note."""
    return [
        {
            "key": "growth",
            "title": "Growth curve",
            "formula": "biomass(day) = harvestBiomass × combinedFactor × area × logistic(day / cycleLength)",
            "note": (
                "Each crop follows a normalised logistic (S-shaped) curve over its cycle and is "
                "harvested and replanted when the cycle ends. Biomass that has not reached the end "
                "of a cycle is standing biomass, not harvested yield."
            ),
            "constants": {"logisticSteepness": constants.LOGISTIC_STEEPNESS},
        },
        {
            "key": "gravity",
            "title": "Gravity response",
            "formula": "factor = 1 − penalty × sensitivity × (1 − g) for g < 1; 1 − hyperPenalty × (g − 1) for g > 1",
            "note": (
                "Linear growth penalty as gravity drops from 1 g to 0 g, with a smaller penalty above "
                "1 g. The magnitude is a placeholder; real microgravity effects on biomass are modest "
                "and mixed in the literature."
            ),
            "constants": {
                "microgravityPenalty": constants.MICROGRAVITY_GROWTH_PENALTY,
                "hypergravityPenaltyPerG": constants.HYPERGRAVITY_PENALTY_PER_G,
            },
        },
        {
            "key": "radiation",
            "title": "Radiation response",
            "formula": "factor = exp(−decay × sensitivity × (dose − earthBackground))",
            "note": (
                "Exponential decline of growth with chronic dose rate above Earth background. Plants "
                "tolerate radiation far better than animals; the steepness is chosen so the effect is "
                "visible on the slider, not measured."
            ),
            "constants": {
                "decayPerMgyPerDay": constants.RADIATION_DECAY_PER_MGY_PER_DAY,
                "earthBackgroundMgyPerDay": constants.EARTH_BACKGROUND_RADIATION_MGY_PER_DAY,
            },
        },
        {
            "key": "water",
            "title": "Water response",
            "formula": "factor = (availability / 100) ^ exponent",
            "note": "Growth scales with the share of demand that is actually supplied (linear by default).",
            "constants": {"responseExponent": constants.WATER_RESPONSE_EXPONENT},
        },
        {
            "key": "light",
            "title": "Light response",
            "formula": "factor = [h / (h + K)] / [opt / (opt + K)] − excessPenalty × max(h − opt, 0)",
            "note": (
                "Saturating photoperiod response normalised to the crop's optimal light hours, with a "
                "mild penalty for every hour beyond it (plants need a dark period)."
            ),
            "constants": {
                "saturationHours": constants.LIGHT_SATURATION_HOURS,
                "excessPenaltyPerHour": constants.EXCESS_LIGHT_PENALTY_PER_HOUR,
            },
        },
        {
            "key": "co2",
            "title": "CO₂ response",
            "formula": "factor = [c / (c + K)] / [ambient / (ambient + K)]",
            "note": "Rectangular hyperbola normalised so Earth ambient CO₂ gives 1.0; enrichment saturates.",
            "constants": {
                "halfSaturationPpm": constants.CO2_HALF_SATURATION_PPM,
                "ambientPpm": constants.EARTH_AMBIENT_CO2_PPM,
            },
        },
        {
            "key": "waterLoop",
            "title": "Water demand, supply and recovery",
            "formula": (
                "demand = peakWater × area × lightFactor × (seedling + (1 − seedling) × growthFraction); "
                "supplied = demand × availability; deficit = demand − supplied; recovered = supplied × recovery"
            ),
            "note": (
                "Demand follows the canopy. Water the crop uses is mostly transpired and can be "
                "condensed back; the recovery share is a closed-loop assumption, not a measured "
                "hardware figure."
            ),
            "constants": {
                "recoveryEfficiency": constants.WATER_RECOVERY_EFFICIENCY,
                "seedlingActivityFraction": constants.SEEDLING_ACTIVITY_FRACTION,
            },
        },
        {
            "key": "gasExchange",
            "title": "CO₂ removal and O₂ production",
            "formula": (
                "co2 = (edibleGain / harvestIndex) × dryMatter × carbonFraction × 44/12; o2 = co2 × 32/44"
            ),
            "note": (
                "Gas exchange is derived from the biomass actually put on each day, so it always "
                "moves with growth. Crew-day equivalents are a reference scale only; crew metabolism "
                "and the full atmospheric balance are not modelled."
            ),
            "constants": {
                "carbonFractionOfDryMass": constants.CARBON_FRACTION_OF_DRY_MASS,
                "co2PerCarbon": round(constants.CO2_PER_CARBON_MASS_RATIO, 4),
                "o2PerCo2": round(constants.O2_PER_CO2_MASS_RATIO, 4),
                "crewO2KgPerDay": constants.CREW_MEMBER_O2_KG_PER_DAY,
                "crewCo2KgPerDay": constants.CREW_MEMBER_CO2_KG_PER_DAY,
            },
        },
        {
            "key": "earthReference",
            "title": "Earth reference run",
            "formula": "Earth run = 1 g + background radiation; matched keeps your resources, baseline resets them",
            "note": (
                "Matched resources isolates gravity and radiation by giving the Earth run the same "
                "water, light and CO₂. Earth baseline compares against reference resources instead "
                "(full water, the crop's optimal photoperiod, ambient CO₂)."
            ),
            "constants": {
                "earthGravityG": constants.EARTH_REFERENCE_GRAVITY_G,
                "earthBackgroundMgyPerDay": constants.EARTH_BACKGROUND_RADIATION_MGY_PER_DAY,
                "referenceWaterPercent": constants.EARTH_REFERENCE_WATER_AVAILABILITY,
                "ambientCo2Ppm": constants.EARTH_AMBIENT_CO2_PPM,
            },
        },
    ]
