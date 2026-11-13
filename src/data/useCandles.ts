import { useMemo, useState } from 'react'
import type { CoinSymbol } from './coins'
import { makeCandles, withLivePrice, type Timeframe } from './trade'

// If the live price drifts this far from where the series was anchored (for
// example when the first real quote replaces the placeholder), build the series
// again around the new price instead of letting the last candle jump.
const REANCHOR = 0.015

/** Candles for a coin and timeframe whose last candle follows the live price. */
export function useCandles(symbol: CoinSymbol, timeframe: Timeframe, price: number) {
  const key = `${symbol}-${timeframe}`
  const [anchor, setAnchor] = useState({ key, price })

  // Adjusting state while rendering is the supported way to derive it from props.
  let current = anchor
  if (anchor.key !== key || Math.abs(price / anchor.price - 1) > REANCHOR) {
    current = { key, price }
    setAnchor(current)
  }

  const base = useMemo(
    () => makeCandles(symbol, timeframe, current.price),
    [symbol, timeframe, current.price],
  )
  return useMemo(() => withLivePrice(base, price), [base, price])
}
