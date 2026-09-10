# SpaceAgriSim 🌱🛰️

**Space Agriculture & Life Support Simulator — Phase 1**

An interactive simulator that models how space and environmental conditions
(gravity, radiation, water, light, CO₂) affect crop growth and the life‑support
metrics that come with it: water use, water recovery, CO₂ removal and O₂
production. Pick a crop, drag a slider, and every metric and chart updates
immediately — for both an Earth reference and your space scenario.

> **Phase 1 is a mathematical simulation prototype.**
> All numbers come from clearly documented simulation assumptions. NASA
> GeneLab/OSDR data integration and machine learning are planned for later
> phases. The current simulator does **not** represent validated NASA
> predictions.

---

## Table of contents

1. [What the project is](#1-what-the-project-is)
2. [Phase 1 scope](#2-phase-1-scope)
3. [What the simulator currently does](#3-what-the-simulator-currently-does)
4. [How the simulation works](#4-how-the-simulation-works)
5. [Current assumptions and limitations](#5-current-assumptions-and-limitations)
6. [Technology stack](#6-technology-stack)
7. [Project structure](#7-project-structure)
8. [Running the frontend](#8-running-the-frontend)
9. [Running the backend](#9-running-the-backend)
10. [Example API request](#10-example-api-request)
11. [Future roadmap](#11-future-roadmap)

---

## 1. What the project is

Long term, SpaceAgriSim aims to become an interactive **Digital Twin for space
agriculture and life support** that combines NASA GeneLab / OSDR open‑science
data with mathematical models. Growing food in space is not just about
calories: plants also recycle water through transpiration, scrub CO₂ from the
cabin and release oxygen, so a crop module is a life‑support component.

Phase 1 proves the core loop: a parameter‑driven simulation engine behind a
clean API, and a dashboard that makes the trade‑offs visible in real time.

## 2. Phase 1 scope

**In scope**

- A transparent, parameter‑driven simulation engine (Python)
- REST API (`POST /api/simulate`, `GET /api/crops`, `GET /api/config`)
- A single‑page futuristic dashboard with live controls, metric cards and charts
- Earth‑vs‑space comparison
- Input validation and error handling
- Unit + API tests for the engine

**Explicitly out of scope (later phases)**

- NASA GeneLab / OSDR integration or dataset downloads
- Machine learning, model training, AI prediction
- Authentication, user accounts, databases
- Real‑time NASA data or any claim of NASA validation

## 3. What the simulator currently does

| Control | Range | Default |
| --- | --- | --- |
| Crop | Lettuce · Tomato · Radish | Lettuce |
| Gravity | 0 – 2 g (presets: microgravity, Moon, Mars, Earth) | 0 g |
| Radiation | 0 – 3 mGy/day (presets: Earth, Mars, ISS orbit, deep space) | 0.3 |
| Water availability | 0 – 100 % | 100 % |
| Light | 0 – 24 h/day | 16 h |
| CO₂ level | 300 – 3000 ppm | 1000 ppm |
| Growing area | 0.1 – 100 m² | 10 m² |
| Simulation duration | 7 · 14 · 30 · 60 · 90 days | 30 days |

For every change the dashboard shows:

- **Metric cards** — 🌱 crop yield, 💧 water used, ♻️ water recovered,
  💨 CO₂ removed, 🫧 estimated O₂ produced, 🌍 space‑vs‑Earth growth
- **Earth vs space panel** — Earth yield, space yield, signed difference in %
  and grams, and the individual growth factors that explain the gap
- **Crop growth chart** — Earth and space biomass curves over the simulated
  days (standing biomass or cumulative yield, harvest markers when a run spans
  more than one crop cycle)
- **Life support chart** — water used / recovered (L) and CO₂ removed /
  O₂ produced (g), per day or cumulative

Example behaviour (defaults, lettuce, 30 days, 10 m²):

```
Earth: 23.1 kg   Space: 18.3 kg   Difference: -20.9 %
```

Raising radiation lowers growth, yield, CO₂ removal and O₂; cutting water
availability by 5 % lowers yield by 5 % and reduces water used / recovered.

## 4. How the simulation works

Everything numerical lives in `backend/app/simulation/`, and every constant in
`backend/app/config/simulation_constants.py`. The UI contains no formulas.

### 4.1 Environment factors (`factors.py`)

Each input maps to a dimensionless multiplier where **1.0 = Earth reference**:

| Factor | Shape | Notes |
| --- | --- | --- |
| Gravity | linear penalty from 1 g down to 0 g (−15 % at 0 g × crop sensitivity), small penalty above 1 g | |
| Radiation | `exp(−k · sensitivity · (dose − background))` | k = 0.25 per mGy/day |
| Water | `(availability / 100) ^ 1.0` | linear |
| Light | saturating `h / (h + 10)` normalised to the crop's optimal photoperiod, mild penalty past the optimum | 24 h light is *not* better than 16 h |
| CO₂ | saturating `c / (c + 150)` normalised to 420 ppm | ≈ +18 % at 1000 ppm |

```
growthFactor = lightFactor × waterFactor × gravityFactor × radiationFactor × co2Factor
```

### 4.2 Growth (`growth.py`)

Biomass follows a logistic (S‑shaped) curve across the crop cycle, scaled by
the growth factor and the growing area:

```
biomass(day) = harvestBiomass × growthFactor × area × logistic(day / cycleLength)
```

If the run is longer than one cycle the crop is harvested and replanted;
`cumulative` biomass keeps counting across harvests.

### 4.3 Water (`water.py`)

Daily demand follows the canopy (a seedling transpires ~15 % of a full
canopy), scales with the light factor, and is cut by the water shortage:

```
demand(day)    = peakWaterPerDay × area × lightFactor × (0.15 + 0.85 × growthFraction)
used(day)      = demand(day) × waterAvailability / 100
recovered(day) = used(day) × 0.90          # condensate recovery efficiency
```

### 4.4 CO₂ and O₂ (`gas_exchange.py`)

Gas exchange is derived from the biomass actually gained each day, so it stays
consistent with growth:

```
dryMassGain = (edibleGain / harvestIndex) × dryMatterFraction
carbonFixed = dryMassGain × 0.42
co2Removed  = carbonFixed × 44/12
o2Produced  = co2Removed × 32/44          # 6 CO2 + 6 H2O -> C6H12O6 + 6 O2
```

### 4.5 Earth vs space (`engine.py`)

The engine runs the pipeline twice. The Earth reference always uses 1 g and
background radiation; in **matched** mode (default) it keeps your water, light
and CO₂ settings so the difference isolates the space environment, in
**baseline** mode it also resets those to reference values.

```
spaceGrowthPercentage = 100 × spaceYield / earthYield
differencePercent     = spaceGrowthPercentage − 100
```

### 4.6 Crop baselines (assumptions, per m²)

| Crop | Cycle | Edible biomass | Peak water | Optimal light | Radiation / µg sensitivity |
| --- | --- | --- | --- | --- | --- |
| Lettuce | 35 d | 2000 g | 2.5 L/day | 16 h | 1.0 / 1.0 |
| Tomato | 80 d | 3500 g | 4.5 L/day | 16 h | 1.2 / 1.2 |
| Radish | 28 d | 1200 g | 2.0 L/day | 14 h | 0.9 / 0.9 |

## 5. Current assumptions and limitations

- All constants are **rounded order‑of‑magnitude assumptions** chosen so the
  prototype behaves sensibly. They are not measured values and not NASA data.
- Factors are multiplied independently; real interactions (e.g. light × CO₂)
  are ignored.
- The gravity penalty is a placeholder; real microgravity effects on biomass
  are modest and mixed in the literature.
- Radiation response is a simple exponential in dose rate; dose type, LET and
  acute vs chronic exposure are not modelled.
- Water recovery uses a fixed 90 % efficiency; no tank sizing or system losses.
- O₂/CO₂ follow textbook stoichiometry with a fixed carbon fraction; respiration,
  root‑zone gas exchange and the crew's own balance are not modelled.
- Temperature, humidity, nutrients, pressure and plant stress are not inputs yet.
- Nothing here has been validated against experimental space‑grown crop data.

## 6. Technology stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite 7, Tailwind CSS 4, Recharts 3 |
| Backend | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| Tests | pytest (engine + API) |
| Tooling | npm, pip, Git |

## 7. Project structure

```
SpaceAgriSim/
├── frontend/
│   ├── index.html
│   ├── vite.config.js          # dev server + /api proxy to FastAPI
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── pages/DashboardPage.jsx
│       ├── components/         # controls, metric cards, panels, header/footer
│       ├── charts/             # GrowthChart, LifeSupportChart, chartTheme
│       ├── hooks/              # useSimulation, useSimulationParams, useSimulationConfig
│       ├── services/           # simulationApi, formatters, validation, defaultConfig
│       └── styles/index.css    # Tailwind + design tokens
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py             # FastAPI app
│   │   ├── routes/             # health, simulation, error handlers
│   │   ├── models/             # Pydantic request/response schemas
│   │   ├── simulation/         # crops, factors, growth, water, gas_exchange, engine, serializers
│   │   └── config/             # settings + simulation_constants (all assumptions)
│   └── tests/                  # pytest suite
├── .gitignore
├── LICENSE
└── README.md
```

## 8. Running the frontend

Requires Node 18+.

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The dev server proxies `/api/*` to `http://127.0.0.1:8000`, so start the
backend too. To point at a different backend, copy `.env.example` to
`.env.local` and set `VITE_BACKEND_URL`.

Production build: `npm run build` (output in `frontend/dist/`).

## 9. Running the backend

Requires Python 3.11+.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health
- Tests: `pytest`

No secrets or credentials are needed. Optional settings (CORS origins) can be
set through environment variables, see `backend/.env.example`.

## 10. Example API request

```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "crop": "lettuce",
    "gravity": 0.0,
    "radiation": 0.3,
    "waterAvailability": 100,
    "lightHours": 16,
    "co2Level": 1000,
    "simulationDays": 30,
    "growingArea": 10,
    "earthComparisonMode": "matched"
  }'
```

Abridged response:

```json
{
  "cropYield": 18268.5,
  "growthRate": 608.95,
  "waterUsed": 389.4,
  "waterRecovered": 350.46,
  "co2Removed": 1563.0,
  "estimatedOxygenProduced": 1136.7,
  "spaceGrowthPercentage": 79.1,
  "crop": { "key": "lettuce", "name": "Lettuce", "growthDurationDays": 35, "cyclesCompleted": 0 },
  "space": {
    "cropYield": 18268.5,
    "factors": { "light": 1.0, "water": 1.0, "gravity": 0.85, "radiation": 0.9301, "co2": 1.1801, "combined": 0.933 }
  },
  "earth": { "cropYield": 23108.4, "...": "..." },
  "comparison": {
    "earthYield": 23108.4,
    "spaceYield": 18268.5,
    "differenceGrams": -4839.9,
    "differencePercent": -20.9,
    "spaceGrowthPercentage": 79.1,
    "earthComparisonMode": "matched"
  },
  "lifeSupport": { "crewO2DaysSupported": 1.35, "crewCo2DaysRemoved": 1.56, "waterRecoveryEfficiency": 0.9 },
  "dailyGrowthData": [
    { "day": 0, "cycle": 1, "earthBiomass": 0.0, "spaceBiomass": 0.0, "earthCumulative": 0.0, "spaceCumulative": 0.0 },
    { "day": 1, "cycle": 1, "earthBiomass": 52.5, "spaceBiomass": 41.5, "earthCumulative": 52.5, "spaceCumulative": 41.5 }
  ],
  "dailyWaterData": [ { "day": 1, "waterUsed": 3.797, "waterRecovered": 3.418, "cumulativeWaterUsed": 3.8, "cumulativeWaterRecovered": 3.42 } ],
  "dailyLifeSupportData": [ { "day": 1, "waterUsed": 3.797, "waterRecovered": 3.418, "co2Removed": 3.55, "o2Produced": 2.58, "cumulativeCo2Removed": 3.5, "cumulativeO2Produced": 2.6 } ],
  "disclaimer": "Phase 1 mathematical prototype. Outputs are based on documented simulation assumptions, not on validated NASA data or predictions."
}
```

Units: biomass / CO₂ / O₂ in grams, water in litres, growth rate in g/day.
Out‑of‑range inputs return `422` with a flat `message` and a per‑field map.

Other endpoints: `GET /api/crops` (baseline parameters), `GET /api/config`
(ranges, defaults, presets — the UI builds its sliders from this),
`GET /api/health`.

## 11. Future roadmap

- **Phase 2 — data calibration**: replace the constants in
  `simulation_constants.py` with values derived from NASA GeneLab / OSDR and
  other public research; the engine is built so only that file (or a data
  loader producing `CropProfile` objects) needs to change.
- **Phase 3 — learning models**: fit response curves / ML models on the
  calibrated data, expose uncertainty bands in the charts.
- **Phase 4 — Digital Twin**: multi‑crop modules, crew demand balancing,
  scenario saving, mission‑level planning (Moon / Mars transit / surface).
- More crops, more inputs (temperature, humidity, nutrients, pressure),
  scenario export and sharing.

---

Phase 1 is a mathematical simulation prototype. NASA GeneLab/OSDR data
integration and ML are planned for later phases. The current simulator does
not represent validated NASA predictions.

Licensed under the [MIT License](LICENSE).
