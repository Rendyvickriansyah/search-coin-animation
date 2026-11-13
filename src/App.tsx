import { useEffect, useState } from 'react'
import { TabBar, type Tab } from './components/TabBar'
import { CoinListPage } from './pages/CoinListPage'
import { TradePage } from './pages/TradePage'

type PageId = 'pilih-coin' | 'daftar-koin'

const TABS: Tab<PageId>[] = [
  { id: 'pilih-coin', label: 'Pilih Coin' },
  { id: 'daftar-koin', label: 'Daftar Koin' },
]

function pageFromHash(): PageId {
  const id = location.hash.slice(1)
  return TABS.some((tab) => tab.id === id) ? (id as PageId) : 'pilih-coin'
}

export default function App() {
  const [page, setPage] = useState(pageFromHash)

  // The hash is the source of truth, so reload and back/forward keep the page.
  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function go(id: PageId) {
    location.hash = id
  }

  return (
    <div className="relative">
      {/* Scrolls away with the header instead of floating over the page. */}
      <div className="absolute top-3 left-1/2 z-50 -translate-x-1/2 font-sans">
        <TabBar tabs={TABS} active={page} onChange={go} />
      </div>

      {page === 'pilih-coin' ? (
        <TradePage onBack={() => go('daftar-koin')} />
      ) : (
        <CoinListPage onBack={() => go('pilih-coin')} />
      )}
    </div>
  )
}
