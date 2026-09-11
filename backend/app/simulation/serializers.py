"""
Turns engine dataclasses into API response models.

Keeping this separate means the engine stays free of Pydantic and the API
shape can evolve without touching the maths.
"""

from __future__ import annotations

from app.config import simulation_constants as constants
from app.models.simulation import (
    ComparisonSummary,
    CropSummary,
    DailyGrowthEntry,
    DailyLifeSupportEntry,
    DailyWaterEntry,
    GrowthFactors,
    HarvestSummary,
    ImpactFactor,
    ImpactSummary,
    LifeSupportContext,
    ScenarioSummary,
    SimulationRequest,
    SimulationResponse,
    WaterBalance,
)
from app.simulation import gas_exchange
from app.simulation.engine import ScenarioResult, SimulationResult

PHASE_1_DISCLAIMER = (
    "Phase 1 mathematical prototype. Outputs are based on documented simulation "
    "assumptions, not on validated NASA data or predictions."
)


def _r(value: float, digits: int = 2) -> float:
    return round(value, digits)


def _scenario_summary(scenario: ScenarioResult) -> ScenarioSummary:
    return ScenarioSummary(
        cropYield=_r(scenario.crop_yield_g, 1),
        harvestedYield=_r(scenario.harvested_yield_g, 1),
        standingBiomass=_r(scenario.standing_biomass_g, 1),
        potentialHarvest=_r(scenario.potential_harvest_g, 1),
        growthRate=_r(scenario.growth_rate_g_per_day, 2),
        waterUsed=_r(scenario.water_used_l, 2),
        waterRecovered=_r(scenario.water_recovered_l, 2),
        waterDemand=_r(scenario.water_demand_l, 2),
        waterDeficit=_r(scenario.water_deficit_l, 2),
        co2Removed=_r(scenario.co2_removed_g, 1),
        estimatedOxygenProduced=_r(scenario.o2_produced_g, 1),
        factors=GrowthFactors(**{k: _r(v, 4) for k, v in scenario.factors.items()}),
    )


def _daily_growth(result: SimulationResult) -> list[DailyGrowthEntry]:
    entries = []
    for earth, space in zip(result.earth.daily_growth, result.space.daily_growth):
        entries.append(
            DailyGrowthEntry(
                day=space.day,
                cycle=space.cycle,
                earthBiomass=_r(earth.biomass_g, 1),
                spaceBiomass=_r(space.biomass_g, 1),
                earthCumulative=_r(earth.cumulative_biomass_g, 1),
                spaceCumulative=_r(space.cumulative_biomass_g, 1),
                earthHarvested=_r(earth.harvested_g, 1),
                spaceHarvested=_r(space.harvested_g, 1),
                isHarvestDay=space.is_harvest_day,
            )
        )
    return entries


def _impact_summary(result: SimulationResult) -> ImpactSummary:
    breakdown = result.impact
    return ImpactSummary(
        factors=[
            ImpactFactor(
                key=step.key,
                label=step.label,
                spaceFactor=_r(step.space_factor, 4),
                earthFactor=_r(step.earth_factor, 4),
                percent=_r(step.percent, 1),
                responsePercent=_r(step.response_percent, 1),
                contributionPoints=_r(step.contribution_points, 1),
                runningPercent=_r(step.running_percent, 1),
            )
            for step in breakdown.steps
        ],
        combinedPercent=_r(breakdown.combined_percent, 1),
        limitingFactor=breakdown.limiting_factor,
        boostingFactor=breakdown.boosting_factor,
    )


def _harvest_summary(result: SimulationResult) -> HarvestSummary:
    space = result.space
    days = result.inputs.simulation_days
    return HarvestSummary(
        standingBiomass=_r(space.standing_biomass_g, 1),
        harvestedYield=_r(space.harvested_yield_g, 1),
        cumulativeBiomass=_r(space.crop_yield_g, 1),
        potentialHarvest=_r(space.potential_harvest_g, 1),
        cycleLengthDays=result.crop.growth_duration_days,
        cyclesCompleted=result.cycles_completed,
        harvestDays=result.harvest_days,
        nextHarvestDay=result.next_harvest_day,
        daysUntilNextHarvest=result.next_harvest_day - days,
        harvestWithinWindow=result.harvest_within_window,
        simulationDays=days,
    )


