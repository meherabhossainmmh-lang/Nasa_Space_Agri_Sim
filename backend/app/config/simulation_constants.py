"""
Central place for every number the simulation engine relies on.

=============================================================================
 PHASE 1 NOTICE
 All values in this file are SIMULATION ASSUMPTIONS / BASELINE PARAMETERS.
 They are rounded, order-of-magnitude figures chosen so the prototype behaves
 sensibly. They are NOT validated NASA predictions. In later phases these
 numbers are meant to be replaced or calibrated against NASA GeneLab / OSDR
 and other public research data without touching the calculation code.
=============================================================================

Units used throughout the engine:
    biomass   -> grams of fresh weight (per square metre unless scaled by area)
    water     -> litres
    CO2 / O2  -> grams
    gravity   -> g (Earth = 1.0)
    radiation -> mGy per day (absorbed dose rate)
    light     -> hours of light per day (photoperiod)
    CO2 level -> ppm
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Crop baseline parameters (per 1 m^2 growing area, Earth controlled-environment)
# ---------------------------------------------------------------------------
# growth_duration_days      days from planting to harvest
# harvest_biomass_g         expected edible fresh biomass at harvest, per m^2
# harvest_index             edible biomass / total plant biomass (roots, stems
#                           and leaves also fix CO2, so life-support maths uses
#                           the total)
# dry_matter_fraction       dry mass / fresh mass (most fresh produce is ~95% water)
# peak_water_l_per_day      water demand per m^2 at full canopy
# optimal_light_hours       photoperiod at which the light factor equals 1.0
# radiation_sensitivity     multiplier on the radiation penalty (1.0 = average)
# microgravity_sensitivity  multiplier on the reduced-gravity penalty (1.0 = average)
CROP_BASELINES: dict[str, dict] = {
    "lettuce": {
        "name": "Lettuce",
        "emoji": "🥬",
        "description": "Fast leafy crop, already grown on the ISS in the Veggie system.",
        "growth_duration_days": 35,
        "harvest_biomass_g": 2000.0,
        "harvest_index": 0.90,
        "dry_matter_fraction": 0.05,
        "peak_water_l_per_day": 2.5,
        "optimal_light_hours": 16.0,
        "radiation_sensitivity": 1.0,
        "microgravity_sensitivity": 1.0,
    },
    "tomato": {
        "name": "Tomato",
        "emoji": "🍅",
        "description": "Dwarf fruiting crop with a long cycle and high resource demand.",
        "growth_duration_days": 80,
        "harvest_biomass_g": 3500.0,
        "harvest_index": 0.60,
        "dry_matter_fraction": 0.06,
        "peak_water_l_per_day": 4.5,
        "optimal_light_hours": 16.0,
        "radiation_sensitivity": 1.2,
        "microgravity_sensitivity": 1.2,
    },
    "radish": {
        "name": "Radish",
        "emoji": "🌱",
        "description": "Very short cycle root crop, robust and low maintenance.",
        "growth_duration_days": 28,
        "harvest_biomass_g": 1200.0,
        "harvest_index": 0.60,
        "dry_matter_fraction": 0.05,
        "peak_water_l_per_day": 2.0,
        "optimal_light_hours": 14.0,
        "radiation_sensitivity": 0.9,
        "microgravity_sensitivity": 0.9,
    },
}

DEFAULT_CROP = "lettuce"

# ---------------------------------------------------------------------------
# Earth reference conditions
# ---------------------------------------------------------------------------
# The Earth scenario always uses Earth gravity and background radiation.
# By default ("matched" mode) it keeps the user's water / light / CO2 settings
# so the Earth-vs-space difference isolates the space environment itself.
# In "baseline" mode it also resets those resources to the reference values
# below, which makes the Earth yield equal to the crop's baseline biomass.
EARTH_REFERENCE_GRAVITY_G = 1.0
EARTH_BACKGROUND_RADIATION_MGY_PER_DAY = 0.01
EARTH_AMBIENT_CO2_PPM = 420.0  # also the reference point of the CO2 response curve
EARTH_REFERENCE_WATER_AVAILABILITY = 100.0

# ---------------------------------------------------------------------------
# Environment response constants
# ---------------------------------------------------------------------------
# Gravity: linear penalty as gravity drops from 1 g to 0 g, plus a smaller
# penalty for hypergravity above 1 g. Real microgravity effects on biomass are
# modest and mixed in the literature - this is a placeholder magnitude.
MICROGRAVITY_GROWTH_PENALTY = 0.15  # growth lost at 0 g (before crop sensitivity)
HYPERGRAVITY_PENALTY_PER_G = 0.10  # growth lost per g above 1 g

# Radiation: exponential decay of growth with dose rate above Earth background.
# Plants tolerate chronic radiation far better than animals; the steepness here
# is a placeholder so the effect is visible on the slider, not a measured value.
RADIATION_DECAY_PER_MGY_PER_DAY = 0.25

# Light: saturating response normalised to the crop's optimal photoperiod,
# with a mild penalty for every hour beyond it (plants need a dark period).
LIGHT_SATURATION_HOURS = 10.0
EXCESS_LIGHT_PENALTY_PER_HOUR = 0.01

# CO2: rectangular hyperbola normalised so Earth ambient CO2 gives 1.0.
# Enrichment to ~1000 ppm yields roughly +20 %, saturating around +30 %.
CO2_HALF_SATURATION_PPM = 150.0

# Water: growth scales with (availability / 100) ** exponent. 1.0 = linear,
# following the roughly proportional biomass-transpiration relationship.
WATER_RESPONSE_EXPONENT = 1.0

# ---------------------------------------------------------------------------
# Growth curve
# ---------------------------------------------------------------------------
# Biomass follows a logistic (S-shaped) curve over each crop cycle. When the
# simulation runs longer than one cycle the crop is harvested and replanted.
LOGISTIC_STEEPNESS = 10.0

# Fraction of peak water demand assumed right after planting
# (seedlings and the growing medium still lose some water).
SEEDLING_ACTIVITY_FRACTION = 0.15

# ---------------------------------------------------------------------------
# Life support
# ---------------------------------------------------------------------------
# Share of the water the plants transpire that is captured again as condensate
# and returned to the loop (closed-loop life support assumption).
WATER_RECOVERY_EFFICIENCY = 0.90

# Carbon share of plant dry mass (rounded, widely used value).
CARBON_FRACTION_OF_DRY_MASS = 0.42

# Photosynthesis stoichiometry: 6 CO2 + 6 H2O -> C6H12O6 + 6 O2
CO2_PER_CARBON_MASS_RATIO = 44.0 / 12.0  # g CO2 fixed per g carbon in biomass
O2_PER_CO2_MASS_RATIO = 32.0 / 44.0  # g O2 released per g CO2 fixed

# Approximate daily needs of one crew member (rounded public figures, used only
# to give the CO2 / O2 numbers a human scale).
CREW_MEMBER_O2_KG_PER_DAY = 0.84
CREW_MEMBER_CO2_KG_PER_DAY = 1.0

# ---------------------------------------------------------------------------
# Input parameter ranges (single source of truth for API validation and UI)
# ---------------------------------------------------------------------------
PARAMETER_RANGES: dict[str, dict] = {
    "gravity": {"min": 0.0, "max": 2.0, "step": 0.01, "default": 0.0, "unit": "g"},
    "radiation": {"min": 0.0, "max": 3.0, "step": 0.01, "default": 0.3, "unit": "mGy/day"},
    "waterAvailability": {"min": 0.0, "max": 100.0, "step": 1.0, "default": 100.0, "unit": "%"},
    "lightHours": {"min": 0.0, "max": 24.0, "step": 0.5, "default": 16.0, "unit": "h/day"},
    "co2Level": {"min": 300.0, "max": 3000.0, "step": 10.0, "default": 1000.0, "unit": "ppm"},
    "growingArea": {"min": 0.1, "max": 100.0, "step": 0.1, "default": 10.0, "unit": "m²"},
    "simulationDays": {"min": 1, "max": 365, "step": 1, "default": 30, "unit": "days"},
}

SIMULATION_DURATION_OPTIONS = [7, 14, 30, 60, 90]

# Handy reference points for the UI (rounded, order-of-magnitude values).
GRAVITY_PRESETS = [
    {"label": "Microgravity", "value": 0.0},
    {"label": "Moon", "value": 0.16},
    {"label": "Mars", "value": 0.38},
    {"label": "Earth", "value": 1.0},
]

RADIATION_PRESETS = [
    {"label": "Earth surface", "value": 0.01},
    {"label": "Mars surface", "value": 0.2},
    {"label": "ISS orbit", "value": 0.3},
    {"label": "Deep space", "value": 0.5},
]
