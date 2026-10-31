import React from 'react'
import { Clock3, ShieldCheck } from 'lucide-react'

export function MethodBanner({ decisionHour, decisionRule }) {
  const formattedHour = String(decisionHour ?? 12).padStart(2, '0')

  return (
    <section className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-4 rounded-xl border border-teal-200/80 bg-teal-50/70 text-teal-950 mb-6 shadow-2xs">
      <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
        <Clock3 size={18} />
      </div>
      <div className="flex-1 text-xs leading-relaxed">
        <b className="text-teal-900 block text-xs font-semibold">
          Day-Ahead Purchasing Cutoff Protocol
        </b>
        <p className="text-teal-800/90 mt-0.5">
          {decisionRule ||
            `For each delivery interval, only forecasts published by ${formattedHour}:00 UK local time on Day D-1 are matched.`}{' '}
          Forecasts published after this market clearing horizon are strictly excluded to prevent look-ahead bias and ensure realistic backtest integrity.
        </p>
      </div>
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold tracking-wider text-teal-800 bg-teal-200/60 rounded-md whitespace-nowrap self-start sm:self-center uppercase">
        <ShieldCheck size={13} className="text-teal-700" />
        Zero Data Leakage
      </span>
    </section>
  )
}
