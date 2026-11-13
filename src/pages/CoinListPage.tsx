import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import arrowLeft from '../assets/app/arrow-left.svg'
import chevronDown from '../assets/app/chevron-down.svg'
import dot from '../assets/app/dot.svg'
import navExplore from '../assets/app/nav-explore.svg'
import navFeeds from '../assets/app/nav-feeds.svg'
import navLogout from '../assets/app/nav-logout.svg'
import navProfile from '../assets/app/nav-profile.svg'
import searchIcon from '../assets/app/search.svg'
import sortIcon from '../assets/app/sort.svg'
import triDown from '../assets/app/tri-down.svg'
import triUp from '../assets/app/tri-up.svg'
import { AppHeader } from '../components/AppHeader'
import { CoinIcon } from '../components/CoinIcon'
import { FlashValue } from '../components/FlashValue'
import { getQuote, useFeedSource, useQuote } from '../data/livePrices'
import { MARKET, type MarketCoin } from '../data/market'

type SortKey = 'price' | 'balanceLimit' | 'change' | 'minimum' | 'fundingHours'
type Sort = { key: SortKey; dir: 'asc' | 'desc' } | null

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'price', label: 'Harga market' },
  { key: 'balanceLimit', label: 'Batas saldo' },
  { key: 'change', label: 'Perubahan 24 jam' },
  { key: 'minimum', label: 'Minimum' },
  { key: 'fundingHours', label: 'Funding' },
]

const EASE_OUT = [0, 0, 0.58, 1] as const

// The whole table is one grid and each row is a subgrid of it, so the header
// and every row share the same column edges. Number columns never shrink below
// their widest content, header label included, so a long label can't spill past
// the column and push its arrow off the numbers' right edge.
const TABLE = 'grid grid-cols-[minmax(0,1.3fr)_repeat(5,minmax(max-content,1fr))]'
const ROW = 'col-span-full grid grid-cols-subgrid'

