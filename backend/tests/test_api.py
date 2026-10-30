"""Integration tests for FastAPI endpoints and business logic."""
from __future__ import annotations

from unittest.mock import patch
from fastapi import HTTPException
import pytest

from app.main import health_check, get_forecast_analysis


def test_health_check_endpoint():
    payload = health_check()
    assert payload["status"] == "ok"
    assert "service" in payload
    assert "version" in payload


def test_analysis_endpoint_validation_invalid_month():
    with pytest.raises(HTTPException) as exc_info:
        get_forecast_analysis(month="not-a-month", decision_hour=12)
    assert exc_info.value.status_code == 400


def test_analysis_endpoint_validation_invalid_decision_hour():
    with pytest.raises(HTTPException) as exc_info:
        get_forecast_analysis(month="2026-01", decision_hour=25)
    assert exc_info.value.status_code == 400


@patch("app.main._fetch_cached_period_raw_data")
def test_analysis_endpoint_mocked_success(mock_fetch):
    mock_fetch.return_value = (
        [{"fuelType": "WIND", "startTime": "2026-01-02T00:00:00Z", "generation": 100.0}],
        [{"startTime": "2026-01-02T00:00:00Z", "publishTime": "2026-01-01T11:00:00Z", "generation": 95.0}],
    )

    result = get_forecast_analysis(month="2026-01", decision_hour=12)
    assert result["month"] == "2026-01"
    assert result["decisionHour"] == 12
    assert result["matchedIntervals"] == 1
    assert result["metrics"]["maeMw"] == 5.0
    assert len(result["rows"]) == 1
    assert "source" in result


@patch("app.main._fetch_cached_period_raw_data")
def test_analysis_endpoint_no_records_returns_502(mock_fetch):
    mock_fetch.return_value = ([], [])
    with pytest.raises(HTTPException) as exc_info:
        get_forecast_analysis(month="2026-01", decision_hour=12)
    assert exc_info.value.status_code == 502
