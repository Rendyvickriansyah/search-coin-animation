export type CoinSymbol = 'BTC' | 'ETH' | 'BNB' | 'XRP' | 'SOL' | 'LTC' | 'DOT' | 'ADA'

export type Coin = {
  id: string
  symbol: CoinSymbol
  /** Name shown in the trigger, e.g. "Bitcoin / BTC". */
  name: string
  /** Label shown in the Pair column. */
  pair: string
  /** Highest leverage the exchange offers for this pair. */
  maxLeverage: number
  favorite: boolean
}

// Price and 24h change are not stored here: they come from the live feed
// (data/livePrices.ts) so every screen shows the same number.
export const COINS: Coin[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', pair: 'BITCOIN', maxLeverage: 25, favorite: true },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', pair: 'ETH', maxLeverage: 25, favorite: true },
  { id: 'bnb', symbol: 'BNB', name: 'BNB', pair: 'BNB', maxLeverage: 20, favorite: true },
  { id: 'xrp', symbol: 'XRP', name: 'XRP', pair: 'XRP', maxLeverage: 20, favorite: false },
  { id: 'sol', symbol: 'SOL', name: 'Solana', pair: 'SOL', maxLeverage: 20, favorite: false },
  { id: 'ltc', symbol: 'LTC', name: 'Litecoin', pair: 'LTC', maxLeverage: 20, favorite: false },
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', pair: 'DOT', maxLeverage: 20, favorite: false },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', pair: 'ADA', maxLeverage: 20, favorite: false },
]
