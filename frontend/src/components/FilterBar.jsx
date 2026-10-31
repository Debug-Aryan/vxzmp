import React, { useMemo } from 'react'
import { RefreshCw, Download, Filter, Clock } from 'lucide-react'
import { CustomSelect } from './CustomSelect'
import { CustomMonthPicker } from './CustomMonthPicker'

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i)

export function FilterBar({
  month,
  setMonth,
  decisionHour,
  setDecisionHour,
  dayFilter,
  setDayFilter,
  dayOptions = [],
  onRefresh,
  onExportCsv,
  loading,
  hasData,
}) {
  // Format options for the decision hour dropdown
  const hourOptions = useMemo(() => {
    return HOUR_OPTIONS.map((h) => ({
      value: h,
      label: `${String(h).padStart(2, '0')}:00 UK time (previous day)`,
      sublabel: h === 12 ? 'GB Day-Ahead Market Midday Auction Standard' : null,
    }))
  }, [])

  // Format options for the calendar day filter dropdown
  const daySelectOptions = useMemo(() => {
    const list = [
      {
        value: 'all',
        label: `All Days (${dayOptions.length} intervals)`,
      },
    ]

    for (const d of dayOptions) {
      const formatted = new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        timeZone: 'UTC',
      })
      list.push({
        value: d,
        label: `${formatted} (${d})`,
      })
    }

    return list
  }, [dayOptions])

  return (
    <section className="panel p-4.5 mb-5 flex flex-wrap items-end gap-4 shadow-sm relative z-30">
      {/* Custom Month Picker */}
      <div className="flex flex-col gap-1.5 min-w-[170px] flex-1">
        <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          Delivery Month
        </label>
        <CustomMonthPicker
          value={month}
          onChange={setMonth}
        />
      </div>

      {/* Custom Decision Cutoff Selector */}
      <div className="flex flex-col gap-1.5 min-w-[220px] flex-1">
        <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1">
          <Clock size={11} className="text-teal-600" />
          Day-Ahead Cutoff (D-1)
        </label>
        <CustomSelect
          value={decisionHour}
          onChange={(val) => setDecisionHour(Number(val))}
          options={hourOptions}
          icon={Clock}
          placeholder="Select cutoff hour..."
        />
      </div>

      {/* Custom Delivery Day Filter */}
      <div className="flex flex-col gap-1.5 min-w-[190px] flex-1">
        <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1">
          <Filter size={11} className="text-teal-600" />
          Delivery Day Filter
        </label>
        <CustomSelect
          value={dayFilter}
          onChange={(val) => setDayFilter(val)}
          options={daySelectOptions}
          icon={Filter}
          placeholder="Select day..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto">
        <button
          className="btn-outline flex-1 sm:flex-initial h-10 px-4"
          onClick={onExportCsv}
          disabled={!hasData || loading}
          title="Export matched dataset to CSV"
        >
          <Download size={14} className="text-slate-600" />
          <span>Export CSV</span>
        </button>

        <button
          className="btn-primary flex-1 sm:flex-initial h-10 px-4"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Evaluating…' : 'Refresh analysis'}</span>
        </button>
      </div>
    </section>
  )
}
