"""Defensive HTTP client for Elexon BMRS stream datasets."""
from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import logger


class ElexonAPIError(RuntimeError):
    """Raised when the Elexon API is unreachable, fails, or returns unexpected data."""


def _normalize_stream_records(payload: Any) -> list[dict[str, Any]]:
    """Normalize Elexon stream responses to a list of row dictionaries."""
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        data = payload.get("data", [])
        if isinstance(data, list):
            return [item for item in data if isinstance(item, dict)]
    raise ElexonAPIError("Unexpected response format received from Elexon BMRS stream.")


def fetch_stream_dataset(dataset: str, params: dict[str, str]) -> list[dict[str, Any]]:
    """Fetch raw records from an Elexon BMRS stream endpoint."""
    url = f"{settings.elexon_base_url}/datasets/{dataset}/stream"
    logger.info("Fetching Elexon dataset '%s' with parameters %s", dataset, params)
    try:
        with httpx.Client(timeout=settings.request_timeout_seconds, follow_redirects=True) as client:
            response = client.get(url, params=params, headers={"Accept": "application/json"})
            response.raise_for_status()
            records = _normalize_stream_records(response.json())
            logger.info("Successfully fetched %d records for dataset '%s'", len(records), dataset)
            return records
    except httpx.HTTPStatusError as exc:
        details = exc.response.text[:250].replace("\n", " ")
        msg = f"Elexon BMRS returned HTTP {exc.response.status_code} for {dataset}: {details}"
        logger.error(msg)
        raise ElexonAPIError(msg) from exc
    except httpx.TimeoutException as exc:
        msg = f"Timeout ({settings.request_timeout_seconds}s) connecting to Elexon BMRS for {dataset}."
        logger.error(msg)
        raise ElexonAPIError(msg) from exc
    except (httpx.RequestError, ValueError) as exc:
        msg = f"Failed to retrieve/parse Elexon dataset {dataset}: {exc}"
        logger.error(msg)
        raise ElexonAPIError(msg) from exc


def fetch_actual_wind(start_date: date, end_exclusive: date) -> list[dict[str, Any]]:
    """Fetch FUELHH records across the target settlement date range.

    Settlement dates are inclusive in FUELHH, so end_exclusive is converted to
    end_exclusive - 1 day.
    """
    final_date = end_exclusive - timedelta(days=1)
    if final_date < start_date:
        return []

    return fetch_stream_dataset(
        "FUELHH",
        {
            "settlementDateFrom": start_date.isoformat(),
            "settlementDateTo": final_date.isoformat(),
        },
    )


def fetch_wind_forecasts(start_date: date, end_exclusive: date) -> list[dict[str, Any]]:
    """Fetch WINDFOR wind forecasts published around the target delivery month.

    Includes a 7-day publication lookback prior to start_date so the forecast selector
    can fall back to an earlier eligible forecast if a target interval lacks a same-day update.
    """
    publish_from = datetime.combine(start_date - timedelta(days=7), time.min, tzinfo=timezone.utc)
    publish_to = datetime.combine(end_exclusive, time.min, tzinfo=timezone.utc) - timedelta(seconds=1)

    return fetch_stream_dataset(
        "WINDFOR",
        {
            "publishDateTimeFrom": publish_from.isoformat().replace("+00:00", "Z"),
            "publishDateTimeTo": publish_to.isoformat().replace("+00:00", "Z"),
        },
    )
