"""
Simulation endpoints.

POST /api/simulate  run the model for the given parameters
GET  /api/crops     list the supported crops and their baseline parameters
GET  /api/config    parameter ranges, defaults and presets for the UI
"""

from fastapi import APIRouter, HTTPException

from app.config import simulation_constants as constants
from app.models.simulation import SimulationConfigResponse, SimulationRequest, SimulationResponse
from app.simulation import crops
from app.simulation.engine import SimulationInput, run_simulation
from app.simulation.serializers import PHASE_1_DISCLAIMER, to_response

router = APIRouter(tags=["simulation"])


@router.post("/simulate", response_model=SimulationResponse)
def simulate(request: SimulationRequest) -> SimulationResponse:
    """Run the Phase 1 simulation for one crop under the given conditions."""
    params = SimulationInput(
        crop=request.crop,
        gravity=request.gravity,
        radiation=request.radiation,
        water_availability=request.waterAvailability,
        light_hours=request.lightHours,
        co2_level=request.co2Level,
        simulation_days=request.simulationDays,
        growing_area=request.growingArea,
        earth_comparison_mode=request.earthComparisonMode,
    )
    try:
        result = run_simulation(params)
    except KeyError as exc:  # unknown crop slipped past validation
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return to_response(result, request)


@router.get("/crops")
def list_crops() -> dict:
    """Supported crops with their (assumed) baseline parameters."""
    return {
        "crops": [crop.to_dict() for crop in crops.list_crops()],
        "note": "Baseline parameters are Phase 1 simulation assumptions, not measured NASA values.",
    }


@router.get("/config", response_model=SimulationConfigResponse)
def simulation_config() -> SimulationConfigResponse:
    """Control ranges, defaults and presets - the UI builds its sliders from this."""
    return SimulationConfigResponse(
        crops=[crop.to_dict() for crop in crops.list_crops()],
        defaultCrop=constants.DEFAULT_CROP,
        parameters=constants.PARAMETER_RANGES,
        durationOptions=constants.SIMULATION_DURATION_OPTIONS,
        gravityPresets=constants.GRAVITY_PRESETS,
        radiationPresets=constants.RADIATION_PRESETS,
        disclaimer=PHASE_1_DISCLAIMER,
    )