function usd(value: number, digits?: number) {
  const fraction = digits ?? (value >= 1 ? 2 : 4)
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: fraction, maximumFractionDigits: fraction })}`
}

function sortValue(coin: MarketCoin, key: SortKey) {
  if (key === 'price' || key === 'change') return getQuote(coin.symbol)[key]
  return coin[key]
}

export function CoinListPage({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const source = useFeedSource()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Sorted when the sort or search changes, not on every tick, so rows don't
  // jump around under the cursor while prices move.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? MARKET.filter((coin) => `${coin.symbol} ${coin.name}`.toLowerCase().includes(q))
      : MARKET
    if (!sort) return filtered
    const sign = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => (sortValue(a, sort.key) - sortValue(b, sort.key)) * sign)
  }, [query, sort])

  function toggleSort(key: SortKey) {
    setSort((current) => {
      if (current?.key !== key) return { key, dir: 'desc' }
      return current.dir === 'desc' ? { key, dir: 'asc' } : null
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-black font-sans">
      <AppHeader />

      <div className="flex flex-1 lg:pl-[52px]">
        <nav
          aria-label="Menu utama"
          className="hidden w-[212px] shrink-0 flex-col gap-1.5 border-r border-white/10 px-4 pt-6 pb-2 lg:flex"
        >
          <p className="px-3 font-mono text-[11px] leading-[1.4] tracking-[0.22px] text-[#8f8f8f] uppercase">
            General
          </p>
          <SidebarItem icon={navExplore} label="Explore" />
          <SidebarItem icon={navFeeds} label="Feeds" />
          <SidebarItem icon={navProfile} label="Profile" />
          <div className="py-2">
            <div className="h-px bg-white/10" />
          </div>
          <SidebarItem icon={navLogout} label="Logout" />
        </nav>

        <main className="flex min-w-0 flex-1 flex-col pb-8">
          <div className="px-6 pt-8 pb-4 lg:pr-[62px] lg:pl-10">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-3 text-base leading-[1.4] text-[#bbb] outline-none hover:text-white focus-visible:text-white"
            >
              <img alt="" src={arrowLeft} className="block" />
              Kembali
            </button>
          </div>

          <div className="px-6 lg:pr-[62px] lg:pl-10">
            <div className="max-w-[1100px]">
              <div className="flex items-center justify-between gap-6 pt-4 pb-6">
                <div className="flex max-w-[550px] flex-col gap-2">
                  <h1 className="flex items-center gap-2 leading-[1.4]">
                    <span className="text-xl font-medium text-white">Daftar Koin</span>
                    <img alt="" src={dot} className="block" />
                    <span className="text-lg text-[#bbb]">99+</span>
                  </h1>
                  <p className="text-base leading-[1.4] text-[#bbb]">
                    Temukan koin potensial yang sedang tren dan mulai bangun portofoliomu hari ini.
                  </p>
                </div>
                <div
                  className="flex shrink-0 items-center gap-2"
                  title={source === 'simulated' ? 'Harga simulasi' : undefined}
                >
                  <span className="live-ring relative block size-3 shrink-0">
                    {/* Concentric SVG circles: no CSS box snapping, so the bright dot stays centered at any DPR. */}
                    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden className="relative block">
                      <circle cx="6" cy="6" r="6" fill="#122d19" />
                      <circle className="live-dot" cx="6" cy="6" r="3" fill="#47bb64" />
                    </svg>
                  </span>
                  <span className="font-mono text-sm leading-[1.4] font-medium tracking-[0.84px] whitespace-nowrap text-white uppercase">
                    Live Price
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-[23px]">
                <div className="flex items-center justify-between gap-4">
                  <label className="flex h-10 w-[450px] max-w-full items-center gap-3 border border-white/10 bg-[#0a0a0a] py-2 pr-1 pl-2 focus-within:border-white/25">
                    <img alt="" src={searchIcon} className="block shrink-0" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Cari coin..."
                      aria-label="Cari coin"
                      autoComplete="off"
                      spellCheck={false}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm leading-[1.4] text-white outline-none placeholder:text-[#bbb]"
                    />
                    <kbd className="shrink-0 border border-white/10 bg-[#1a1a1a] p-2 font-sans text-[11px] leading-[11px] text-[#bbb]">
                      CTRL + K
                    </kbd>
                  </label>
                  <SortMenu sort={sort} onSelect={toggleSort} />
                </div>

                <div className="overflow-x-auto border border-white/10">
                  <div role="table" aria-label="Daftar koin" className={`${TABLE} min-w-[860px]`}>
                    <div role="row" className={`${ROW} border-b border-white/10 bg-[#0a0a0a]`}>
                      <div
                        role="columnheader"
                        className="flex items-center p-4 font-mono text-xs leading-[1.4] font-medium text-[#bbb] uppercase"
                      >
                        Coin
                      </div>
                      {COLUMNS.map((column) => (
                        <div
                          key={column.key}
                          role="columnheader"
                          aria-sort={
                            sort?.key === column.key
                              ? sort.dir === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                          }
                          className="flex min-w-0 justify-end"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSort(column.key)}
                            className={`flex items-center gap-2 p-4 font-mono text-xs leading-[1.4] font-medium whitespace-nowrap uppercase outline-none hover:text-white focus-visible:text-white ${
                              sort?.key === column.key ? 'text-white' : 'text-[#bbb]'
                            }`}
                          >
                            {column.label}
                            <img alt="" src={sortIcon} className="block shrink-0" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {rows.length === 0 ? (
                      <p className="col-span-full p-4 text-sm text-[#bbb]">Coin tidak ditemukan</p>
                    ) : (
                      rows.map((coin) => <CoinRow key={coin.symbol} coin={coin} />)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarItem({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 px-3 py-2 text-left font-geist text-sm leading-[1.4] tracking-[-0.14px] text-[#737373] outline-none hover:text-white focus-visible:text-white"
    >
      <img alt="" src={icon} className="block shrink-0" />
      {label}
    </button>
  )
}

const CELL = 'flex min-w-0 items-center justify-end p-4 text-right tabular-nums font-mono text-sm leading-[1.4] font-medium whitespace-nowrap text-white'

/** Subscribes to its own coin so a price tick re-renders this row only. */
function CoinRow({ coin }: { coin: MarketCoin }) {
  const quote = useQuote(coin.symbol)
  const up = quote.change >= 0
  const changeLabel = `(${up ? '+' : '-'}${Math.abs(quote.change).toFixed(2).replace('.', ',')}%)`

  return (
    <div role="row" className={`${ROW} border-b border-white/10 last:border-b-0`}>
      <div role="cell" className="flex min-w-0 items-center gap-4 p-4">
        <CoinIcon symbol={coin.symbol} size={28} />
        <span className="flex items-center gap-2 text-sm leading-[1.4] whitespace-nowrap">
          <span className="font-medium text-white">{coin.symbol}</span>
          <span className="text-[#bbb]">{coin.name}</span>
        </span>
      </div>
      <div role="cell" className={CELL}>
        <FlashValue value={quote.live ? quote.price : null}>{usd(quote.price)}</FlashValue>
      </div>
      <div role="cell" className={CELL}>
        {usd(coin.balanceLimit, 0)}
      </div>
      <div role="cell" className={CELL}>
        <FlashValue
          value={quote.live ? Number(quote.change.toFixed(2)) : null}
          className={`-mr-[0.28px] items-center gap-1.5 tracking-[0.28px] ${up ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}
        >
          <img alt="" src={up ? triUp : triDown} className={`block ${up ? '' : '-scale-y-100'}`} />
          {changeLabel}
        </FlashValue>
      </div>
      <div role="cell" className={CELL}>
        {usd(coin.minimum, 2)}
      </div>
      <div role="cell" className={CELL}>
        {coin.fundingHours} Jam
      </div>
    </div>
  )
}

function SortMenu({ sort, onSelect }: { sort: Sort; onSelect: (key: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 border border-white/10 bg-gradient-to-b from-[#1c1c1c] to-[#121111] py-2 pr-[13px] pl-4 text-xs leading-[1.4] font-medium whitespace-nowrap text-white shadow-[0_0_0_1px_#131313] outline-none transition-[scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.97]"
      >
        Urut Berdasarkan
        <img alt="" src={chevronDown} className="block shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: EASE_OUT } }}
            className="absolute top-12 right-0 z-10 w-52 origin-top-right border border-white/10 bg-[#0d0d0d] p-1"
          >
            {COLUMNS.map((column) => {
              const active = sort?.key === column.key
              return (
                <button
                  key={column.key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => onSelect(column.key)}
                  className={`flex h-9 w-full items-center justify-between px-3 text-left text-xs outline-none hover:bg-white/5 focus-visible:bg-white/10 ${
                    active ? 'text-white' : 'text-[#bbb]'
                  }`}
                >
                  {column.label}
                  {active && (
                    <span className="font-mono text-[11px] text-[#bbb]">
                      {sort.dir === 'desc' ? 'Tertinggi' : 'Terendah'}
                    </span>
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
