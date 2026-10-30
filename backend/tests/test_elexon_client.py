"""Unit tests for Elexon BMRS client payload normalization and parameter handling."""
from __future__ import annotations

from datetime import date
import pytest

from app.services.elexon_client import (
    ElexonAPIError,
    _normalize_stream_records,
    fetch_actual_wind,
)


def test_normalize_stream_records_list():
    raw = [{"startTime": "2026-01-01T00:00:00Z", "generation": 100}]
    assert _normalize_stream_records(raw) == raw


def test_normalize_stream_records_data_wrapper():
    raw = {"data": [{"startTime": "2026-01-01T00:00:00Z", "generation": 100}]}
    assert _normalize_stream_records(raw) == [{"startTime": "2026-01-01T00:00:00Z", "generation": 100}]


def test_normalize_stream_records_invalid_format():
    with pytest.raises(ElexonAPIError, match="Unexpected response format"):
        _normalize_stream_records("not a valid response")


def test_fetch_actual_wind_invalid_range():
    # start_date > end_date returns empty list without calling API
    assert fetch_actual_wind(date(2026, 1, 10), date(2026, 1, 5)) == []
