/**
 * Numerical, date, and unit formatters for GridBricks analytics.
 */

export function formatMw(value, digits = 1) {
  if (value == null || !Number.isFinite(value)) {
    return '—'
  }
  return Number(value).toLocaleString('en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatPercent(value, digits = 1) {
  if (value == null || !Number.isFinite(value)) {
    return '—'
  }
  return Number(value).toLocaleString('en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatUkDateTime(isoString) {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/London',
    })
  } catch {
    return String(isoString)
  }
}

export function formatUtcDateTime(isoString) {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }) + ' UTC'
  } catch {
    return String(isoString)
  }
}

