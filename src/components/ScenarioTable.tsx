import triUp from '../assets/trade/tri-up.svg'
import { BALANCE } from '../data/trade'
import { fmtNum, fmtPct, fmtPrice, fmtSignedPct, fmtSignedUsd, fmtUsd } from '../lib/format'
import { FlashValue } from './FlashValue'

type Row = {
  key: string
  color: string
  label: string
  price: number | null
  /** Signed percent from entry; null renders a dash. */
  distance: number | null
  /** Signed profit or loss in USD. */
  pnl: number | null
}

const GRID = 'grid grid-cols-[minmax(0,1fr)_150px_200px_200px_200px]'
const HEAD = 'flex items-center justify-end p-3 font-mono text-xs leading-[1.4] font-medium text-[#bbb] uppercase'
const CELL = 'flex h-full items-center justify-end px-3 py-2.5 text-sm leading-[1.4] whitespace-nowrap text-white tabular-nums'

function tablePrice(value: number) {
  return fmtNum(value, value >= 1000 ? 0 : value >= 10 ? 2 : 4)
}

export function ScenarioTable({
  entry,
  tp,
  sl,
  liq,
  liqDistance,
  tpPnl,
  slPnl,
  size,
  notional,
}: {
  entry: number
  tp: number | null
  sl: number | null
  liq: number
  liqDistance: number
  tpPnl: number | null
  slPnl: number | null
  size: number
  notional: number
}) {
  const distance = (price: number | null) => (price === null ? null : ((price - entry) / entry) * 100)

  const rows: Row[] = [
    { key: 'tp', color: '#22c55e', label: 'Kena Take Profit', price: tp, distance: distance(tp), pnl: tpPnl },
    { key: 'entry', color: '#ffffff', label: 'Masuk Posisi', price: entry, distance: 0, pnl: 0 },
    { key: 'sl', color: '#ef4444', label: 'Kena Stop Loss', price: sl, distance: distance(sl), pnl: slPnl },
    { key: 'liq', color: '#f97316', label: 'Likuidasi', price: liq, distance: liqDistance, pnl: -size },
  ]

  return (
    <section aria-labelledby="skenario-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 px-3 text-sm leading-[1.4]">
        <h2 id="skenario-title" className="font-medium text-white">
          Skenario Harga
        </h2>
        <p className="text-[#bbb]">
          Dihitung dari entry {fmtPrice(entry)}, berlaku setelah sinyal aktif. Perkiraan, sebelum funding.
        </p>
      </div>

      <div className="overflow-x-auto border border-white/10">
        <div role="table" aria-label="Skenario harga" className="min-w-[900px]">
          <div role="row" className={`${GRID} h-[52px] border-b border-white/10 bg-white/[0.02]`}>
            <div role="columnheader" className="flex items-center p-3 font-mono text-xs leading-[1.4] font-medium text-[#bbb] uppercase">
              skenario
            </div>
            <div role="columnheader" className={HEAD}>
              Harga
            </div>
            <div role="columnheader" className={HEAD}>
              jarak dari entry
            </div>
            <div role="columnheader" className={HEAD}>
              untung / rugi
            </div>
            <div role="columnheader" className={HEAD}>
              dari saldo
            </div>
          </div>

          {rows.map((row) => {
            const loss = row.pnl !== null && row.pnl < 0
            const gain = row.pnl !== null && row.pnl > 0
            return (
              <div key={row.key} role="row" className={`${GRID} h-16 border-b border-white/10`}>
                <div role="cell" className="flex min-w-0 items-center gap-2 px-3 py-2.5 text-sm leading-[1.4] font-medium whitespace-nowrap text-white">
                  <span aria-hidden className="size-2.5 shrink-0" style={{ background: row.color }} />
                  {row.label}
                </div>
                <div role="cell" className={CELL}>
                  {row.price === null ? (
                    '-'
                  ) : (
                    <FlashValue value={row.key === 'entry' ? entry : null}>{tablePrice(row.price)}</FlashValue>
                  )}
                </div>
                <div role="cell" className={`${CELL} gap-1.5 text-[#bbb]`}>
                  {row.distance === null ? (
                    '-'
                  ) : row.key === 'entry' ? (
                    '0%'
                  ) : (
                    <>
                      <span>{row.distance >= 0 ? 'Naik' : 'Turun'}</span>
                      <span>{fmtPct(row.distance)}</span>
                    </>
                  )}
                </div>
                <div
                  role="cell"
                  className={`${CELL} gap-2.5 ${gain ? 'font-medium text-[#22c55e]' : loss ? 'font-medium text-[#ef4444]' : ''}`}
                >
                  {row.pnl === null ? (
                    '-'
                  ) : row.key === 'entry' ? (
                    fmtUsd(0)
                  ) : (
                    <>
                      {fmtSignedUsd(row.pnl)}
                      <img alt="" src={triUp} className={`block size-3 ${loss ? '-scale-y-100' : ''}`} />
                    </>
                  )}
                </div>
                <div role="cell" className={CELL}>
                  {row.pnl === null ? '-' : row.key === 'entry' ? '0%' : fmtSignedPct((row.pnl / BALANCE) * 100)}
                </div>
              </div>
            )
          })}

          <div role="row" className="flex h-[52px] items-center justify-between bg-white/[0.02] text-sm leading-[1.4]">
            <div role="cell" className="flex items-center gap-6 px-3 py-2.5 whitespace-nowrap">
              <span className="flex gap-2">
                <span className="text-[#bbb]">Modal sinyal</span>
                <span className="font-medium text-white">{fmtUsd(size)}</span>
              </span>
              <span aria-hidden className="h-5 w-px bg-white/10" />
              <span className="flex gap-2">
                <span className="text-[#bbb]">Nilai posisi</span>
                <span className="font-medium text-white">{fmtUsd(notional)}</span>
              </span>
            </div>
            <div role="cell" className="flex items-center justify-end gap-2 px-3 py-2.5 whitespace-nowrap">
              <span className="text-[#bbb]">Saldo Simulasi</span>
              <span className="font-medium text-white">{fmtUsd(BALANCE)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
