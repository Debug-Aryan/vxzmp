# GridBricks Wind Forecast Analytics Platform

> **REint / GridBricks Internship Assessment**  
> Quantitative day-ahead renewable generation forecast evaluation for Great Britain wholesale electricity markets using live Elexon BMRS data.

[![Backend Tests](https://img.shields.io/badge/Pytest-17%20Passed-emerald.svg)](backend/tests/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3%20(Pure%20JS)-61DAFB.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC.svg)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage%20Ready-2496ED.svg)](Dockerfile)

---

## 1. Executive Summary

In Great Britain's wholesale power market (BETTA), electricity utilities purchase power in day-ahead auctions (e.g. EPEX SPOT, Nord Pool) for physical delivery across 48 half-hour settlement periods on the subsequent calendar day ($D$). Because wind power generation is weather-dependent and volatile:

- **Overforecasting** causes utilities to buy insufficient power, exposing them to penal system buy prices (imbalance cash-out).
- **Underforecasting** causes unhedged exposure, over-procurement, and spill costs.

The **GridBricks Wind Forecast Analytics Platform** provides decision-makers and risk managers with backtesting and monitoring capabilities. It ingests live half-hourly wind generation data (`FUELHH`) and wind forecast publications (`WINDFOR`) from Elexon BMRS, enforces strict anti-leakage decision cutoffs, computes quantitative accuracy metrics, and presents interactive visualizations for **January 2026**.

---

## 2. Market Context & Anti-Leakage Protocol

### Day-Ahead Cutoff Assumption & Market Workflow
In the GB electricity market:
- The delivery day $D$ runs from 00:00 to 24:00 UK local time (`Europe/London`).
- In day-ahead power procurement, utility trading desks finalize physical requirements and submit bids to day-ahead auctions (e.g. EPEX SPOT and Nord Pool order books close around late morning).
- **Application Cutoff Assumption:** The platform adopts **12:00 (midday) Europe/London on Day $D-1$** as its baseline configurable decision-cutoff assumption. This assumption models the operational state of information available after the conclusion of typical day-ahead bidding workflows. It is a documented modeling baseline, not an official regulatory deadline.
- **Configurability:** The application permits selecting any cutoff hour from 00:00 to 23:00 on $D-1$ so analysts can evaluate how forecast accuracy changes across different decision horizons (e.g., 09:00 morning desk meeting vs. 16:00 afternoon re-balancing).

### Strict Anti-Leakage Guarantee
Forecast publication time (`publishTime`) and delivery interval (`startTime`) represent different dimensions:
- Forecasts published **after** the cutoff timestamp ($T_{\text{publish}} > T_{\text{cutoff}}$) are **strictly discarded**.
- For each delivery interval, the platform selects the **latest forecast published on or before the cutoff**.
- If no eligible forecast exists prior to the cutoff, the interval is marked as unmatched (`null`); **data is never fabricated or artificially interpolated**.

---

## 3. Quantitative Accuracy Metrics

All metrics are computed on matched half-hourly intervals where both actual generation ($A_i$) and eligible forecast ($F_i$) exist ($i \in \{1, \dots, N\}$):

### A. Mean Absolute Error (MAE)
Measures the average magnitude of absolute forecast errors in Megawatts (MW):
$$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} |F_i - A_i| \quad [\text{MW}]$$

### B. Root Mean Squared Error (RMSE)
Penalizes large, extreme prediction deviations more heavily:
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)^2} \quad [\text{MW}]$$

### C. Weighted Absolute Percentage Error (WAPE)
Measures aggregate absolute error relative to total actual wind generation volume:
$$\text{WAPE} = \frac{\sum_{i=1}^{N} |F_i - A_i|}{\sum_{i=1}^{N} |A_i|} \times 100\% \quad [\%]$$
*Note: WAPE is preferred over MAPE in energy analytics because wind output can drop near 0 MW, which causes standard MAPE ($|F-A|/A$) to divide by zero and explode.*

### D. Forecast Bias (Mean Error)
Identifies systemic directional tendencies (over- or under-forecasting):
$$\text{Bias} = \frac{1}{N} \sum_{i=1}^{N} (F_i - A_i) \quad [\text{MW}]$$
- **$\text{Bias} > 0$**: Tends to overforecast (risk of being short physical generation in real time).
- **$\text{Bias} < 0$**: Tends to underforecast (risk of procuring excess generation).

### E. Data Coverage
Quantifies dataset completeness against available actuals:
$$\text{Coverage} = \frac{N_{\text{matched}}}{N_{\text{actual}}} \times 100\% \quad [\%]$$
*(January has 31 days $\times$ 48 half-hours = 1,488 expected intervals).*

---

## 4. System Architecture

