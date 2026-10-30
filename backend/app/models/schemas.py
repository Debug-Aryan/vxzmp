"""Pydantic schemas and API contracts for GridBricks Wind Analytics."""
from __future__ import annotations

from pydantic import BaseModel, Field


class IntervalRow(BaseModel):
    """Half-hourly interval data with matched forecast and error."""

    startTime: str = Field(..., description="Interval delivery start timestamp in UTC (ISO 8601)")
    actual: float = Field(..., description="Actual wind generation in MW")
    forecast: float | None = Field(None, description="Selected day-ahead wind forecast in MW")
    forecastPublishTime: str | None = Field(None, description="Timestamp when the selected forecast was published")
    decisionCutoff: str = Field(..., description="Applicable day-ahead purchasing decision cutoff in UTC")
    error: float | None = Field(None, description="Forecast error in MW (forecast - actual)")
    absoluteError: float | None = Field(None, description="Absolute forecast error in MW (|forecast - actual|)")


class AccuracyMetrics(BaseModel):
    """Quantitative forecast accuracy summary metrics."""

    maeMw: float | None = Field(None, description="Mean Absolute Error in MW")
    rmseMw: float | None = Field(None, description="Root Mean Squared Error in MW")
    wapePercent: float | None = Field(None, description="Weighted Absolute Percentage Error (WAPE) in %")
    biasMw: float | None = Field(None, description="Mean forecast bias in MW (positive = overforecasting)")


class DataSourceAttribution(BaseModel):
    """Attribution and stream metadata."""

    actuals: str = Field(..., description="Actual generation data source description")
    forecasts: str = Field(..., description="Forecast data source description")
    attribution: str = Field(..., description="Legal copyright and database rights attribution")


class AnalysisResponse(BaseModel):
    """Complete response payload for the /api/analysis endpoint."""

    month: str = Field(..., description="Analyzed delivery month (YYYY-MM)")
    timezone: str = Field("Europe/London", description="Market reference timezone")
    decisionHour: int = Field(..., description="Day-ahead cutoff hour (0-23 in UK local time on D-1)")
    decisionRule: str = Field(..., description="Human-readable decision rule description")
    expectedIntervals: int = Field(..., description="Expected half-hour intervals in the calendar month")
    actualIntervals: int = Field(..., description="Actual wind generation intervals available")
    matchedIntervals: int = Field(..., description="Intervals with both actual and eligible forecast")
    coveragePercent: float = Field(..., description="Percentage of actual intervals matched with eligible forecasts")
    metrics: AccuracyMetrics = Field(..., description="Quantitative accuracy metrics")
    sourceCounts: dict[str, int] = Field(..., description="Ingested record counts")
    source: DataSourceAttribution = Field(..., description="Attribution and data lineage")
    rows: list[IntervalRow] = Field(..., description="Half-hourly interval time-series rows")

