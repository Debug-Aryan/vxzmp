import React from 'react'
import { CalendarDays, Menu } from 'lucide-react'

export function Topbar({ onOpenMobileNav }) {
  return (
    <header className="h-16 border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-8 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-2.5 min-w-0">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="text-xs text-slate-500 font-medium truncate">
          Analytics <span className="text-slate-300 mx-1.5">/</span>
          <span className="text-slate-800 font-semibold">UK Renewable Wind Forecast Monitor</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 shadow-2xs">
          <CalendarDays size={13} className="text-teal-600" />
          <span>Historical Delivery Period (Jan 2026)</span>
        </span>
        <div
          className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shadow-2xs"
          title="GridBricks Energy Platform"
        >
          GB
        </div>
      </div>
    </header>
  )
}
