import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export function LoadingPanel() {
  return (
    <div className="panel p-10 mb-6 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-teal-600 rounded-full spin" />
      <b className="text-slate-800 text-sm font-semibold">
        Fetching Elexon streams and computing quantitative forecast accuracy…
      </b>
      <span className="text-xs text-slate-500 max-w-md leading-relaxed">
        Retrieving national wind generation (FUELHH) and publication-window forecasts (WINDFOR) for the selected period.
      </span>
      <div className="mt-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 max-w-md text-center leading-relaxed">
        ⏱️ Initial live data ingestion from Elexon BMRS may take approximately 10–15 seconds. Subsequent decision-cutoff recalculations utilize in-memory cached streams and update almost instantly.
      </div>
    </div>
  )
}

export function ErrorPanel({ error, onRetry }) {
  if (!error) return null

  return (
    <div className="p-4 mb-6 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-2xs">
      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={18} />
      </div>
      <div className="flex-1 text-xs">
        <b className="block text-xs font-semibold text-rose-950 mb-0.5">
          Analysis Execution Failed
        </b>
        <p className="text-rose-800 font-mono text-[11px] break-all">{error}</p>
        <span className="block text-[10px] text-rose-600 mt-1">
          Verify that the FastAPI backend server is running and the Elexon BMRS endpoint is responding.
        </span>
      </div>
      {onRetry && (
        <button
          className="btn-outline border-rose-300 text-rose-800 hover:bg-rose-100/60 self-start sm:self-center"
          onClick={onRetry}
        >
          <RefreshCw size={13} />
          <span>Try again</span>
        </button>
      )}
    </div>
  )
}
