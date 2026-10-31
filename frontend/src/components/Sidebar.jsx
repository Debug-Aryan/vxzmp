import React, { useEffect } from 'react'
import { Activity, BarChart3, Wind, X } from 'lucide-react'

export function Sidebar({ mobileOpen = false, onClose }) {
  // Close drawer on Escape key press
  useEffect(() => {
    if (!mobileOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, onClose])

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col h-full min-h-full">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-8 mb-4 border-b border-navy-800/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-500/30 text-teal-300 flex items-center justify-center shadow-inner">
            <Wind size={22} />
          </div>
          <div>
            <strong className="block font-heading text-lg font-bold tracking-tight text-white">
              GridBricks
            </strong>
            <span className="block text-[9px] tracking-widest text-slate-400 font-bold uppercase">
              Wind Intelligence
            </span>
          </div>
        </div>
        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Workspace Menu */}
      <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase px-2 mb-2 flex-shrink-0">
        Workspace
      </div>
      <button
        type="button"
        onClick={() => {
          if (isMobile && onClose) onClose()
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-navy-700 text-white font-medium text-xs shadow-sm border-l-2 border-teal-400 flex-shrink-0 text-left cursor-pointer hover:bg-navy-600 transition-colors"
      >
        <BarChart3 size={16} className="text-teal-400" />
        <span>Forecast monitor</span>
      </button>

      {/* Data Source Chip */}
      <div className="mt-8 text-[10px] text-slate-400 font-bold tracking-wider uppercase px-2 mb-2 flex-shrink-0">
        Data Connection
      </div>
      <div className="flex items-center gap-3 p-3 rounded-xl border border-navy-600 bg-navy-800/40 flex-shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] flex-shrink-0" />
        <div>
          <b className="block text-xs font-semibold text-slate-200">Elexon BMRS API</b>
          <span className="block text-[10px] text-slate-400">FUELHH & WINDFOR streams</span>
        </div>
      </div>

      {/* Decision-Grade Analytics Callout */}
      <div className="mt-8 bg-navy-800/70 border border-navy-600/70 rounded-xl p-4 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal-950 text-teal-300 flex items-center justify-center mb-3">
          <Activity size={16} />
        </div>
        <b className="block text-xs font-semibold text-slate-200 mb-1">
          Decision-Grade Backtesting
        </b>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Simulate day-ahead market purchasing cutoffs to eliminate look-ahead bias and protect against imbalance charges.
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-6 flex items-center gap-2 text-[11px] text-slate-400 border-t border-navy-800/80 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>Production build · v0.1.0</span>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-64 bg-navy-900 text-slate-100 flex-shrink-0 flex-col p-6 h-screen sticky top-0 overflow-y-auto border-r border-navy-800 z-20 shadow-xl">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer & Backdrop */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-over Drawer */}
          <aside
            className="relative w-72 max-w-[85vw] bg-navy-900 text-slate-100 flex flex-col p-6 overflow-y-auto shadow-2xl border-r border-navy-800 z-50 animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  )
}
