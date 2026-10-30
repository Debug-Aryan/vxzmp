"""FastAPI application for GridBricks Wind Forecast Analytics Platform."""
from __future__ import annotations

from datetime import date
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import logger
from app.models.schemas import AnalysisResponse
from app.services.elexon_client import (
    ElexonAPIError,
    fetch_actual_wind,
    fetch_wind_forecasts,
)
from app.services.forecast_analysis import analyse_records

app = FastAPI(
    title=settings.app_name,
    description="Quantitative accuracy assessment for UK national wind forecasts using Elexon BMRS data.",
    version=settings.app_version,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Health check endpoint to verify backend service readiness."""
    return {
        "status": "ok",
        "service": "gridbricks-wind-forecast-analytics",
        "version": settings.app_version,
    }


@lru_cache(maxsize=settings.cache_max_size)
def _fetch_cached_period_raw_data(year: int, month_number: int):
    """Cache raw Elexon responses in memory.

    This ensures that when a user adjusts the day-ahead decision cutoff hour,
    re-analysis calculates instantly in memory without re-fetching multi-megabyte
    streams across the network.
    """
    start_date = date(year, month_number, 1)
    end_exclusive = (
        date(year + 1, 1, 1) if month_number == 12 else date(year, month_number + 1, 1)
    )
    logger.info("Cache miss: Querying Elexon for period %04d-%02d", year, month_number)
    actuals = fetch_actual_wind(start_date, end_exclusive)
    forecasts = fetch_wind_forecasts(start_date, end_exclusive)
    return actuals, forecasts


@app.get("/api/analysis", response_model=AnalysisResponse)
def get_forecast_analysis(
    month: str = Query(
        default="2026-01",
        pattern=r"^\d{4}-(0[1-9]|1[0-2])$",
        description="Delivery month in YYYY-MM format",
    ),
    decision_hour: int = Query(
        default=settings.default_decision_hour,
        ge=0,
        le=23,
        description="Day-ahead purchasing decision cutoff hour (0-23 in UK local time on D-1)",
    ),
) -> dict:
    """Evaluate day-ahead wind forecast accuracy against actual generation."""
    try:
        if not (0 <= decision_hour <= 23):
            raise HTTPException(
                status_code=400,
                detail="Parameter 'decision_hour' must be an integer between 0 and 23",
            )
        year_str, month_str = month.split("-")
        year, month_number = int(year_str), int(month_str)

        actuals, forecasts = _fetch_cached_period_raw_data(year, month_number)
        result = analyse_records(actuals, forecasts, month, decision_hour)

        if not result["actualIntervals"]:
            raise HTTPException(
                status_code=502,
                detail=(
                    f"Elexon returned no usable actual wind records for {month}. "
                    "Check API availability or the requested date range."
                ),
            )

        result["source"] = {
            "actuals": "Elexon BMRS FUELHH stream (fuelType=WIND filtered in backend)",
            "forecasts": "Elexon BMRS WINDFOR stream (7-day publication lookback applied)",
            "attribution": "Contains BMRS data © Elexon Limited copyright and database right.",
        }
        return result

    except HTTPException:
        raise
    except ElexonAPIError as exc:
        logger.error("Elexon upstream error: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValueError as exc:
        logger.warning("Invalid analysis parameters: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error in forecast analysis: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected internal error occurred: {exc}",
        ) from exc


# Static SPA hosting for production builds (Docker container delivery)
STATIC_DIR = Path(__file__).resolve().parent / "static"
if STATIC_DIR.exists():
    logger.info("Mounting static assets from %s", STATIC_DIR)
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str) -> FileResponse:
        candidate = (STATIC_DIR / full_path).resolve()
        if full_path and candidate.is_file() and STATIC_DIR.resolve() in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")
