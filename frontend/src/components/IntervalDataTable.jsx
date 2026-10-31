import React, { useState, useEffect } from 'react'
import { formatMw, formatUkDateTime, formatUtcDateTime } from '../utils/formatters'

const PAGE_SIZE = 48

export function IntervalDataTable({ rows }) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalRows = rows?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const pageRows = rows?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) ?? []

  // Ensure current page stays clamped within available pages when rows are filtered
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const handlePrev = () => setCurrentPage(Math.max(1, safePage - 1))
  const handleNext = () => setCurrentPage(Math.min(totalPages, safePage + 1))

  return (
    <section className="panel p-5 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
            Half-Hourly Delivery Interval Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete audit trail: actual generation, selected forecast, publication timestamp, and signed error
          </p>
        </div>
        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-wider self-start sm:self-center">
          {totalRows.toLocaleString('en-GB')} Matched Periods
        </span>
      </div>

      <div className="overflow-x-auto max-h-[460px] border border-slate-200/80 rounded-lg">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50/95 sticky top-0 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-bold tracking-wider z-1">
            <tr>
              <th className="py-2.5 px-3">Delivery Time (UK)</th>
              <th className="py-2.5 px-3">Actual (MW)</th>
              <th className="py-2.5 px-3">Forecast (MW)</th>
              <th className="py-2.5 px-3">Published At (UTC)</th>
              <th className="py-2.5 px-3">Cutoff Applied (UTC)</th>
              <th className="py-2.5 px-3 text-right">Error (F - A)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {pageRows.length > 0 ? (
              pageRows.map((r) => {
                const isOver = r.error != null && r.error > 0
                const isUnder = r.error != null && r.error < 0
                const errorColor = isOver
                  ? 'text-amber-700 font-bold'
                  : isUnder
                  ? 'text-blue-700 font-bold'
                  : 'text-slate-500'

                return (
                  <tr key={r.startTime} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      {formatUkDateTime(r.startTime)}
                    </td>
                    <td className="py-2.5 px-3">{formatMw(r.actual)}</td>
                    <td className="py-2.5 px-3">{formatMw(r.forecast)}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {r.forecastPublishTime
                        ? formatUtcDateTime(r.forecastPublishTime)
                        : 'No eligible forecast'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {formatUtcDateTime(r.decisionCutoff)}
                    </td>
                    <td className={`py-2.5 px-3 text-right ${errorColor}`}>
                      {r.error != null
                        ? `${r.error > 0 ? '+' : ''}${formatMw(r.error)} MW`
                        : '—'}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs font-sans text-slate-400">
                  No interval records found. Start the backend or adjust filter parameters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span>
          {totalRows > 0 ? (
            <>
              Showing intervals {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, totalRows)} of {totalRows.toLocaleString('en-GB')}
            </>
          ) : (
            'Showing 0 intervals'
          )}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              className="btn-outline py-1 px-2.5 text-[11px]"
              onClick={handlePrev}
              disabled={safePage === 1}
            >
              Previous
            </button>
            <span className="text-[11px] font-medium text-slate-600 px-1">
              Page {safePage} of {totalPages}
            </span>
            <button
              className="btn-outline py-1 px-2.5 text-[11px]"
              onClick={handleNext}
              disabled={safePage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