def _daily_water(scenario: ScenarioResult) -> list[DailyWaterEntry]:
    return [
        DailyWaterEntry(
            day=p.day,
            waterUsed=_r(p.water_used_l, 3),
            waterRecovered=_r(p.water_recovered_l, 3),
            cumulativeWaterUsed=_r(p.cumulative_water_used_l, 2),
            cumulativeWaterRecovered=_r(p.cumulative_water_recovered_l, 2),
            waterDemand=_r(p.water_demand_l, 3),
            waterDeficit=_r(p.water_deficit_l, 3),
            cumulativeWaterDemand=_r(p.cumulative_water_demand_l, 2),
            cumulativeWaterDeficit=_r(p.cumulative_water_deficit_l, 2),
        )
        for p in scenario.daily_water
    ]


def _water_balance(scenario: ScenarioResult) -> WaterBalance:
    demand = scenario.water_demand_l
    return WaterBalance(
        demand=_r(demand, 2),
        supplied=_r(scenario.water_used_l, 2),
        deficit=_r(scenario.water_deficit_l, 2),
        recovered=_r(scenario.water_recovered_l, 2),
        netConsumed=_r(scenario.water_used_l - scenario.water_recovered_l, 2),
        recoveryEfficiency=constants.WATER_RECOVERY_EFFICIENCY,
        deficitPercent=_r(100.0 * scenario.water_deficit_l / demand if demand > 0 else 0.0, 1),
    )


def _daily_life_support(scenario: ScenarioResult) -> list[DailyLifeSupportEntry]:
    entries = []
    for w, g in zip(scenario.daily_water, scenario.daily_gas):
        entries.append(
            DailyLifeSupportEntry(
                day=w.day,
                waterUsed=_r(w.water_used_l, 3),
                waterRecovered=_r(w.water_recovered_l, 3),
                co2Removed=_r(g.co2_removed_g, 2),
                o2Produced=_r(g.o2_produced_g, 2),
                cumulativeWaterUsed=_r(w.cumulative_water_used_l, 2),
                cumulativeWaterRecovered=_r(w.cumulative_water_recovered_l, 2),
                cumulativeCo2Removed=_r(g.cumulative_co2_removed_g, 1),
                cumulativeO2Produced=_r(g.cumulative_o2_produced_g, 1),
                waterDemand=_r(w.water_demand_l, 3),
                waterDeficit=_r(w.water_deficit_l, 3),
                cumulativeWaterDemand=_r(w.cumulative_water_demand_l, 2),
                cumulativeWaterDeficit=_r(w.cumulative_water_deficit_l, 2),
            )
        )
    return entries


def to_response(result: SimulationResult, request: SimulationRequest) -> SimulationResponse:
    space = result.space
    return SimulationResponse(
        cropYield=_r(space.crop_yield_g, 1),
        growthRate=_r(space.growth_rate_g_per_day, 2),
        waterUsed=_r(space.water_used_l, 2),
        waterRecovered=_r(space.water_recovered_l, 2),
        co2Removed=_r(space.co2_removed_g, 1),
        estimatedOxygenProduced=_r(space.o2_produced_g, 1),
        spaceGrowthPercentage=_r(result.space_growth_percentage, 1),
        crop=CropSummary(
            key=result.crop.key,
            name=result.crop.name,
            emoji=result.crop.emoji,
            growthDurationDays=result.crop.growth_duration_days,
            harvestBiomassG=result.crop.harvest_biomass_g,
            cyclesCompleted=result.cycles_completed,
        ),
        inputs=request,
        space=_scenario_summary(space),
        earth=_scenario_summary(result.earth),
        comparison=ComparisonSummary(
            earthYield=_r(result.earth.crop_yield_g, 1),
            spaceYield=_r(space.crop_yield_g, 1),
            differenceGrams=_r(result.yield_difference_g, 1),
            differencePercent=_r(result.yield_difference_percent, 1),
            spaceGrowthPercentage=_r(result.space_growth_percentage, 1),
            earthComparisonMode=request.earthComparisonMode,
            isDefined=result.comparison_defined,
            # no decomposition when the Earth reference produced nothing:
            # the percentages would describe a gap that does not exist
            impact=_impact_summary(result) if result.comparison_defined else None,
        ),
        harvest=_harvest_summary(result),
        lifeSupport=LifeSupportContext(
            crewO2DaysSupported=_r(gas_exchange.crew_o2_days_supported(space.o2_produced_g), 2),
            crewCo2DaysRemoved=_r(gas_exchange.crew_co2_days_removed(space.co2_removed_g), 2),
            waterRecoveryEfficiency=constants.WATER_RECOVERY_EFFICIENCY,
            water=_water_balance(space),
        ),
        dailyGrowthData=_daily_growth(result),
        dailyWaterData=_daily_water(space),
        dailyLifeSupportData=_daily_life_support(space),
        disclaimer=PHASE_1_DISCLAIMER,
    )
