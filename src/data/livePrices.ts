import { useSyncExternalStore } from 'react'
import type { CoinSymbol } from './coins'

export type Quote = {
  price: number
  /** 24h change in percent. */
  change: number
  /** False until the first tick arrives; the seed value should not flash. */
  live: boolean
}

export type FeedSource = 'connecting' | 'binance' | 'simulated'

// Shown until the first tick lands. In demo mode the 24h changes below are the
// starting point of the simulation: a mix of gainers and losers.
const SEED: Record<CoinSymbol, Quote> = {
  BTC: { price: 68700, change: 1.84, live: false },
  ETH: { price: 1936, change: 0.92, live: false },
  LTC: { price: 48.8, change: 2.31, live: false },
  XRP: { price: 1.03, change: -0.45, live: false },
  DOT: { price: 0.825, change: -1.12, live: false },
  ADA: { price: 0.17, change: 3.08, live: false },
  SOL: { price: 79.9, change: -0.76, live: false },
  BNB: { price: 629, change: 0.37, live: false },
}

// 'demo' (default): real starting prices, then a simulated walk with mixed
// gainers and losers. '?feed=live' in the URL: the real exchange stream, which
// shows whatever the market is doing — including an all-red day.
const MODE = new URLSearchParams(location.search).get('feed') === 'live' ? 'live' : 'demo'

const SYMBOLS = Object.keys(SEED) as CoinSymbol[]
const STREAM_URL = `wss://stream.binance.com:9443/stream?streams=${SYMBOLS.map(
  (symbol) => `${symbol.toLowerCase()}usdt@miniTicker`,
).join('/')}`

const SNAPSHOT_URL = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(
  JSON.stringify(SYMBOLS.map((symbol) => `${symbol}USDT`)),
)}`

const quotes = new Map<CoinSymbol, Quote>(SYMBOLS.map((symbol) => [symbol, SEED[symbol]]))
const listeners = new Set<() => void>()
let source: FeedSource = 'connecting'
let subscribers = 0
let stop: (() => void) | null = null

function emit() {
  for (const listener of listeners) listener()
}

function setQuote(symbol: CoinSymbol, price: number, change: number) {
  const current = quotes.get(symbol)
  if (current?.live && current.price === price && current.change === change) return
  quotes.set(symbol, { price, change, live: true })
}

function setSource(next: FeedSource) {
  source = next
  emit()
}

/** Random walk used only when the exchange stream can't be reached. */
function simulate() {
  setSource('simulated')
  const timer = setInterval(() => {
    for (const symbol of SYMBOLS) {
      if (Math.random() > 0.45) continue
      const quote = quotes.get(symbol)!
      const drift = (Math.random() - 0.5) * 0.004
      setQuote(symbol, quote.price * (1 + drift), quote.change + drift * 100)
    }
    emit()
  }, 1200)
  return () => clearInterval(timer)
}

/** Demo feed: real starting prices when reachable, then the simulation. */
function connectDemo() {
  let stopSimulation: (() => void) | null = null
  let closed = false
  const begin = () => {
    if (!closed && !stopSimulation) stopSimulation = simulate()
  }
  const timer = setTimeout(begin, 1500)

  fetch(SNAPSHOT_URL)
    .then((response) => response.json())
    .then((tickers: { symbol: string; lastPrice: string }[]) => {
      if (closed || stopSimulation) return
      for (const ticker of tickers) {
        const symbol = ticker.symbol.replace('USDT', '') as CoinSymbol
        const quote = quotes.get(symbol)
        if (quote) setQuote(symbol, Number(ticker.lastPrice), quote.change)
      }
    })
    .catch(() => {})
    .finally(begin)

  return () => {
    closed = true
    clearTimeout(timer)
    stopSimulation?.()
  }
}

function connect() {
  let stopSimulation: (() => void) | null = null
  let closed = false
  let socket: WebSocket | null = null

  const fallBack = () => {
    if (closed || stopSimulation) return
    socket?.close()
    stopSimulation = simulate()
  }
  // No tick within 5s means the stream is blocked or down.
  const watchdog = setTimeout(fallBack, 5000)

  // The stream only speaks when a pair trades, so quiet pairs would sit on
  // their placeholder for a while. One snapshot fills every row up front.
  fetch(SNAPSHOT_URL)
    .then((response) => response.json())
    .then((tickers: { symbol: string; lastPrice: string; priceChangePercent: string }[]) => {
      if (closed || stopSimulation) return
      for (const ticker of tickers) {
        const symbol = ticker.symbol.replace('USDT', '') as CoinSymbol
        if (quotes.get(symbol)?.live === false) {
          setQuote(symbol, Number(ticker.lastPrice), Number(ticker.priceChangePercent))
        }
      }
      emit()
    })
    .catch(() => {})

  try {
    socket = new WebSocket(STREAM_URL)
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data as string).data as { s: string; c: string; o: string }
      const symbol = data.s.replace('USDT', '') as CoinSymbol
      if (!quotes.has(symbol)) return
      const price = Number(data.c)
      const open = Number(data.o)
      clearTimeout(watchdog)
      setQuote(symbol, price, open ? ((price - open) / open) * 100 : 0)
      if (source !== 'binance') source = 'binance'
      emit()
    }
    socket.onerror = fallBack
    socket.onclose = fallBack
  } catch {
    fallBack()
  }

  return () => {
    closed = true
    clearTimeout(watchdog)
    socket?.close()
    stopSimulation?.()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (subscribers++ === 0) stop = MODE === 'live' ? connect() : connectDemo()
  return () => {
    listeners.delete(listener)
    if (--subscribers === 0) {
      stop?.()
      stop = null
      source = 'connecting'
    }
  }
}

/** Latest quote without subscribing — for one-off reads such as sorting. */
export function getQuote(symbol: CoinSymbol) {
  return quotes.get(symbol)!
}

/** Subscribes one row to its own coin, so a tick re-renders only that row. */
export function useQuote(symbol: CoinSymbol) {
  return useSyncExternalStore(subscribe, () => quotes.get(symbol)!)
}

export function useFeedSource() {
  return useSyncExternalStore(subscribe, () => source)
}
