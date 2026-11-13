import ada from '../assets/app/ada.svg'
import dot from '../assets/app/dot-coin.svg'
import ltc from '../assets/app/ltc.svg'
import bnb from '../assets/coin/bnb.svg'
import btcMask from '../assets/coin/btc-mask.svg'
import btc from '../assets/coin/btc.svg'
import eth from '../assets/coin/eth.svg'
import sol from '../assets/coin/sol.svg'
import xrp from '../assets/coin/xrp.png'
import type { CoinSymbol } from '../data/coins'

const RING = 'relative size-4 shrink-0 overflow-clip rounded-full border border-white/10'

function Glyph({ symbol }: { symbol: CoinSymbol }) {
  switch (symbol) {
    case 'BTC':
      return (
        <span className={RING}>
          <span
            className="absolute inset-0 mask-alpha mask-no-repeat mask-size-[16px_16px]"
            style={{ maskImage: `url("${btcMask}")` }}
          >
            <span className="absolute inset-[-8.3%_-16.6%_-24.9%_-16.6%]">
              <img alt="" src={btc} className="block size-full max-w-none" />
            </span>
          </span>
        </span>
      )
    case 'ETH':
      return (
        <span className={`${RING} bg-white`}>
          <span className="absolute inset-[calc(16.84%-0.66px)_calc(28.89%-0.42px)_calc(18.75%-0.63px)_calc(31.55%-0.37px)]">
            <img alt="" src={eth} className="absolute inset-0 block size-full max-w-none" />
          </span>
        </span>
      )
    case 'BNB':
      return (
        <span className={`${RING} bg-[rgb(186,132,0)]`}>
          <span className="absolute inset-[calc(17.41%-0.65px)_calc(17.12%-0.66px)_calc(17.56%-0.65px)_calc(17.85%-0.64px)]">
            <img alt="" src={bnb} className="absolute inset-0 block size-full max-w-none" />
          </span>
        </span>
      )
    case 'XRP':
      return (
        <span className={`${RING} bg-black`}>
          <span className="absolute top-[calc(50%+0.34px)] left-[calc(50%-0.07px)] h-[8.683px] w-[10.155px] -translate-x-1/2 -translate-y-1/2">
            <img alt="" src={xrp} className="absolute inset-0 size-full max-w-none object-cover" />
          </span>
        </span>
      )
    case 'SOL':
      return (
        <span className={`${RING} bg-black`}>
          <span className="absolute inset-[calc(35.26%-0.29px)_calc(28.13%-0.44px)_calc(35.06%-0.3px)_calc(25%-0.5px)]">
            <img alt="" src={sol} className="absolute inset-0 block size-full max-w-none" />
          </span>
        </span>
      )
    case 'LTC':
      return <img alt="" src={ltc} className="block size-4 shrink-0" />
    case 'DOT':
      return (
        <span className={`${RING} bg-[#fe266f]`}>
          <span className="absolute inset-[calc(21.43%-0.46px)_calc(24.93%-0.4px)_calc(24.75%-0.41px)_calc(25%-0.4px)]">
            <img alt="" src={dot} className="absolute inset-0 block size-full max-w-none" />
          </span>
        </span>
      )
    case 'ADA':
      return (
        <span className={`${RING} bg-white`}>
          <span className="absolute inset-[calc(15.57%-0.55px)_calc(10.72%-0.63px)_calc(15.12%-0.56px)_calc(14.19%-0.57px)]">
            <img alt="" src={ada} className="absolute inset-0 block size-full max-w-none" />
          </span>
        </span>
      )
  }
}

/** Coin logo drawn at the design's 16px and scaled to `size`. */
export function CoinIcon({ symbol, size = 16 }: { symbol: CoinSymbol; size?: number }) {
  return (
    <span aria-hidden className="relative block shrink-0" style={{ width: size, height: size }}>
      <span className="absolute top-0 left-0 flex origin-top-left" style={{ scale: size / 16 }}>
        <Glyph symbol={symbol} />
      </span>
    </span>
  )
}
