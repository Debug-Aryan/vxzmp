import React, { useState, useRef, useEffect } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function CustomMonthPicker({ value = '2026-01', onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Parse current year and month from value (YYYY-MM)
  const [currentYear, currentMonthNum] = (() => {
    try {
      const parts = value.split('-')
      return [parseInt(parts[0], 10) || 2026, parseInt(parts[1], 10) || 1]
    } catch {
      return [2026, 1]
    }
  })()

  // State for year view in popover
  const [viewYear, setViewYear] = useState(currentYear)

  // Sync viewYear when value changes
  useEffect(() => {
    setViewYear(currentYear)
  }, [currentYear])

  // Close popover on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayLabel = `${MONTH_NAMES[currentMonthNum - 1]} ${currentYear}`

  const handleSelectMonth = (monthIndex) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, '0')
    const newValue = `${viewYear}-${formattedMonth}`
    onChange(newValue)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 flex items-center justify-between gap-2.5 transition-all text-left cursor-pointer"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays size={14} className="text-teal-600 flex-shrink-0" />
          <span className="truncate font-semibold text-slate-800">
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-teal-600' : ''
          }`}
        />
      </button>

      {/* Popover Calendar Grid */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 w-64 text-xs animate-in fade-in zoom-in-95 duration-100">
          {/* Year Navigation Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setViewYear((y) => Math.max(2020, y - 1))}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="font-heading font-bold text-sm text-slate-900">
              {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear((y) => Math.min(2026, y + 1))}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="Next Year"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* 3x4 Month Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {SHORT_MONTHS.map((mName, idx) => {
              const isSelected = viewYear === currentYear && idx + 1 === currentMonthNum
              return (
                <button
                  key={mName}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`h-9 rounded-lg font-medium text-xs flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-700 text-white font-bold shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {mName}
                </button>
              )
            })}
          </div>

          {/* Quick preset badge */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Assessment backtest:</span>
            <button
              type="button"
              onClick={() => {
                onChange('2026-01')
                setViewYear(2026)
                setIsOpen(false)
              }}
              className="text-teal-700 hover:text-teal-800 font-bold uppercase tracking-wider cursor-pointer"
            >
              Jan 2026
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