```text
[ Browser Client ]
  React 18 (Pure JavaScript) + Tailwind CSS + Recharts
         │
         │  HTTP /api/analysis?month=2026-01&decision_hour=12
         ▼
[ FastAPI Backend ]
  Python 3.12, Pandas, Pydantic Settings, HTTPX, LRU In-Memory Cache
         │
         ├──► Elexon BMRS FUELHH Stream (Actuals: settlementDateFrom/To)
         │       └─► Backend filters fuelType == "WIND" & deduplicates by revision
         │
         └──► Elexon BMRS WINDFOR Stream (Forecasts: publishDateTimeFrom/To)
                 └─► Ingests 7-day publication lookback prior to target month
         │
         ▼
[ Analytical Engine (Pandas) ]
  - Enforce Day-Ahead Cutoff (D-1 at decision_hour UK time)
  - Mask post-cutoff forecasts (Anti-Leakage)
  - Interval alignment (UTC normalized keys)
  - Vectorized metric computation (MAE, RMSE, WAPE, Bias, Coverage)
```

---

## 5. Repository Structure

```text
vxzmp/
├── Dockerfile                      # Multi-stage production container build
├── .dockerignore
├── .gitignore                      # Strictly excludes /reference/, .venv, node_modules
├── pytest.ini                      # Pytest configuration
├── README.md                       # Comprehensive documentation
├── AI_USAGE.md                     # Transparent AI tool usage disclosure
│
├── reference/                      # Unmodified reference project (EXCLUDED FROM GIT)
│
├── backend/
│   ├── requirements.txt            # fastapi, uvicorn, httpx, pandas, pydantic-settings, pytest
│   ├── pytest.ini
│   ├── .env.example
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application, CORS, static SPA hosting
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings (env vars & defaults)
│   │   │   └── logging.py          # Structured application logger
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic API response models
│   │   └── services/
│   │       ├── elexon_client.py    # Defensive HTTP client for Elexon BMRS streams
│   │       └── forecast_analysis.py# Pandas-based interval matching & metric engine
│   └── tests/
│       ├── test_analysis.py        # Cutoff, anti-leakage, revision & metric precision tests
│       ├── test_elexon_client.py   # Stream normalization & date range tests
│       └── test_api.py             # FastAPI endpoint & error handling tests
│
└── frontend/
    ├── package.json                # React 18, Tailwind CSS, Recharts, Lucide-React (JS ONLY)
    ├── vite.config.js              # Vite configuration with @tailwindcss/vite and /api proxy
    ├── index.html
    └── src/
        ├── main.jsx                # React 18 entry point
        ├── App.jsx                 # Dashboard state manager
        ├── styles/
        │   └── index.css           # Tailwind CSS directives and custom theme
        ├── components/
        │   ├── Sidebar.jsx         # Static sticky navigation & Elexon status beacon
        │   ├── Topbar.jsx          # Header with backtest period pill & avatar
        │   ├── FilterBar.jsx       # Custom month, cutoff, day filters, and CSV export
        │   ├── CustomSelect.jsx    # Custom animated dropdown with checkmark states
        │   ├── CustomMonthPicker.jsx# Custom year/month calendar grid selector
        │   ├── MethodBanner.jsx    # Methodology & anti-leakage explanation
        │   ├── KpiGrid.jsx         # 4 KPI cards (MAE, RMSE, WAPE, Bias)
        │   ├── ForecastChart.jsx   # Dual-series Recharts line chart (Actual vs Forecast)
        │   ├── CoverageCard.jsx    # Interval completeness progress bar
        │   ├── ErrorTable.jsx      # Top 8 peak forecast deviation outliers
        │   ├── IntervalDataTable.jsx# Half-hourly audit ledger with pagination
        │   └── StatePanels.jsx     # Loading spinner & error banners
        └── utils/
            ├── formatters.js       # UK and UTC date & number formatters
            └── exportCsv.js        # Browser CSV export utility
```

---

## 6. Local Installation & Development

### Prerequisites
- **Python**: 3.11, 3.12, or 3.13
- **Node.js**: v20 or v22

### 1. Start the Backend
From the repository root (`vxzmp`):

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI application with auto-reload
cd backend
uvicorn app.main:app --reload --port 8000
```
- API Base: `http://127.0.0.1:8000`
- Interactive API Documentation (Swagger): `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

### 2. Start the Frontend
In a **second terminal**, from the repository root:

```bash
cd frontend
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser.
- Vite automatically proxies `/api/*` requests to `http://127.0.0.1:8000`.

---

## 7. Running Tests

Run the backend Pytest test suite from the repository root:

```bash
# Windows:
.\.venv\Scripts\pytest -v

# macOS/Linux:
pytest -v
```

