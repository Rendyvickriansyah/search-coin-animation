import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import chevronDown from '../assets/coin/chevron-down.svg'
import chevronUp from '../assets/coin/chevron-up.svg'
import searchIcon from '../assets/coin/search.svg'
import sortIcon from '../assets/coin/sort.svg'
import starFill from '../assets/coin/star-fill.svg'
import starLine from '../assets/coin/star-line.svg'
import { COINS, type Coin } from '../data/coins'
import { getQuote, useQuote } from '../data/livePrices'
import { fmtPrice, fmtSignedPct } from '../lib/format'
import { CoinIcon } from './CoinIcon'
import { FlashValue } from './FlashValue'

// Chevron swap: bounce-free spring.
const SPRING = { type: 'spring', duration: 0.35, bounce: 0 } as const

// Panel: fade + scale from the trigger's corner. Decided from the /proto/coin-dropdown
// exploration. Rejected: layoutId morph (distorts the rows, ~420ms, main thread),
// slide (loses the link to the trigger), clip-path reveal (paints every frame).
const EASE_OUT = [0, 0, 0.58, 1] as const
const PANEL_HIDDEN = { opacity: 0, scale: 0.95 }
const PANEL_ENTER = { duration: 0.2, ease: EASE_OUT }
const PANEL_EXIT = { duration: 0.15, ease: EASE_OUT }

type SortKey = 'price' | 'change' | 'maxLeverage'
type Sort = { key: SortKey; dir: 'asc' | 'desc' } | null

const COLUMNS: { key: SortKey; label: string; width: string }[] = [
  { key: 'price', label: 'Harga', width: 'w-[100px]' },
  { key: 'change', label: '24 jam', width: 'w-[90px]' },
  { key: 'maxLeverage', label: 'Maks', width: 'w-[90px]' },
]

