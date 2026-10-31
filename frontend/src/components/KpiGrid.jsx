import React from 'react'
import { Activity, BarChart3, Wind, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatMw, formatPercent } from '../utils/formatters'

function KpiCard({ title, value, unit, caption, icon, iconBg, iconColor }) {
  return (
    <div className="panel p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
          {icon}
        </span>
      </div>
      <div className="mt-4 mb-2">
        <div className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight flex items-baseline gap-1.5">
          {value}
          <span className="text-xs font-sans font-semibold text-slate-400">{unit}</span>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 font-medium">
        {caption}
      </div>
    </div>
  )
}

export function KpiGrid({ metrics }) {
  const mae = metrics?.maeMw
  const rmse = metrics?.rmseMw
  const wape = metrics?.wapePercent
  const bias = metrics?.biasMw

  let biasCaption = 'Forecast minus actual (F - A)'
  let isUnderforecast = false
  if (bias != null) {
    if (bias > 0) {
      biasCaption = 'Tends to overforecast (imbalance long risk)'
    } else if (bias < 0) {
      biasCaption = 'Tends to underforecast (unhedged exposure)'
      isUnderforecast = true
    } else {
      biasCaption = 'No net directional bias'
    }
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard
        title="Mean Absolute Error"
        value={formatMw(mae)}
        unit="MW"
        caption="Average absolute prediction miss per half-hour"
        icon={<Activity size={17} />}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
      />
      <KpiCard
        title="Root Mean Squared Error"
        value={formatMw(rmse)}
        unit="MW"
        caption="Penalizes large extreme deviations"
        icon={<BarChart3 size={17} />}
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
      />
      <KpiCard
        title="Weighted Abs. Error"
        value={formatPercent(wape)}
        unit="%"
        caption="Total absolute error vs actual volume (WAPE)"
        icon={<Wind size={17} />}
        iconBg="bg-teal-50"
        iconColor="text-teal-600"
      />
      <KpiCard
        title="Forecast Bias (Mean Error)"
        value={formatMw(bias)}
        unit="MW"
        caption={biasCaption}
        icon={isUnderforecast ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}
        iconBg={isUnderforecast ? 'bg-blue-50' : 'bg-amber-50'}
        iconColor={isUnderforecast ? 'text-blue-600' : 'text-amber-600'}
      />
    </section>
  )
}
