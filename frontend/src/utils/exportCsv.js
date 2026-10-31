/**
 * Utility to generate and trigger download of CSV export from interval records.
 */

export function exportIntervalsToCsv(rows, month) {
  if (!rows || !rows.length) return

  const headers = [
    'deliveryInterval_UTC',
    'actual_MW',
    'forecast_MW',
    'forecastPublishTime_UTC',
    'decisionCutoff_UTC',
    'error_MW',
    'absoluteError_MW',
  ]

  const csvRows = [headers.join(',')]

  for (const r of rows) {
    const line = [
      `"${r.startTime || ''}"`,
      r.actual != null ? r.actual : '',
      r.forecast != null ? r.forecast : '',
      `"${r.forecastPublishTime || ''}"`,
      `"${r.decisionCutoff || ''}"`,
      r.error != null ? r.error : '',
      r.absoluteError != null ? r.absoluteError : '',
    ]
    csvRows.push(line.join(','))
  }

  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `gridbricks-wind-forecast-${month || 'export'}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

