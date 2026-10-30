"""Forecast selection, interval alignment, and quantitative accuracy metrics.

Leverages Pandas for vectorized filtering, deduplication, and statistical computations.
Strictly eliminates look-ahead bias by enforcing day-ahead decision cutoffs.
"""
from __future__ import annotations

import math
from datetime import date, datetime, time, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

import pandas as pd

from app.core.logging import logger

UK_TZ = ZoneInfo("Europe/London")
UTC_TZ = timezone.utc


def parse_utc_timestamp(value: Any) -> datetime | None:
    """Parse string or datetime to UTC timezone-aware datetime."""
    if value is None or value == "":
        return None
    try:
        if isinstance(value, datetime):
            dt = value
        else:
            text = str(value).replace("Z", "+00:00")
            dt = datetime.fromisoformat(text)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC_TZ)
        return dt.astimezone(UTC_TZ)
    except (TypeError, ValueError):
        return None


def format_utc_key(dt: datetime) -> str:
    """Standardize interval timestamp to an ISO 8601 UTC string ending in 'Z'."""
    return dt.astimezone(UTC_TZ).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def compute_decision_cutoff(start_time: datetime, decision_hour: int = 12) -> datetime:
    """Compute day-ahead decision cutoff for a delivery interval in UTC.

    In the GB power market, trading decisions for day D are finalized on day D-1.
    The cutoff is evaluated at `decision_hour:00` Europe/London local time on D-1,
    then converted to UTC.
    """
    local_delivery_date = start_time.astimezone(UK_TZ).date()
    local_cutoff_date = local_delivery_date - timedelta(days=1)
    local_cutoff_dt = datetime.combine(local_cutoff_date, time(hour=decision_hour), tzinfo=UK_TZ)
    return local_cutoff_dt.astimezone(UTC_TZ)