export function CoinSelector({
  value,
  onChange,
}: {
  /** Id of the selected coin. */
  value: string
  onChange: (coin: Coin) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedId = value
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>(null)
  const [favorites, setFavorites] = useState(
    () => new Set(COINS.filter((c) => c.favorite).map((c) => c.id)),
  )

  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = COINS.find((c) => c.id === selectedId) ?? COINS[0]

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? COINS.filter((c) => `${c.name} ${c.pair} ${c.symbol}`.toLowerCase().includes(q))
      : COINS
    if (!sort) return filtered
    const sign = sort.dir === 'asc' ? 1 : -1
    const read = (coin: Coin) =>
      sort.key === 'maxLeverage' ? coin.maxLeverage : getQuote(coin.symbol)[sort.key]
    return [...filtered].sort((a, b) => (read(a) - read(b)) * sign)
  }, [query, sort])

  function close(returnFocus = false) {
    setOpen(false)
    setQuery('')
    if (returnFocus) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    // Typing right away is the point on desktop; on touch it would pop the keyboard.
    if (window.matchMedia('(pointer: fine)').matches) {
      searchRef.current?.focus({ preventScroll: true })
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close(true)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function toggleSort(key: SortKey) {
    setSort((current) => {
      if (current?.key !== key) return { key, dir: 'desc' }
      return current.dir === 'desc' ? { key, dir: 'asc' } : null
    })
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  function select(coin: Coin) {
    onChange(coin)
    close(true)
  }

  return (
    <MotionConfig transition={SPRING} reducedMotion="user">
      <div ref={rootRef} className="relative inline-block">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => (open ? close() : setOpen(true))}
          className="relative z-20 flex items-center gap-2 rounded-full border border-white/10 bg-[#0c0c0c] p-2 outline-none transition-[scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.97]"
        >
          <span className="flex items-center gap-2">
            <CoinIcon symbol={selected.symbol} size={20} />
            <span className="flex items-center gap-2 text-sm leading-[1.4] whitespace-nowrap">
              <span className="font-medium text-white">{selected.name}</span>
              <span className="text-white">/</span>
              <span className="text-[#bbb]">{selected.symbol}</span>
            </span>
          </span>
          <span aria-hidden className="relative size-5 shrink-0">
            <ChevronSwap visible={!open} src={chevronDown} />
            <ChevronSwap visible={open} src={chevronUp} />
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={PANEL_HIDDEN}
              animate={{ opacity: 1, scale: 1, transition: PANEL_ENTER }}
              exit={{ ...PANEL_HIDDEN, transition: PANEL_EXIT }}
              id={panelId}
              role="dialog"
              aria-label="Pilih coin"
              className="absolute top-[50px] left-0 z-10 flex h-[398px] w-[500px] origin-top-left flex-col overflow-hidden border border-white/10 bg-[#0d0d0d] p-1"
              style={{ borderRadius: 24 }}
            >
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#131313] shadow-[0_1.66px_1.66px_rgba(0,0,0,0.08)]">
                <div className="pt-4 pr-4 pb-2 pl-3">
                  <label className="flex h-10 items-center gap-2.5 rounded-xl border-[0.8px] border-white/10 bg-[#0f0f0f] px-2 focus-within:border-white/25">
                    <img alt="" src={searchIcon} className="block size-3.5 shrink-0" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Cari Coin"
                      aria-label="Cari coin"
                      autoComplete="off"
                      spellCheck={false}
                      className="h-full min-w-0 flex-1 bg-transparent text-xs leading-[1.4] font-medium text-white outline-none placeholder:text-[#bbb]"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between pr-[19px] text-xs leading-[1.4] text-[#bbb]">
                  <div className="flex h-10 flex-1 items-center pr-3 pl-5">Pair</div>
                  <div className="flex items-center">
                    {COLUMNS.map((column) => (
                      <button
                        key={column.key}
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        aria-label={`Urutkan berdasarkan ${column.label}`}
                        className={`flex h-10 items-center justify-end gap-2.5 px-3 outline-none hover:text-white focus-visible:text-white ${column.width} ${sort?.key === column.key ? 'text-white' : ''}`}
                      >
                        {column.label}
                        <img alt="" src={sortIcon} className="block size-3 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="coin-scroll mr-1.5 min-h-0 flex-1 overflow-y-scroll">
                  {rows.length === 0 ? (
                    <p className="px-5 py-6 text-xs text-[#bbb]">Coin tidak ditemukan</p>
                  ) : (
                    <ul className="mr-2">
                      {rows.map((coin) => (
                        <CoinRow
                          key={coin.id}
                          coin={coin}
                          selected={coin.id === selectedId}
                          favorite={favorites.has(coin.id)}
                          onFavorite={() => toggleFavorite(coin.id)}
                          onSelect={() => select(coin)}
                        />
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.12),inset_0px_-1.66px_1.66px_0px_rgba(0,0,0,0.12)]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}

/** Both chevrons stay mounted and cross-fade, so the swap animates both ways. */
function ChevronSwap({ visible, src }: { visible: boolean; src: string }) {
  return (
    <motion.img
      alt=""
      src={src}
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.3,
        filter: visible ? 'blur(0px)' : 'blur(3px)',
      }}
      className="absolute inset-0 block size-5"
    />
  )
}

/** Subscribes to its own coin, so a tick re-renders this row only. */
function CoinRow({
  coin,
  selected,
  favorite,
  onFavorite,
  onSelect,
}: {
  coin: Coin
  selected: boolean
  favorite: boolean
  onFavorite: () => void
  onSelect: () => void
}) {
  const quote = useQuote(coin.symbol)
  const up = quote.change >= 0

  return (
    <li
      className={`flex h-10 items-center border-y text-xs leading-[1.4] hover:bg-white/5 ${selected ? 'border-white/5 bg-white/5' : 'border-transparent'}`}
    >
      <button
        type="button"
        onClick={onFavorite}
        aria-pressed={favorite}
        aria-label={`Favoritkan ${coin.name}`}
        className="flex h-full shrink-0 items-center pr-3 pl-5 outline-none focus-visible:bg-white/10"
      >
        <img alt="" src={favorite ? starFill : starLine} className="block size-3" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected}
        className="flex h-full min-w-0 flex-1 items-center justify-between text-left outline-none focus-visible:bg-white/10"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <CoinIcon symbol={coin.symbol} />
          <span className="font-medium whitespace-nowrap text-white">{coin.pair}</span>
        </span>
        <span className="flex items-center text-right whitespace-nowrap text-white tabular-nums">
          <span className="flex w-[100px] justify-end px-3">
            <FlashValue value={quote.live ? quote.price : null}>{fmtPrice(quote.price)}</FlashValue>
          </span>
          <span className={`w-[90px] px-3 ${up ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {fmtSignedPct(quote.change, 2).replace('-', '−')}
          </span>
          <span className="w-[90px] px-3">{coin.maxLeverage}x</span>
        </span>
      </button>
    </li>
  )
}
