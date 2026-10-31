import React from 'react'
import { formatMw, formatUkDateTime } from '../utils/formatters'

export function ErrorTable({ worstRows }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
            Peak Forecast Deviations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Half-hour delivery intervals with the largest absolute forecast misses
          </p>
        </div>
        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded uppercase tracking-wider">
          Top 8 Outliers
        </span>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <th className="py-2.5 px-3">Delivery Interval</th>
              <th className="py-2.5 px-3">Actual</th>
              <th className="py-2.5 px-3">Forecast</th>
              <th className="py-2.5 px-3 text-right">Absolute Miss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {worstRows && worstRows.length > 0 ? (
              worstRows.map((row) => (
                <tr key={row.startTime} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                    {formatUkDateTime(row.startTime)}
                  </td>
                  <td className="py-2.5 px-3">{formatMw(row.actual)} MW</td>
                  <td className="py-2.5 px-3">{formatMw(row.forecast)} MW</td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                    +{formatMw(row.absoluteError)} MW
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs font-sans text-slate-400">
                  No matched records available for outlier ranking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