def analyse_records(
    actual_records: list[dict[str, Any]],
    forecast_records: list[dict[str, Any]],
    month: str = "2026-01",
    decision_hour: int = 12,
) -> dict[str, Any]:
    """Match actual and forecast generation intervals and compute error metrics."""
    # 1. Parse target period boundaries
    try:
        year_str, month_str = month.split("-", maxsplit=1)
        year, month_num = int(year_str), int(month_str)
        period_start_date = date(year, month_num, 1)
        if month_num == 12:
            next_month_date = date(year + 1, 1, 1)
        else:
            next_month_date = date(year, month_num + 1, 1)
    except (ValueError, TypeError) as exc:
        raise ValueError("Parameter 'month' must be formatted as YYYY-MM") from exc

    if not (0 <= decision_hour <= 23):
        raise ValueError("Parameter 'decision_hour' must be an integer between 0 and 23")

    period_start = datetime.combine(period_start_date, time.min, tzinfo=UK_TZ).astimezone(UTC_TZ)
    period_end = datetime.combine(next_month_date, time.min, tzinfo=UK_TZ).astimezone(UTC_TZ)
    expected_intervals = int(round((period_end - period_start).total_seconds() / 1800))

    logger.info(
        "Analyzing period %s (%s to %s UTC) with decision cutoff %02d:00 UK time",
        month,
        period_start.isoformat(),
        period_end.isoformat(),
        decision_hour,
    )

    # 2. Process FUELHH actuals using Pandas
    actual_source_count = 0
    cleaned_actuals: dict[str, dict[str, Any]] = {}

    if actual_records:
        df_actual = pd.DataFrame(actual_records)
        if "fuelType" in df_actual.columns and "generation" in df_actual.columns and "startTime" in df_actual.columns:
            # Filter fuelType == WIND
            df_wind = df_actual[df_actual["fuelType"].astype(str).str.strip().str.upper() == "WIND"].copy()
            actual_source_count = len(df_wind)

            # Parse datetime and generation
            df_wind["parsed_start"] = df_wind["startTime"].apply(parse_utc_timestamp)
            df_wind["numeric_gen"] = pd.to_numeric(df_wind["generation"], errors="coerce")

            # Filter valid timestamps within target month
            df_wind = df_wind.dropna(subset=["parsed_start", "numeric_gen"])
            df_wind = df_wind[
                (df_wind["parsed_start"] >= period_start) & (df_wind["parsed_start"] < period_end)
            ]

            # Handle revision deduplication (keep highest documentRevisionNumber or revisionNumber)
            rev_col = "documentRevisionNumber" if "documentRevisionNumber" in df_wind.columns else "revisionNumber"
            if rev_col in df_wind.columns:
                df_wind["numeric_rev"] = pd.to_numeric(df_wind[rev_col], errors="coerce").fillna(-1)
                df_wind = df_wind.sort_values(by=["parsed_start", "numeric_rev"], ascending=[True, True])
                df_wind = df_wind.drop_duplicates(subset=["parsed_start"], keep="last")
            else:
                df_wind = df_wind.drop_duplicates(subset=["parsed_start"], keep="last")

            for _, row in df_wind.iterrows():
                dt = row["parsed_start"]
                key = format_utc_key(dt)
                cleaned_actuals[key] = {
                    "startTime": dt,
                    "actual": float(row["numeric_gen"]),
                }

    # 3. Process WINDFOR forecasts using Pandas
    forecasts_by_interval: dict[str, list[tuple[datetime, float]]] = {}

    if forecast_records:
        df_fc = pd.DataFrame(forecast_records)
        if "startTime" in df_fc.columns and "publishTime" in df_fc.columns and "generation" in df_fc.columns:
            df_fc["parsed_start"] = df_fc["startTime"].apply(parse_utc_timestamp)
            df_fc["parsed_publish"] = df_fc["publishTime"].apply(parse_utc_timestamp)
            df_fc["numeric_gen"] = pd.to_numeric(df_fc["generation"], errors="coerce")

            df_fc = df_fc.dropna(subset=["parsed_start", "parsed_publish", "numeric_gen"])
            df_fc = df_fc[
                (df_fc["parsed_start"] >= period_start) & (df_fc["parsed_start"] < period_end)
            ]

            for _, row in df_fc.iterrows():
                key = format_utc_key(row["parsed_start"])
                if key not in forecasts_by_interval:
                    forecasts_by_interval[key] = []
                forecasts_by_interval[key].append(
                    (row["parsed_publish"], float(row["numeric_gen"]))
                )

    # 4. Align intervals and enforce anti-leakage forecast selection rule
    chart_rows: list[dict[str, Any]] = []
    matched_diffs: list[float] = []
    matched_actuals: list[float] = []

    sorted_intervals = sorted(cleaned_actuals.items(), key=lambda item: item[1]["startTime"])

    for key, actual_item in sorted_intervals:
        delivery_dt: datetime = actual_item["startTime"]
        cutoff_dt = compute_decision_cutoff(delivery_dt, decision_hour)

        # Select all forecasts published strictly on or before the cutoff
        candidates = forecasts_by_interval.get(key, [])
        eligible = [(pub_dt, gen) for pub_dt, gen in candidates if pub_dt <= cutoff_dt]

        if eligible:
            # Latest available forecast published before cutoff
            best_publish, best_forecast = max(eligible, key=lambda pair: pair[0])
            actual_val = actual_item["actual"]
            err = best_forecast - actual_val
            abs_err = abs(err)

            matched_diffs.append(err)
            matched_actuals.append(actual_val)

            chart_rows.append({
                "startTime": key,
                "actual": round(actual_val, 3),
                "forecast": round(best_forecast, 3),
                "forecastPublishTime": format_utc_key(best_publish),
                "decisionCutoff": format_utc_key(cutoff_dt),
                "error": round(err, 3),
                "absoluteError": round(abs_err, 3),
            })
        else:
            # Missing or ineligible forecast (anti-leakage)
            actual_val = actual_item["actual"]
            chart_rows.append({
                "startTime": key,
                "actual": round(actual_val, 3),
                "forecast": None,
                "forecastPublishTime": None,
                "decisionCutoff": format_utc_key(cutoff_dt),
                "error": None,
                "absoluteError": None,
            })

    # 5. Calculate quantitative metrics
    actual_intervals_count = len(cleaned_actuals)
    matched_intervals_count = len(matched_diffs)
    coverage_pct = (
        (matched_intervals_count / actual_intervals_count * 100.0)
        if actual_intervals_count > 0
        else 0.0
    )

    if matched_intervals_count > 0:
        err_series = pd.Series(matched_diffs)
        act_series = pd.Series(matched_actuals)

        mae = float(err_series.abs().mean())
        rmse = float(math.sqrt((err_series ** 2).mean()))
        bias = float(err_series.mean())

        total_actual = float(act_series.abs().sum())
        wape = (float(err_series.abs().sum()) / total_actual * 100.0) if total_actual > 0 else None
    else:
        mae = rmse = bias = wape = None

    return {
        "month": month,
        "timezone": "Europe/London",
        "decisionHour": decision_hour,
        "decisionRule": (
            f"Latest forecast published on or before {decision_hour:02d}:00 UK time on the day before delivery. "
            "Forecasts published after this cutoff are excluded to prevent look-ahead data leakage."
        ),
        "expectedIntervals": expected_intervals,
        "actualIntervals": actual_intervals_count,
        "matchedIntervals": matched_intervals_count,
        "coveragePercent": round(coverage_pct, 2),
        "metrics": {
            "maeMw": round(mae, 3) if mae is not None else None,
            "rmseMw": round(rmse, 3) if rmse is not None else None,
            "wapePercent": round(wape, 3) if wape is not None else None,
            "biasMw": round(bias, 3) if bias is not None else None,
        },
        "sourceCounts": {
            "actualWindRecordsUsedBeforeDeduplication": actual_source_count,
            "forecastRecordsReceived": len(forecast_records),
        },
        "rows": chart_rows,
    }
