import bell from '../assets/app/bell.svg'
import logoMark from '../assets/app/logo-mark.svg'
import logoText from '../assets/app/logo-text.svg'
import trophy from '../assets/app/trophy.svg'

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10">
      <div className="flex h-full w-[312px] shrink-0 items-center pr-6 pl-6 lg:pl-20">
        <span className="inline-grid" role="img" aria-label="TWS">
          <img alt="" src={logoMark} className="col-start-1 row-start-1 block" />
          <img alt="" src={logoText} className="col-start-1 row-start-1 mt-[5.31px] ml-[29.64px] block" />
        </span>
      </div>
      <div className="flex h-full shrink-0 items-center justify-end gap-4 pr-6 pl-6 lg:pr-[62px]">
        <button
          type="button"
          aria-label="Peringkat"
          className="flex size-10 items-center justify-center rounded-lg border border-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <img alt="" src={trophy} className="block" />
        </button>
        <button
          type="button"
          aria-label="Notifikasi, 2 belum dibaca"
          className="flex size-10 items-center justify-center rounded-lg border border-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <span className="relative flex size-6 items-center justify-center">
            <img alt="" src={bell} className="block" />
            <span className="absolute -top-[0.5px] -right-[0.5px] flex size-[11.5px] items-center justify-center rounded-full border-[0.8px] border-black bg-[#ef4444] text-[8px] leading-none font-medium text-white">
              2
            </span>
          </span>
        </button>
      </div>
    </header>
  )
}
