import React from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Wind } from 'lucide-react'
import { formatMw } from '../utils/formatters'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  const rowData = payload[0]?.payload
  const actualVal = rowData?.actual
  const forecastVal = rowData?.forecast

  // Calculate signed error: Error = Forecast - Actual
  const errorVal =
    rowData?.error != null
      ? rowData.error
      : forecastVal != null && actualVal != null
      ? forecastVal - actualVal
      : null

  const isOver = errorVal != null && errorVal > 0
  const isUnder = errorVal != null && errorVal < 0
  const errorBadgeColor = isOver
    ? 'text-amber-800 bg-amber-50 border-amber-200'
    : isUnder
    ? 'text-blue-800 bg-blue-50 border-blue-200'
    : 'text-slate-600 bg-slate-50 border-slate-200'

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs min-w-[220px]">
      <div className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1.5 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] text-slate-400 font-normal">UK local</span>
      </div>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="flex items-center gap-2.5 my-1.5 text-xs font-semibold"
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500 font-medium">
            {entry.name === 'actual' ? 'Actual Generation:' : 'Eligible Forecast:'}
          </span>
          <span className="ml-auto text-slate-900 font-bold font-mono">
            {formatMw(entry.value)} MW
          </span>
        </div>
      ))}

      {errorVal != null && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Signed Error (F - A):</span>
          <span className={`px-2 py-0.5 rounded font-bold font-mono text-xs border ${errorBadgeColor}`}>
            {errorVal > 0 ? '+' : ''}{formatMw(errorVal)} MW
          </span>
        </div>
      )}
    </div>
  )
}

export function ForecastChart({ chartRows, loading }) {
  return (
    <section className="panel p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
            Actual vs Day-Ahead Forecast Generation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Half-hourly national wind power time-series · Megawatts (MW) · UK local time
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg self-start sm:self-center">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded-sm bg-blue-600" />
            <span>Actual Generation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded-sm bg-teal-600" />
            <span>Eligible Forecast (D-1)</span>
          </div>
        </div>
      </div>

      {chartRows && chartRows.length > 0 ? (
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartRows}
              margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#64748b' }}
                minTickGap={44}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v) => `${v.toLocaleString('en-GB')}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="actual"
                name="actual"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="forecast"
                stroke="#0d9488"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Wind size={22} />
          </div>
          <b className="text-slate-700 text-xs font-semibold">
            {loading ? 'Evaluating time-series data…' : 'No chart intervals available'}
          </b>
          <span className="text-[11px] text-slate-400">
            {loading
              ? 'Aggregating settlement periods from Elexon...'
              : 'Please select a delivery period with valid wind records.'}
          </span>
        </div>
      )}
    </section>
  )
}
