"""Unit tests for forecast selection, anti-leakage logic, and quantitative metrics."""
from __future__ import annotations

import math
from datetime import datetime, timezone
import pytest

from app.services.forecast_analysis import (
    analyse_records,
    compute_decision_cutoff,
    format_utc_key,
    parse_utc_timestamp,
)

UTC = timezone.utc


def test_parse_utc_timestamp():
    dt1 = parse_utc_timestamp("2026-01-15T12:00:00Z")
    assert dt1 == datetime(2026, 1, 15, 12, 0, 0, tzinfo=UTC)

    dt2 = parse_utc_timestamp("2026-01-15T12:00:00")
    assert dt2 == datetime(2026, 1, 15, 12, 0, 0, tzinfo=UTC)

    assert parse_utc_timestamp(None) is None
    assert parse_utc_timestamp("invalid-date") is None


def test_compute_decision_cutoff():
    # Delivery at 2026-01-02 04:30 UTC -> D-1 cutoff is 2026-01-01 12:00 UTC
    dt = parse_utc_timestamp("2026-01-02T04:30:00Z")
    cutoff = compute_decision_cutoff(dt, decision_hour=12)
    assert cutoff == datetime(2026, 1, 1, 12, 0, tzinfo=UTC)

    # Configurable hour: 09:00 UK time
    cutoff_09 = compute_decision_cutoff(dt, decision_hour=9)
    assert cutoff_09 == datetime(2026, 1, 1, 9, 0, tzinfo=UTC)


def test_selects_latest_forecast_strictly_before_cutoff():
    """Anti-leakage test: verifies that no forecast published after cutoff is selected."""
    actuals = [
        {"fuelType": "WIND", "startTime": "2026-01-02T00:00:00Z", "generation": 100.0}
    ]
    forecasts = [
        # Eligible: published early morning D-1
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T08:00:00Z", "generation": 85.0},
        # Eligible: published right before the 12:00 cutoff
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T11:59:00Z", "generation": 95.0},
        # INELIGIBLE: published after cutoff (12:01) -> must be ignored!
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T12:01:00Z", "generation": 110.0},
    ]

    result = analyse_records(actuals, forecasts, month="2026-01", decision_hour=12)

    assert result["matchedIntervals"] == 1
    row = result["rows"][0]
    assert row["forecast"] == 95.0
    assert row["forecastPublishTime"] == "2026-01-01T11:59:00Z"
    assert row["actual"] == 100.0
    assert row["error"] == -5.0
    assert row["absoluteError"] == 5.0


def test_filters_non_wind_actuals():
    actuals = [
        {"fuelType": "WIND", "startTime": "2026-01-02T00:00:00Z", "generation": 250.0},
        {"fuelType": "GAS", "startTime": "2026-01-02T00:00:00Z", "generation": 800.0},
        {"fuelType": "NUCLEAR", "startTime": "2026-01-02T00:00:00Z", "generation": 1200.0},
    ]
    result = analyse_records(actuals, [], month="2026-01")
    assert result["actualIntervals"] == 1
    assert result["rows"][0]["actual"] == 250.0


def test_revision_deduplication():
    actuals = [
        {"fuelType": "WIND", "startTime": "2026-01-02T00:00:00Z", "generation": 100.0, "documentRevisionNumber": 1},
        {"fuelType": "WIND", "startTime": "2026-01-02T00:00:00Z", "generation": 150.0, "documentRevisionNumber": 2},
    ]
    result = analyse_records(actuals, [], month="2026-01")
    assert result["actualIntervals"] == 1
    assert result["rows"][0]["actual"] == 150.0


def test_metrics_mathematical_precision():
    actuals = [
        {"fuelType": "WIND", "startTime": "2026-01-02T00:00:00Z", "generation": 100.0},
        {"fuelType": "WIND", "startTime": "2026-01-02T00:30:00Z", "generation": 200.0},
    ]
    forecasts = [
        # Interval 1: actual=100, forecast=110, error=+10
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T11:00:00Z", "generation": 110.0},
        # Interval 2: actual=200, forecast=180, error=-20
        {"startTime": "2026-01-02T00:30:00Z", "publishTime": "2026-01-01T11:00:00Z", "generation": 180.0},
    ]
    result = analyse_records(actuals, forecasts, month="2026-01", decision_hour=12)

    metrics = result["metrics"]
    # MAE = (|10| + |-20|) / 2 = 15.0
    assert metrics["maeMw"] == 15.0
    # RMSE = sqrt((10^2 + (-20)^2) / 2) = sqrt(250) ≈ 15.811
    assert metrics["rmseMw"] == round(math.sqrt(250), 3)
    # Bias = (10 + (-20)) / 2 = -5.0
    assert metrics["biasMw"] == -5.0
    # WAPE = (|10| + |-20|) / (100 + 200) * 100 = 30 / 300 * 100 = 10.0%
    assert metrics["wapePercent"] == 10.0


def test_missing_forecast_handled_without_inventing_data():
    actuals = [
        {"fuelType": "WIND", "startTime": "2026-01-02T00:00:00Z", "generation": 50.0}
    ]
    # No forecasts provided
    result = analyse_records(actuals, [], month="2026-01")
    assert result["actualIntervals"] == 1
    assert result["matchedIntervals"] == 0
    assert result["coveragePercent"] == 0.0
    assert result["metrics"]["maeMw"] is None
    assert result["metrics"]["rmseMw"] is None
    assert result["metrics"]["wapePercent"] is None
    assert result["metrics"]["biasMw"] is None
    assert result["rows"][0]["forecast"] is None
    assert result["rows"][0]["error"] is None


def test_zero_actual_generation_wape_safety():
    """Verify WAPE does not throw ZeroDivisionError when actual generation sum is 0."""
    actuals = [
        {"fuelType": "WIND", "startTime": "2026-01-02T00:00:00Z", "generation": 0.0}
    ]
    forecasts = [
        {"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T10:00:00Z", "generation": 5.0}
    ]
    result = analyse_records(actuals, forecasts, month="2026-01")
    assert result["metrics"]["wapePercent"] is None
    assert result["metrics"]["maeMw"] == 5.0
