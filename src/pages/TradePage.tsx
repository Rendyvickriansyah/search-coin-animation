import { useEffect, useRef, useState } from 'react'
import arrowLeft from '../assets/app/arrow-left.svg'
import { AppHeader } from '../components/AppHeader'
import { CoinSelector } from '../components/CoinSelector'
import { FlashValue } from '../components/FlashValue'
import { OrderPanel, type Unit } from '../components/OrderPanel'
import { PriceChart } from '../components/PriceChart'
import { ScenarioTable } from '../components/ScenarioTable'
import { COINS, type CoinSymbol } from '../data/coins'
import { useQuote } from '../data/livePrices'
import { calcSetup, type Mode, type Side, type Timeframe } from '../data/trade'
import { useCandles } from '../data/useCandles'
import { fmtNum, fmtPct, fmtPrice, fmtSignedUsd, fmtUsd } from '../lib/format'

export function TradePage({ onBack }: { onBack: () => void }) {
  const [symbol, setSymbol] = useState<CoinSymbol>('BTC')
  const [side, setSide] = useState<Side>('long')
  const [mode, setMode] = useState<Mode>('market')
  const [limitEntry, setLimitEntry] = useState<number | null>(null)
  const [leverage, setLeverage] = useState(3)
  const [tp, setTp] = useState<number | null>(null)
  const [sl, setSl] = useState<number | null>(null)
  const [size, setSize] = useState(3550.56)
  const [unit, setUnit] = useState<Unit>('usd')
  const [timeframe, setTimeframe] = useState<Timeframe>('1D')
  const [posted, setPosted] = useState(false)

  const coin = COINS.find((c) => c.symbol === symbol)!
  const quote = useQuote(symbol)
  const price = quote.price
  const entry = mode === 'market' ? price : (limitEntry ?? price)

  const setup = calcSetup({ side, entry, tp, sl, size, leverage })

  // 24h range from an hourly series that follows the live price.
  const hourly = useCandles(symbol, '1h', price).slice(-24)
  const high = Math.max(...hourly.map((c) => c.high))
  const low = Math.min(...hourly.map((c) => c.low))

  const previous = price / (1 + quote.change / 100)
  const diff = price - previous
  const up = quote.change >= 0

  const postTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(postTimer.current), [])

  function changeCoin(next: CoinSymbol) {
    if (next === symbol) return
    setSymbol(next)
    // Levels from one coin mean nothing on another.
    setTp(null)
    setSl(null)
    setLimitEntry(null)
  }

  function changeMode(next: Mode) {
    setMode(next)
    if (next === 'limit') setLimitEntry((current) => current ?? Number(price.toFixed(price >= 10 ? 2 : 4)))
  }

  function post() {
    setPosted(true)
    clearTimeout(postTimer.current)
    postTimer.current = setTimeout(() => setPosted(false), 2500)
  }

  const tpLabel =
    setup.tpPnl !== null && tp !== null
      ? `TP  ${setup.tpDistance! >= 0 ? 'Naik' : 'Turun'} ${fmtPct(setup.tpDistance!)} · ${fmtSignedUsd(setup.tpPnl)}`
      : ''
  const slLabel =
    setup.slPnl !== null && sl !== null
      ? `SL  ${setup.slDistance! >= 0 ? 'Naik' : 'Turun'} ${fmtPct(setup.slDistance!)} · ${fmtSignedUsd(setup.slPnl)}`
      : ''

  return (
    <div className="min-h-screen bg-black font-sans">
      <AppHeader />

      <div className="mx-auto w-full max-w-[1300px] px-4 pb-16 xl:px-0">
        <div className="py-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-3 text-base leading-[1.4] text-[#bbb] outline-none hover:text-white focus-visible:text-white"
          >
            <img alt="" src={arrowLeft} className="block" />
            Kembali
          </button>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_344px]">
          <div className="flex min-w-0 flex-col gap-6">
            <div>
              <CoinSelector
                value={coin.id}
                onChange={(next) => changeCoin(next.symbol)}
              />
            </div>

            <div className="flex flex-col gap-4 px-2">
              <div className="flex items-end gap-3">
                <p className="text-[30px] leading-9 font-medium text-white tabular-nums">
                  <FlashValue value={quote.live ? price : null} className="-mx-1 px-1">
                    ${fmtPrice(price)}
                  </FlashValue>
                </p>
                <p className={`pb-[3px] text-base leading-[1.4] tabular-nums ${up ? 'text-[#4ade80]' : 'text-[#ef4444]'}`}>
                  {up ? '↗' : '↘'} $ {fmtNum(Math.abs(diff), price >= 1000 ? 0 : price >= 10 ? 2 : 4)} ({fmtPct(quote.change, 1)})
                </p>
              </div>
              <dl className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-[1.4]">
                <Stat label="Tertinggi 24h:" value={fmtUsd(high, price >= 10000 ? 1 : 2)} />
                <Stat label="Terendah 24h:" value={fmtUsd(low, price >= 10000 ? 1 : 2)} />
                <Stat label="Maksimum" value={`35% saldo · ${coin.maxLeverage}x`} />
                <Stat label="Funding" value="0,0050% · tiap 4 jam" last />
              </dl>
            </div>

            <div>
              <PriceChart
                symbol={symbol}
                price={price}
                timeframe={timeframe}
                onTimeframe={setTimeframe}
                entry={entry}
                entryLabel={mode === 'market' ? 'Harga terkini' : 'Limit'}
                tp={tp}
                sl={sl}
                tpLabel={tpLabel}
                slLabel={slLabel}
                onTpChange={setTp}
                onSlChange={setSl}
              />
              <p className="px-3 pt-4 text-xs leading-[1.4] text-[#bbb]">
                Tarik garis TP atau SL untuk mengubah harganya
              </p>
            </div>

            <div className="h-px bg-white/10" />

            <ScenarioTable
              entry={entry}
              tp={tp}
              sl={sl}
              liq={setup.liq}
              liqDistance={setup.liqDistance}
              tpPnl={setup.tpPnl}
              slPnl={setup.slPnl}
              size={size}
              notional={setup.notional}
            />
          </div>

          <OrderPanel
            symbol={symbol}
            price={price}
            entry={entry}
            side={side}
            onSide={setSide}
            mode={mode}
            onMode={changeMode}
            onEntry={setLimitEntry}
            leverage={leverage}
            onLeverage={setLeverage}
            tp={tp}
            onTp={setTp}
            sl={sl}
            onSl={setSl}
            size={size}
            onSize={setSize}
            unit={unit}
            onUnit={setUnit}
            setup={setup}
            posted={posted}
            onPost={post}
          />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <dt className="text-[#bbb]">{label}</dt>
        <dd className="m-0 font-medium text-white">{value}</dd>
      </div>
      {!last && <span aria-hidden className="h-4 w-px bg-white/10" />}
    </div>
  )
}
