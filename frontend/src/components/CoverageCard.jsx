import React from 'react'
import { formatPercent } from '../utils/formatters'

export function CoverageCard({ data }) {
  const coverage = data?.coveragePercent ?? 0
  const actualIntervals = data?.actualIntervals ?? 0
  const matchedIntervals = data?.matchedIntervals ?? 0
  const expectedIntervals = data?.expectedIntervals ?? 1488

  return (
    <div className="panel p-5 flex flex-col justify-between">
      <div>
        <div className="mb-3">
          <h2 className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
            Data Coverage & Integrity
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Settlement period completeness & forecast availability
          </p>
        </div>

        <div className="my-5">
          <div className="font-heading font-black text-4xl text-slate-900 tracking-tight flex items-baseline gap-1">
            {data ? formatPercent(coverage, 1) : '—'}
            <span className="text-lg font-semibold text-slate-400">%</span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-sky-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, coverage))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
          <div>
            <span className="block text-[11px] text-slate-400 font-medium mb-1">
              Actual Wind Intervals
            </span>
            <b className="block text-sm font-bold text-slate-800">
              {actualIntervals.toLocaleString('en-GB')}
            </b>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-medium mb-1">
              Matched Forecasts
            </span>
            <b className="block text-sm font-bold text-slate-800">
              {matchedIntervals.toLocaleString('en-GB')}
            </b>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-medium mb-1">
              Expected Month Total
            </span>
            <b className="block text-sm font-bold text-slate-800">
              {expectedIntervals.toLocaleString('en-GB')}
            </b>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-medium mb-1">
              Unmatched / Missing
            </span>
            <b className="block text-sm font-bold text-slate-800">
              {(actualIntervals - matchedIntervals).toLocaleString('en-GB')}
            </b>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] leading-relaxed text-slate-400">
        A standard 31-day delivery month contains 1,488 expected half-hour intervals. Only eligible pre-cutoff forecasts are matched; missing periods are not fabricated.
      </div>
    </div>
  )
}
