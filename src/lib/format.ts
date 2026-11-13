// Indonesian number style used across the design: 1.234,5

const formatters = new Map<number, Intl.NumberFormat>()

function formatter(digits: number) {
  let nf = formatters.get(digits)
  if (!nf) {
    nf = new Intl.NumberFormat('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    formatters.set(digits, nf)
  }
  return nf
}

export function fmtNum(value: number, digits: number) {
  return formatter(digits).format(value)
}

/** Fewer decimals for big prices, more for small ones: 73.834,3 · 679,60 · 1,0490 */
export function priceDigits(value: number) {
  const abs = Math.abs(value)
  return abs >= 10000 ? 1 : abs >= 10 ? 2 : 4
}

export function fmtPrice(value: number) {
  return fmtNum(value, priceDigits(value))
}

export function fmtUsd(value: number, digits = 2) {
  return `${value < 0 ? '-' : ''}$${fmtNum(Math.abs(value), digits)}`
}

export function fmtSignedUsd(value: number, digits = 2) {
  return `${value < 0 ? '-' : '+'}$${fmtNum(Math.abs(value), digits)}`
}

export function fmtPct(value: number, digits = 1) {
  return `${fmtNum(Math.abs(value), digits)}%`
}

export function fmtSignedPct(value: number, digits = 1) {
  return `${value < 0 ? '-' : '+'}${fmtNum(Math.abs(value), digits)}%`
}

/** Parses what a person types: 84000 · 84.000 · 84.000,5 · 84000.5 */
export function parseNum(text: string): number | null {
  const trimmed = text.trim().replace(/\s/g, '')
  if (!trimmed) return null
  let normalized: string
  if (trimmed.includes(',')) normalized = trimmed.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) normalized = trimmed.replace(/\./g, '')
  else normalized = trimmed
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}