**Test Coverage Summary (17 Tests):**
- Strict anti-leakage boundary enforcement ($T_{\text{publish}} > T_{\text{cutoff}}$ rejected).
- Mathematical verification of MAE, RMSE, WAPE, and Forecast Bias.
- Zero-generation edge cases (division-by-zero protection in WAPE).
- Fuel type filtering (`fuelType == WIND` exclusively).
- Document revision deduplication (highest `documentRevisionNumber` selected).
- Elexon stream response normalization and error handling.
- FastAPI query parameter validation and response schema conformance.

---

## 8. Docker Deployment

The application features an optimized multi-stage `Dockerfile`:
- **Stage 1**: Node 20-alpine compiles the React pure JavaScript frontend with Vite and Tailwind CSS.
- **Stage 2**: Python 3.12-slim runs FastAPI, hosting both the backend REST endpoints and serving the compiled SPA static assets from a unified container on port 8000.

```bash
# Build the Docker image
docker build -t gridbricks-wind .

# Run the container
docker run --rm -p 8000:8000 gridbricks-wind
```

Access the complete unified application at `http://localhost:8000`.

---

## 9. Empirical Data Validation & Temporal Alignment Analysis

The platform was comprehensively backtested against live Elexon BMRS data for the target period of **January 2026** (`2026-01-01` to `2026-01-31`).

### 9.1 Source Data Ingestion & Completeness

| Dataset | Total Retrieved Records | Filtered Target Records | Completeness Status |
| :--- | :---: | :---: | :---: |
| **`FUELHH` Actual Generation** | **29,760** raw records (20 fuels) | **1,488** half-hour `WIND` records | **100.0% Complete** (0 missing settlement periods) |
| **`WINDFOR` Forecast Stream** | **22,192** multi-version records | **744** hourly delivery timestamps | **100.0% Complete** (all hours have eligible versions) |

Every 30-minute settlement period in January 2026 ($31 \text{ days} \times 48 \text{ periods} = 1,488$) is present in the actual dataset. No actual intervals were dropped, lost, or truncated during ingestion.

---

### 9.2 Primary Calculation: Exact Timestamp Join (Methodology A)

The application implements **Methodology A (Exact Timestamp Join)** as its primary calculation engine:
- For each delivery interval starting at minute `:00`, the latest eligible pre-cutoff forecast is joined directly with the corresponding settlement period outturn.
- **Coverage Semantics:**
  - **Settlement-Period Coverage: 50.0%** (744 of 1,488 half-hour actual periods matched). Intermediate `:30` half-hour actual periods do not have separate published forecasts in `WINDFOR` and are not artificially fabricated or interpolated.
  - **Forecast-Timestamp Coverage: 100.0%** (744 of 744 hourly forecast timestamps published in `WINDFOR` are matched against delivery outturns).
- **Official API Alignment:** In Elexon's official endpoint `GET /forecast/generation/wind`, forecast records are explicitly mapped to **odd settlement periods** ($\text{settlementPeriod} \in \{1, 3, 5, \dots, 47\}$), corresponding directly to `:00` interval start times.

---

### 9.3 Exploratory Temporal Alignment Alternatives (Methodologies B & C)

Because `FUELHH` is reported on a half-hourly settlement resolution while `WINDFOR` is published on an hourly timestamp resolution, we evaluated two alternative exploratory alignment methodologies. 

> [!NOTE]
> **Analytical Limitation Disclosure:** Authoritative Elexon/NESO documentation defines `generation` as a projected MW capacity estimate, but leaves the physical integration (whether the forecast represents an integrated hourly-average MW or an instantaneous point estimate) unspecified. Methodologies B and C are presented strictly as **exploratory alternatives whose physical assumptions remain unverified** by official documentation.

| Alignment Methodology | Calculation Mechanism | Matched Observations ($N$) | Settlement Coverage | MAE (MW) | RMSE (MW) | WAPE (%) | Bias (MW) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **A: Exact Timestamp Join (Primary)** | Direct join on `:00` timestamps | **744** | 50.0% (settlement)<br>100% (forecasts) | **2,002.906** | **2,470.076** | **17.295%** | **+1,805.858** |
| **B: Hourly Actual Aggregation (Exploratory)** | Average two half-hour actuals: $\frac{y_{00} + y_{30}}{2}$ vs. hourly forecast | **744** | 100.0% (hourly delivery) | **2,017.921** | **2,477.040** | **17.425%** | **+1,806.233** |
| **C: Forecast Disaggregation (Exploratory)** | Repeat hourly forecast across both constituent half-hours | **1,488** | 100.0% (settlement periods) | **2,020.643** | **2,481.380** | **17.448%** | **+1,806.233** |

