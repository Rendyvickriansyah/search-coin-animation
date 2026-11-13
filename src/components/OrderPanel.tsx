import swapIcon from '../assets/trade/swap.svg'
import type { CoinSymbol } from '../data/coins'
import { BALANCE, LEVERAGES, MAX_LEVERAGE, MAX_SIZE, type Mode, type Side, type calcSetup } from '../data/trade'
import { fmtNum, fmtPct, fmtPrice, fmtSignedPct, fmtSignedUsd, fmtUsd, priceDigits } from '../lib/format'
import { CoinIcon } from './CoinIcon'
import { FlashValue } from './FlashValue'
import { NumericInput } from './NumericInput'
import { Segmented } from './Segmented'

const CARD = 'flex flex-col rounded-[4px] border border-white/10 bg-[#0c0c0c] p-4'
const LABEL = 'text-sm leading-[1.4] font-medium text-white'
const HINT = 'text-xs leading-[1.4] text-[#bbb]'

export type Unit = 'usd' | 'coin'

type Props = {
  symbol: CoinSymbol
  price: number
  entry: number
  side: Side
  onSide: (side: Side) => void
  mode: Mode
  onMode: (mode: Mode) => void
  onEntry: (value: number | null) => void
  leverage: number
  onLeverage: (value: number) => void
  tp: number | null
  onTp: (value: number | null) => void
  sl: number | null
  onSl: (value: number | null) => void
  size: number
  onSize: (value: number) => void
  unit: Unit
  onUnit: (unit: Unit) => void
  setup: ReturnType<typeof calcSetup>
  posted: boolean
  onPost: () => void
}

function levelHint(kind: 'tp' | 'sl', side: Side, value: number | null, valid: boolean, distance: number | null) {
  const above = (kind === 'tp') === (side === 'long')
  if (value === null) return { text: `${above ? 'Di atas' : 'Di bawah'} harga entry`, error: false }
  if (!valid) return { text: `Harus ${above ? 'di atas' : 'di bawah'} harga entry`, error: true }
  return { text: `${distance! >= 0 ? 'Naik' : 'Turun'} ${fmtPct(distance!)} dari entry`, error: false }
}

