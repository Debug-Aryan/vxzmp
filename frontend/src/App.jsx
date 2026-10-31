import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { FilterBar } from './components/FilterBar'
import { MethodBanner } from './components/MethodBanner'
import { KpiGrid } from './components/KpiGrid'
import { ForecastChart } from './components/ForecastChart'
import { CoverageCard } from './components/CoverageCard'
import { ErrorTable } from './components/ErrorTable'
import { IntervalDataTable } from './components/IntervalDataTable'
import { LoadingPanel, ErrorPanel } from './components/StatePanels'
import { formatUkDateTime } from './utils/formatters'
import { exportIntervalsToCsv } from './utils/exportCsv'
import './styles/index.css'

export default function App() {
  const [month, setMonth] = useState('2026-01')
  const [decisionHour, setDecisionHour] = useState(12)
  const [dayFilter, setDayFilter] = useState('all')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset day selection when the selected month changes
  const handleMonthChange = useCallback((newMonth) => {
    setMonth(newMonth)
    setDayFilter('all')
  }, [])

  useEffect(() => {
    setDayFilter('all')
  }, [month])

  const loadAnalysis = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const url = `/api/analysis?month=${encodeURIComponent(month)}&decision_hour=${decisionHour}`
      const response = await fetch(url)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.detail || `Request failed with status ${response.status}`)
      }
      setData(payload)
    } catch (err) {
      setData(null)
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to the GridBricks backend API. Please verify the Python service is running.'
      )
    } finally {
      setLoading(false)
    }
  }, [month, decisionHour])

  useEffect(() => {
    loadAnalysis()
  }, [loadAnalysis])

  const allRows = data?.rows ?? []

  // Extract distinct calendar days in the dataset
  const dayOptions = useMemo(() => {
    const set = new Set(allRows.map((r) => r.startTime.slice(0, 10)))
    return Array.from(set).sort()
  }, [allRows])

  // Filter rows based on selected calendar day
  const visibleRows = useMemo(() => {
    if (dayFilter === 'all') return allRows
    return allRows.filter((r) => r.startTime.startsWith(dayFilter))
  }, [allRows, dayFilter])

  // Format data series for Recharts
  const chartRows = useMemo(() => {
    return visibleRows
      .filter((r) => r.forecast != null)
      .map((r) => ({
        ...r,
        label: formatUkDateTime(r.startTime),
      }))
  }, [visibleRows])

  // Top 8 peak absolute miss intervals
  const worstRows = useMemo(() => {
    return allRows
      .filter((r) => r.absoluteError != null)
      .slice()
      .sort((a, b) => (b.absoluteError ?? 0) - (a.absoluteError ?? 0))
      .slice(0, 8)
  }, [allRows])

  const handleExportCsv = () => {
    exportIntervalsToCsv(allRows, month)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 pb-6">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">
                National Grid ESO · Great Britain Wholesale Power Market
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Wind Generation Forecast Monitor
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Quantitatively evaluate day-ahead renewable generation forecasts against Elexon BMRS actuals.
              </p>
            </div>
          </div>

          <FilterBar
            month={month}
            setMonth={handleMonthChange}
            decisionHour={decisionHour}
            setDecisionHour={setDecisionHour}
            dayFilter={dayFilter}
            setDayFilter={setDayFilter}
            dayOptions={dayOptions}
            onRefresh={loadAnalysis}
            onExportCsv={handleExportCsv}
            loading={loading}
            hasData={allRows.length > 0}
          />

          <MethodBanner
            decisionHour={decisionHour}
            decisionRule={data?.decisionRule}
          />

          {error && <ErrorPanel error={error} onRetry={loadAnalysis} />}
          {loading && !data && <LoadingPanel />}

          {/* Section Heading */}
          <div className="flex items-end justify-between gap-3 mb-3.5">
            <div>
              <h2 className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
                Quantitative Accuracy Overview
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Performance metrics computed across all half-hourly settlement periods with eligible forecasts
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {data ? `${data.matchedIntervals.toLocaleString('en-GB')} matched intervals` : 'Waiting for data'}
            </span>
          </div>

          <KpiGrid metrics={data?.metrics} />

          <ForecastChart chartRows={chartRows} loading={loading} />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.55fr)] gap-5 mb-6">
            <CoverageCard data={data} />
            <ErrorTable worstRows={worstRows} />
          </div>

          <IntervalDataTable rows={visibleRows} />

          {/* Page Footer */}
          <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 pb-8 border-t border-slate-200/80 text-[11px] text-slate-400">
            <div>
              <b className="text-slate-600 block text-xs">GridBricks Analytics Platform</b>
              <span>Decision-grade renewable forecast assessment for day-ahead energy trading.</span>
            </div>
            <div className="text-center sm:text-right">
              Data Feeds:{' '}
              <a
                href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 hover:underline font-medium"
              >
                Elexon FUELHH
              </a>{' '}
              ·{' '}
              <a
                href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 hover:underline font-medium"
              >
                WINDFOR
              </a>{' '}
              · Contains BMRS data © Elexon Limited copyright and database right.
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