#### Key Analytical Observations:
1. **Subset Differences (MAE):** Methodology A exhibits a lower MAE ($2,002.906\text{ MW}$) because **it evaluates a different subset of observations** (only the `:00` timestamps). When evaluating the remaining `:30` half-hour actuals separately under the hourly forecast, the observed MAE is $2,038.380\text{ MW}$.
2. **Algebraic Equality of Bias:** Signed Bias in Methodology B and Methodology C is algebraically identical ($+1,806.233\text{ MW}$). This equality holds strictly because:
   - All 744 pairs of half-hours exist in the January 2026 actual dataset ($N_{00} = N_{30} = 744$).
   - Both half-hours have identical 30-minute duration weighting ($w_{00} = w_{30} = 0.5$).
   - The same forecast value $F_h$ is applied uniformly across both half-hours.

---

### 9.4 Decision Cutoff Sensitivity Analysis

To analyze how the configurable day-ahead decision cutoff affects accuracy metrics, January 2026 was evaluated across candidate cutoff hours on Day $D-1$:

| Cutoff Hour ($D-1$ UK Time) | Lead Time to Day Start | Matched Observations | MAE (MW) | RMSE (MW) | WAPE (%) | Bias (MW) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **06:00** | 18 hours | 744 | 2,127.50 | 2,642.59 | 18.37% | +1,854.12 |
| **09:00** | 15 hours | 744 | 2,056.40 | 2,570.61 | 17.76% | +1,828.45 |
| **11:00** | 13 hours | 744 | 2,012.33 | 2,525.79 | 17.38% | +1,811.20 |
| **12:00 (Baseline)** | 12 hours | 744 | **2,002.91** | **2,470.08** | **17.29%** | **+1,805.86** |
| **14:00** | 10 hours | 744 | 1,987.89 | 2,454.60 | 17.16% | +1,798.14 |
| **16:00** | 8 hours | 744 | 1,968.10 | 2,438.58 | 16.99% | +1,789.32 |
| **20:00** | 4 hours | 744 | 1,939.63 | 2,410.84 | 16.75% | +1,775.40 |
| **23:00** | 1 hour | 744 | 1,919.26 | 2,387.95 | 16.57% | +1,762.18 |

This sensitivity table illustrates the trade-off energy procurement teams navigate between earlier decision lock-in and lower forecast uncertainty.

---

## 10. Demonstration Video Outline & Script (10 Minutes Max)

### Part 1: Customer-Facing Product Presentation (0:00 – 4:30)
- **0:00 – 1:00 (The Business Problem)**: Introduce the GB day-ahead power market. Explain why UK energy utilities must accurately predict national wind generation before gate closure (12:00 D-1) to avoid costly system imbalance penalties.
- **1:00 – 2:00 (Executive KPI Dashboard)**: Walk through the 4 core metrics (MAE, RMSE, WAPE, and Forecast Bias). Highlight how signed bias immediately informs traders whether models tend to over- or under-forecast.
- **2:00 – 3:15 (Interactive Time-Series & Outliers)**: Demonstrate the Recharts generation chart comparing actual generation vs day-ahead forecast. Show the **Top 8 Outliers** identifying peak deviation events.
- **3:15 – 4:30 (Day-Ahead Cutoff Simulation & CSV Export)**: Demonstrate changing the cutoff hour from 12:00 to 09:00 or 15:00 to simulate different bidding horizons. Conclude with single-click CSV export for downstream trading analysis.

### Part 2: Technical Walkthrough for the Technical Lead (4:30 – 9:30)
- **4:30 – 5:30 (System Architecture & Separation of Concerns)**: Explain the decoupled architecture: FastAPI backend using Pandas for vectorized transformations, and React frontend built strictly in pure JavaScript with Tailwind CSS.
- **5:30 – 6:45 (Anti-Leakage & Market Timing Protocol)**: Walk through `forecast_analysis.py`. Show how cutoff timestamps are computed in `Europe/London` local time and how post-cutoff forecasts are discarded to guarantee zero data leakage.
- **6:45 – 7:45 (Elexon BMRS Stream Ingestion & Caching)**: Detail the `FUELHH` and `WINDFOR` client implementation, the 7-day lookback window, revision deduplication, and in-memory `@lru_cache` for instant UI recalculation.
- **7:45 – 8:45 (Frontend Engineering & Custom Controls)**: Showcase the custom controls (`CustomSelect`, `CustomMonthPicker`), sticky sidebar implementation, and verification of zero TypeScript dependencies.
- **8:45 – 9:30 (Testing & Multi-Stage Docker Build)**: Execute `pytest -v` showing all 17 tests passing, review the multi-stage `Dockerfile`, and demonstrate container deployment.

---

## 11. Data Attribution & Disclosures

- **Data Attribution**: Contains BMRS data © Elexon Limited copyright and database right. Data retrieved via official public stream endpoints: [FUELHH Stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) and [WINDFOR Stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream).
- **AI Tool Usage**: Developed with assistance from ChatGPT (planning) and Antigravity IDE (implementation, refactoring, and testing). See [`AI_USAGE.md`](AI_USAGE.md) for full disclosure.

