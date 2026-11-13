import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import addIcon from '../assets/trade/add.svg'
import alertIcon from '../assets/trade/alert.svg'
import cameraIcon from '../assets/trade/camera.svg'
import fullscreenIcon from '../assets/trade/fullscreen.svg'
import redoIcon from '../assets/trade/redo.svg'
import toolBrush from '../assets/trade/tool-brush.svg'
import toolCrosshair from '../assets/trade/tool-crosshair.svg'
import toolEye from '../assets/trade/tool-eye.svg'
import toolFib from '../assets/trade/tool-fib.svg'
import toolHline from '../assets/trade/tool-hline.svg'
import toolLock from '../assets/trade/tool-lock.svg'
import toolMagnet from '../assets/trade/tool-magnet.svg'
import toolMeasure from '../assets/trade/tool-measure.svg'
import toolPosition from '../assets/trade/tool-position.svg'
import toolText from '../assets/trade/tool-text.svg'
import toolTrash from '../assets/trade/tool-trash.svg'
import toolTrend from '../assets/trade/tool-trend.svg'
import toolZoom from '../assets/trade/tool-zoom.svg'
import undoIcon from '../assets/trade/undo.svg'
import watermark from '../assets/trade/watermark.png'
import type { CoinSymbol } from '../data/coins'
import { TIMEFRAMES, niceStep, type Timeframe } from '../data/trade'
import { useCandles } from '../data/useCandles'
import { CoinIcon } from './CoinIcon'

const UP = '#0d76f2'
const DOWN = '#db5700'
const TP_COLOR = '#4ade80'
const SL_COLOR = '#ef4444'

const AXIS_W = 62
const PAD_TOP = 14
const PAD_BOTTOM = 34
const PAD_LEFT = 12

const TOOLS = [
  { id: 'crosshair', label: 'Crosshair', icon: toolCrosshair },
  { id: 'trend', label: 'Trend line', icon: toolTrend },
  { id: 'hline', label: 'Garis horizontal', icon: toolHline },
  { id: 'fib', label: 'Fib retracement', icon: toolFib },
  { id: 'position', label: 'Long / Short position', icon: toolPosition },
  { id: 'brush', label: 'Brush', icon: toolBrush },
  { id: 'text', label: 'Teks', icon: toolText },
  { id: 'measure', label: 'Ukur', icon: toolMeasure },
  { id: 'zoom', label: 'Zoom', icon: toolZoom },
  { id: 'magnet', label: 'Magnet', icon: toolMagnet },
  { id: 'lock', label: 'Kunci gambar', icon: toolLock },
  { id: 'eye', label: 'Sembunyikan gambar', icon: toolEye },
  { id: 'trash', label: 'Hapus gambar', icon: toolTrash },
] as const

type Drag = 'tp' | 'sl' | null
type Range = { lo: number; hi: number }

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}

function tickLabel(value: number, step: number) {
  const decimals = step >= 1 ? 0 : Math.min(6, Math.ceil(-Math.log10(step)))
  return value.toFixed(decimals)
}

