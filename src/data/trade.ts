import type { CoinSymbol } from './coins'

export type Side = 'long' | 'short'
export type Mode = 'market' | 'limit'

/** Simulated account balance shown in the design. */
export const BALANCE = 10144.48
/** Largest position the form allows: half the balance ($5.072,24). */
export const MAX_SIZE = BALANCE / 2
export const MAX_LEVERAGE = 5
export const LEVERAGES = [1, 2, 3, 4, 5] as const
/** Funding rate per 4 hours, as shown in the price header (0,0050%). */
export const FUNDING_RATE = 0.00005

export type Setup = {
  side: Side
  entry: number
  tp: number | null
  sl: number | null
  /** Margin in USD. */
  size: number
  leverage: number
}

export function directionOf(side: Side) {
  return side === 'long' ? 1 : -1
}

/** Everything the scenario table and the summary card show, from one place. */
export function calcSetup({ side, entry, tp, sl, size, leverage }: Setup) {
  const dir = directionOf(side)
  const notional = size * leverage
  const pnlAt = (price: number) => (notional * dir * (price - entry)) / entry
  const distance = (price: number) => ((price - entry) / entry) * 100

  // Liquidation sits just inside the point where the margin is gone.
  const liq = entry * (1 - (dir * 0.97) / leverage)
  const qty = Math.floor((notional / entry) * 1e4) / 1e4

  const tpValid = tp !== null && dir * (tp - entry) > 0
  const slValid = sl !== null && dir * (sl - entry) < 0
  const tpPnl = tp !== null ? pnlAt(tp) : null
  const slPnl = sl !== null ? pnlAt(sl) : null
  const rr = tpPnl !== null && slPnl !== null && slPnl !== 0 ? Math.abs(tpPnl / slPnl) : null

  return {
    notional,
    qty,
    liq,
    liqDistance: distance(liq),
    tpValid,
    slValid,
    tpPnl,
    slPnl,
    tpDistance: tp !== null ? distance(tp) : null,
    slDistance: sl !== null ? distance(sl) : null,
    rr,
    liqLoss: -size,
    fundingPer8h: notional * FUNDING_RATE * 2,
    pnlAt,
  }
}

// ---------------------------------------------------------------------------
// Candles. There is no history feed, so a seeded random walk stands in for it.
// The series is anchored to the live price and its last candle follows it.

export type Candle = { time: number; open: number; high: number; low: number; close: number }

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D' | '1W'
export const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1D', '1W']

// 1m–4h are candle intervals. 1D shows the last day in 30-minute candles and
// 1W the last week in 4-hour candles, as in the design's hourly time axis.
const SERIES: Record<Timeframe, { minutes: number; count: number; vol: number }> = {
  '1m': { minutes: 1, count: 60, vol: 0.0006 },
  '5m': { minutes: 5, count: 60, vol: 0.0012 },
  '15m': { minutes: 15, count: 56, vol: 0.002 },
  '1h': { minutes: 60, count: 48, vol: 0.004 },
  '4h': { minutes: 240, count: 48, vol: 0.008 },
  '1D': { minutes: 30, count: 48, vol: 0.005 },
  '1W': { minutes: 240, count: 42, vol: 0.01 },
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

export function makeCandles(symbol: CoinSymbol, timeframe: Timeframe, anchor: number): Candle[] {
  const { minutes, count, vol } = SERIES[timeframe]
  const random = mulberry32(hash(`${symbol}-${timeframe}`))
  const step = minutes * 60_000
  const end = Math.floor(Date.now() / step) * step

  const raw: Candle[] = []
  let close = 1
  for (let i = 0; i < count; i++) {
    const open = close
    close = open * (1 + (random() - 0.5) * vol * 2 + (random() - 0.48) * vol * 0.4)
    raw.push({
      time: end - (count - 1 - i) * step,
      open,
      close,
      high: Math.max(open, close) * (1 + random() * vol * 0.6),
      low: Math.min(open, close) * (1 - random() * vol * 0.6),
    })
  }
  const scale = anchor / raw[raw.length - 1].close
  return raw.map((c) => ({
    time: c.time,
    open: c.open * scale,
    high: c.high * scale,
    low: c.low * scale,
    close: c.close * scale,
  }))
}

/** The last candle follows the live price. */
export function withLivePrice(candles: Candle[], price: number): Candle[] {
  const last = candles[candles.length - 1]
  return [
    ...candles.slice(0, -1),
    { ...last, close: price, high: Math.max(last.high, price), low: Math.min(last.low, price) },
  ]
}

export function niceStep(rough: number) {
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const n = rough / pow
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return nice * pow
}