export function OrderPanel(props: Props) {
  const { symbol, price, entry, side, mode, leverage, tp, sl, size, unit, setup, posted } = props
  const ready = setup.tpValid && setup.slValid && size > 0
  const pct = Math.min(100, Math.max(0, (size / MAX_SIZE) * 100))

  const tpHint = levelHint('tp', side, tp, setup.tpValid, setup.tpDistance)
  const slHint = levelHint('sl', side, sl, setup.slValid, setup.slDistance)
  const entryDigits = priceDigits(entry)

  const liqText = `${side === 'long' ? 'turun' : 'naik'} ${fmtPct(Math.abs(setup.liqDistance))}`

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Arah posisi" className="flex gap-2">
        {(['long', 'short'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={side === option}
            onClick={() => props.onSide(option)}
            className={`h-8 rounded-full border border-white/10 px-4 text-sm leading-[1.4] font-medium capitalize outline-none backdrop-blur-[40px] transition-[background-color,color,scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.97] ${
              side === option ? 'bg-white/[0.08] text-white' : 'bg-white/[0.02] text-[#bbb] hover:text-white'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <section aria-label="Harga dan leverage" className={`${CARD} gap-4`}>
        <Segmented
          label="Jenis order"
          value={mode}
          onChange={props.onMode}
          options={[
            { id: 'market', label: 'Market' },
            { id: 'limit', label: 'Limit' },
          ]}
        />

        <div className="flex flex-col gap-2">
          <p className={LABEL}>Harga entry</p>
          {mode === 'market' ? (
            <div className="flex h-10 items-center gap-2 rounded-lg border border-white/[0.06] bg-[#161616] px-3">
              <CoinIcon symbol={symbol} size={16} />
              <span className="flex-1 text-sm leading-[1.4] font-medium text-white tabular-nums">
                <FlashValue value={price}>{fmtPrice(price)}</FlashValue>
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] leading-[1.4] text-[#4ade80] uppercase">
                <span className="live-ring relative block size-1.5">
                  <svg viewBox="0 0 6 6" width="6" height="6" aria-hidden className="relative block">
                    <circle className="live-dot" cx="3" cy="3" r="3" fill="#4ade80" />
                  </svg>
                </span>
                Live
              </span>
            </div>
          ) : (
            <NumericInput
              label="Harga entry"
              value={entry}
              digits={entryDigits}
              onValueChange={props.onEntry}
              prefix={<CoinIcon symbol={symbol} size={16} />}
            />
          )}
          <p className={HINT}>
            {mode === 'market'
              ? 'Market: mengikuti harga terkini, tidak bisa diketik'
              : 'Limit: posisi dibuka saat harga menyentuh entry'}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className={LABEL}>Leverage</p>
            <p className={HINT}>maks {MAX_LEVERAGE}x</p>
          </div>
          <Segmented
            label="Leverage"
            value={leverage}
            onChange={props.onLeverage}
            options={LEVERAGES.map((value) => ({ id: value, label: `${value}x` }))}
          />
          <p className={HINT}>Posisi habis kalau harga {liqText} dari entry</p>
        </div>
      </section>

      <section aria-label="Take profit dan stop loss" className={`${CARD} gap-3`}>
        <div className="flex flex-col gap-2">
          <p className={LABEL}>Take profit</p>
          <NumericInput
            label="Take profit"
            value={tp}
            digits={entryDigits}
            onValueChange={props.onTp}
            placeholder="Masukan disini"
            invalid={tpHint.error}
          />
          <p className={`${HINT} ${tpHint.error ? 'text-[#ef4444]' : ''}`}>{tpHint.text}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className={LABEL}>Stop loss</p>
          <NumericInput
            label="Stop loss"
            value={sl}
            digits={entryDigits}
            onValueChange={props.onSl}
            placeholder="Masukan disini"
            invalid={slHint.error}
          />
          <p className={`${HINT} ${slHint.error ? 'text-[#ef4444]' : ''}`}>{slHint.text}</p>
        </div>
      </section>

      <section aria-label="Ukuran posisi" className={`${CARD} gap-4`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className={LABEL}>Ukuran posisi</p>
            <p className={HINT}>
              maks {unit === 'usd' ? fmtUsd(MAX_SIZE) : `${fmtNum(MAX_SIZE / entry, 4)} ${symbol}`}
            </p>
          </div>
          <NumericInput
            label="Ukuran posisi"
            value={unit === 'usd' ? size : size / entry}
            digits={unit === 'usd' ? 2 : 4}
            onValueChange={(value) => {
              const usd = value === null ? 0 : unit === 'usd' ? value : value * entry
              props.onSize(Math.min(MAX_SIZE, Math.max(0, usd)))
            }}
            prefix={
              unit === 'usd' ? (
                <span className="font-geist text-[15px] leading-5 text-[#8b8b90]">$</span>
              ) : (
                <CoinIcon symbol={symbol} size={16} />
              )
            }
            suffix={
              <button
                type="button"
                onClick={() => props.onUnit(unit === 'usd' ? 'coin' : 'usd')}
                aria-label={`Ganti satuan ke ${unit === 'usd' ? symbol : 'USD'}`}
                className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[11px] leading-[14px] font-medium text-[#bbb] outline-none transition-[scale] duration-150 ease-out hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.97]"
              >
                <img alt="" src={swapIcon} className="block size-3" />
                {unit === 'usd' ? 'USD' : symbol}
              </button>
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="relative h-4">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-0 -translate-y-1/2">
              {[0, 25, 50, 75, 100].map((tick) => (
                <span
                  key={tick}
                  className={`absolute top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${pct >= tick ? 'bg-white' : 'bg-white/30'}`}
                  style={{ left: `calc(7px + (100% - 14px) * ${tick / 100})` }}
                />
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(pct)}
              aria-label="Ukuran posisi dalam persen dari maksimum"
              aria-valuetext={`${Math.round(pct)}% dari maksimum`}
              onChange={(event) => props.onSize(Number(((Number(event.target.value) / 100) * MAX_SIZE).toFixed(2)))}
              className="size-slider absolute inset-0"
              style={{ '--pct': `${pct}%` } as React.CSSProperties}
            />
          </div>
          <div className="flex justify-between text-xs leading-[1.4] text-[#bbb]">
            <span>0</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>Maks</span>
          </div>
        </div>
        <p className={HINT}>
          ≈ {fmtNum(setup.qty, 4)} {symbol} · dibulatkan ke bawah
        </p>
      </section>

      <section aria-label="Ringkasan dan kirim" className={`${CARD} gap-5`}>
        <div className="flex gap-3 leading-[1.4]">
          <Summary
            label="Kena TP"
            value={setup.tpValid ? fmtSignedUsd(setup.tpPnl!, 0) : '-'}
            sub={setup.tpValid ? `${fmtSignedPct((setup.tpPnl! / BALANCE) * 100)} saldo` : undefined}
            tone="up"
          />
          <Summary
            label="Kena SL"
            value={setup.slValid ? fmtSignedUsd(setup.slPnl!, 0) : '-'}
            sub={setup.slValid ? `${fmtSignedPct((setup.slPnl! / BALANCE) * 100)} saldo` : undefined}
            tone="down"
          />
          <Summary
            label="R : R"
            value={ready && setup.rr !== null ? `1 : ${fmtNum(setup.rr, 2)}` : '-'}
            sub={ready && setup.rr !== null ? `di ${setup.rr < 1 ? 'bawah' : 'atas'} 1` : undefined}
          />
        </div>
        <div className="h-px bg-white/[0.06]" />
        <dl className="flex flex-col gap-3 leading-[1.4]">
          <Detail label="Sisa saldo simulasi setelah dikirim" value={ready ? fmtUsd(BALANCE - size, 0) : '-'} />
          <Detail label={`Batas ${symbol} terpakai`} value={ready ? `${fmtNum(pct, 0)}%` : '-'} />
          <Detail label="Funding per 8 jam" value={ready ? `≈ ${fmtUsd(setup.fundingPer8h)}` : '-'} />
        </dl>
        <button
          type="button"
          disabled={!ready || posted}
          onClick={props.onPost}
          aria-live="polite"
          className="relative h-11 w-full rounded-lg border border-white px-6 text-sm leading-[1.4] font-medium text-white shadow-[inset_0_-2.135px_2px_rgba(255,255,255,0.25),inset_0_3.2px_6.4px_rgba(255,255,255,0.25),0_14px_10px_rgba(42,98,255,0.12)] outline-none transition-[opacity,scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/60 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(101.84deg, rgb(20, 71, 214) 1.4587%, rgb(32, 79, 211) 36.588%, rgb(76, 121, 242) 81.52%, rgb(119, 156, 255) 96.534%)',
          }}
        >
          {posted ? 'Signal terkirim' : 'Posting Signal'}
        </button>
      </section>
    </div>
  )
}

function Summary({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'up' | 'down' }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <p className="text-xs text-[#bbb]">{label}</p>
      <div>
        <p className={`text-base font-medium whitespace-nowrap tabular-nums ${tone === 'up' && sub ? 'text-[#4ade80]' : tone === 'down' && sub ? 'text-[#ef4444]' : 'text-white'}`}>
          {value}
        </p>
        {sub && <p className="mt-1 text-xs whitespace-nowrap text-[#bbb]">{sub}</p>}
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-[#bbb]">{label}</dt>
      <dd className="m-0 text-sm font-medium whitespace-nowrap text-white tabular-nums">{value}</dd>
    </div>
  )
}