function timeLabel(time: number, timeframe: Timeframe) {
  const date = new Date(time)
  if (timeframe === '1W') return `${date.getDate()}/${date.getMonth() + 1}`
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function PriceChart({
  symbol,
  price,
  timeframe,
  onTimeframe,
  entry,
  entryLabel,
  tp,
  sl,
  tpLabel,
  slLabel,
  onTpChange,
  onSlChange,
}: {
  symbol: CoinSymbol
  price: number
  timeframe: Timeframe
  onTimeframe: (timeframe: Timeframe) => void
  entry: number
  entryLabel: string
  tp: number | null
  sl: number | null
  tpLabel: string
  slLabel: string
  onTpChange: (price: number) => void
  onSlChange: (price: number) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [plotRef, size] = useSize<HTMLDivElement>()
  const [tool, setTool] = useState<(typeof TOOLS)[number]['id']>('crosshair')
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const [drag, setDrag] = useState<Drag>(null)
  const [frozen, setFrozen] = useState<Range | null>(null)

  const candles = useCandles(symbol, timeframe, price)

  const { w, h } = size
  const plotW = Math.max(0, w - AXIS_W - PAD_LEFT)
  const plotH = Math.max(0, h - PAD_TOP - PAD_BOTTOM)
  const overlay = tp !== null || sl !== null

  const range = useMemo<Range>(() => {
    let lo = Infinity
    let hi = -Infinity
    for (const c of candles) {
      lo = Math.min(lo, c.low)
      hi = Math.max(hi, c.high)
    }
    if (overlay) {
      for (const v of [entry, tp, sl]) {
        if (v === null) continue
        lo = Math.min(lo, v)
        hi = Math.max(hi, v)
      }
    }
    const pad = (hi - lo) * 0.06
    return { lo: lo - pad, hi: hi + pad }
  }, [candles, overlay, entry, tp, sl])

  const active = frozen ?? range
  const step = niceStep((active.hi - active.lo) / 10)
  const ticks: number[] = []
  for (let v = Math.ceil(active.lo / step) * step; v <= active.hi; v += step) ticks.push(v)

  const y = (v: number) => PAD_TOP + ((active.hi - v) / (active.hi - active.lo)) * plotH
  const valueAt = (py: number) => active.hi - ((py - PAD_TOP) / plotH) * (active.hi - active.lo)

  const n = candles.length
  const slot = plotW / (n + 4)
  const cx = (i: number) => PAD_LEFT + slot * (i + 0.5)
  const bodyW = Math.min(14, Math.max(2, slot * 0.62))
  const labelEvery = Math.max(1, Math.ceil(72 / Math.max(slot, 1)))
  const plotRight = w - AXIS_W

  function pointerY(event: React.PointerEvent) {
    const rect = plotRef.current!.getBoundingClientRect()
    return event.clientY - rect.top
  }

  function roundPrice(v: number) {
    const digits = v >= 10 ? 2 : 4
    return Number(v.toFixed(digits))
  }

  function startDrag(kind: 'tp' | 'sl', event: React.PointerEvent) {
    try {
      // Keeps move events coming even when the pointer leaves the thin hit area.
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Capture is only an enhancement; dragging still works without it.
    }
    setDrag(kind)
    setFrozen(range)
  }

  function moveDrag(kind: 'tp' | 'sl', event: React.PointerEvent) {
    if (drag !== kind) return
    const v = Math.min(active.hi, Math.max(active.lo, valueAt(pointerY(event))))
    ;(kind === 'tp' ? onTpChange : onSlChange)(roundPrice(v))
  }

  function endDrag() {
    setDrag(null)
    setFrozen(null)
  }

  const tagY = (v: number) => y(v)
  const boxWidth = (text: string) => 12 + text.length * 6.4

  // A plain function, not a component: a component defined here would be a new
  // type on every render, remounting the line and dropping the drag.
  function level({
    kind,
    value,
    color,
    label,
    tag,
  }: {
    kind: 'tp' | 'sl' | 'entry'
    value: number
    color: string
    label: string
    tag: string
  }) {
    const ly = y(value)
    const draggable = kind !== 'entry'
    return (
      <g key={kind}>
        <line
          x1={PAD_LEFT}
          x2={plotRight}
          y1={ly}
          y2={ly}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        {draggable && (
          <rect
            x={PAD_LEFT}
            y={ly - 8}
            width={plotRight - PAD_LEFT}
            height={16}
            fill="transparent"
            className="cursor-ns-resize"
            style={{ touchAction: 'none' }}
            onPointerDown={(event) => startDrag(kind, event)}
            onPointerMove={(event) => moveDrag(kind, event)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        )}
        <g transform={`translate(${PAD_LEFT + 10} ${ly - 11})`} pointerEvents="none">
          <rect
            width={boxWidth(label)}
            height={22}
            fill="#0d0d0d"
            stroke={color}
            strokeOpacity={0.5}
          />
          <text x={6} y={15} className="text-xs" fill={color}>
            {label}
          </text>
        </g>
        <g pointerEvents="none">
          <rect x={plotRight + 2} y={tagY(value) - 9} width={AXIS_W - 4} height={18} fill={color} />
          <text
            x={plotRight + AXIS_W / 2}
            y={tagY(value) + 4}
            textAnchor="middle"
            className="text-xs font-medium"
            fill={kind === 'sl' ? '#fff' : '#000'}
          >
            {tag}
          </text>
        </g>
      </g>
    )
  }

  const bandStart = cx(Math.max(0, n - 12))

  return (
    <div ref={rootRef} className="flex h-[568px] flex-col border border-white/10 bg-black">
      <div className="flex h-[39px] shrink-0 items-center gap-2 overflow-x-auto border-b border-white/10 px-1.5 py-1 [scrollbar-width:none]">
        <button
          type="button"
          className="flex min-h-[30px] shrink-0 items-center gap-[5px] rounded-sm py-[5px] pr-1.5 pl-0.5 text-xs leading-[1.4] font-medium text-white outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <CoinIcon symbol={symbol} size={20} />
          {symbol}USDT
        </button>
        <Divider />
        <div role="radiogroup" aria-label="Rentang waktu" className="flex shrink-0 gap-0.5">
          {TIMEFRAMES.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={option === timeframe}
              onClick={() => onTimeframe(option)}
              className={`h-[30px] rounded-sm px-2 text-xs leading-[1.4] outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/40 ${
                option === timeframe ? 'bg-white/10 text-white' : 'text-[#bbb] hover:bg-white/5 hover:text-white'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <Divider />
        <div className="flex shrink-0 gap-0.5">
          <ToolbarButton label="Tipe chart: candle">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#bbb" aria-hidden>
              <rect x="2.5" y="4" width="3" height="7" rx=".4" />
              <rect x="3.75" y="2" width="0.5" height="12" />
              <rect x="10.5" y="3" width="3" height="8" rx=".4" />
              <rect x="11.75" y="1.5" width="0.5" height="13" />
            </svg>
          </ToolbarButton>
          <ToolbarButton label="Bandingkan" text="Bandingkan" icon={addIcon} />
          <ToolbarButton label="Alert" text="Alert" icon={alertIcon} />
        </div>
        <Divider />
        <div className="flex shrink-0 gap-0.5">
          <ToolbarButton label="Urungkan" icon={undoIcon} />
          <ToolbarButton label="Ulangi" icon={redoIcon} />
          <ToolbarButton label="Ambil gambar" icon={cameraIcon} />
          <ToolbarButton
            label="Layar penuh"
            icon={fullscreenIcon}
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen()
              else void rootRef.current?.requestFullscreen?.()
            }}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-[45px] shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-white/10 px-1.5 py-2.5 [scrollbar-width:none]">
          {TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-pressed={tool === item.id}
              title={item.label}
              onClick={() => setTool(item.id)}
              className={`flex h-[30px] w-8 shrink-0 items-center justify-center rounded-sm outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/40 ${
                tool === item.id ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <img alt="" src={item.icon} className="block size-[17px]" />
            </button>
          ))}
        </div>

        <div ref={plotRef} className="relative min-w-0 flex-1 overflow-hidden">
          <img
            alt=""
            src={watermark}
            className="pointer-events-none absolute top-1/2 left-1/2 h-[110px] w-[296px] -translate-x-1/2 -translate-y-1/2 object-cover opacity-5"
          />
          {w > 0 && h > 0 && (
            <svg
              width={w}
              height={h}
              role="img"
              aria-label={`Grafik harga ${symbol}/USDT`}
              className="absolute inset-0 select-none"
              onPointerMove={(event) => {
                if (drag || tool !== 'crosshair') return
                const rect = plotRef.current!.getBoundingClientRect()
                const px = event.clientX - rect.left
                const py = event.clientY - rect.top
                setHover(px < plotRight && py > PAD_TOP && py < h - PAD_BOTTOM ? { x: px, y: py } : null)
              }}
              onPointerLeave={() => setHover(null)}
            >
              {ticks.map((tick) => (
                <text
                  key={tick}
                  x={w - 8}
                  y={y(tick) + 4}
                  textAnchor="end"
                  className="fill-[#bbb] text-xs"
                >
                  {tickLabel(tick, step)}
                </text>
              ))}

              {candles.map((c, i) => {
                const up = c.close >= c.open
                const color = up ? UP : DOWN
                const top = y(Math.max(c.open, c.close))
                const bottom = y(Math.min(c.open, c.close))
                return (
                  <g key={c.time}>
                    <line x1={cx(i)} x2={cx(i)} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} />
                    <rect
                      x={cx(i) - bodyW / 2}
                      y={top}
                      width={bodyW}
                      height={Math.max(1, bottom - top)}
                      fill={color}
                    />
                  </g>
                )
              })}

              {candles.map((c, i) =>
                (n - 1 - i) % labelEvery === 0 ? (
                  <text
                    key={`t${c.time}`}
                    x={cx(i)}
                    y={h - 12}
                    textAnchor="middle"
                    className="fill-[#bbb] text-xs"
                  >
                    {timeLabel(c.time, timeframe)}
                  </text>
                ) : null,
              )}

              {overlay && (
                <g>
                  {tp !== null && (
                    <rect
                      x={bandStart}
                      width={plotRight - bandStart}
                      y={Math.min(y(entry), y(tp))}
                      height={Math.abs(y(tp) - y(entry))}
                      fill={TP_COLOR}
                      fillOpacity={0.12}
                      pointerEvents="none"
                    />
                  )}
                  {sl !== null && (
                    <rect
                      x={bandStart}
                      width={plotRight - bandStart}
                      y={Math.min(y(entry), y(sl))}
                      height={Math.abs(y(sl) - y(entry))}
                      fill={SL_COLOR}
                      fillOpacity={0.12}
                      pointerEvents="none"
                    />
                  )}
                  {level({ kind: "entry", value: entry, color: "#ffffff", label: `Entry  ${entryLabel}`, tag: tickLabel(entry, step) })}
                  {tp !== null && level({ kind: "tp", value: tp, color: TP_COLOR, label: tpLabel, tag: tickLabel(tp, step) })}
                  {sl !== null && level({ kind: "sl", value: sl, color: SL_COLOR, label: slLabel, tag: tickLabel(sl, step) })}
                </g>
              )}

              {hover && !drag && (
                <g pointerEvents="none">
                  <line x1={PAD_LEFT} x2={plotRight} y1={hover.y} y2={hover.y} stroke="#fff" strokeOpacity={0.35} strokeDasharray="3 3" />
                  <line x1={hover.x} x2={hover.x} y1={PAD_TOP} y2={h - PAD_BOTTOM} stroke="#fff" strokeOpacity={0.35} strokeDasharray="3 3" />
                  <rect x={plotRight + 2} y={hover.y - 9} width={AXIS_W - 4} height={18} fill="#2a2a2a" />
                  <text x={plotRight + AXIS_W / 2} y={hover.y + 4} textAnchor="middle" className="text-xs" fill="#fff">
                    {tickLabel(valueAt(hover.y), step)}
                  </text>
                </g>
              )}
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}

function Divider() {
  return (
    <span aria-hidden className="mx-1 h-[18px] w-px shrink-0 bg-white/10" />
  )
}

function ToolbarButton({
  label,
  text,
  icon,
  children,
  onClick,
}: {
  label: string
  text?: string
  icon?: string
  children?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex min-h-[30px] shrink-0 items-center gap-[5px] rounded-sm px-2 py-[5px] text-xs leading-[1.4] text-[#bbb] outline-none transition-colors duration-150 ease-out hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/40"
    >
      {icon && <img alt="" src={icon} className="block size-4" />}
      {children}
      {text}
    </button>
  )
}
