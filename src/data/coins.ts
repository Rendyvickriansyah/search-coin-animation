export type CoinSymbol = 'BTC' | 'ETH' | 'BNB' | 'XRP' | 'SOL'

export type Coin = {
  id: string
  symbol: CoinSymbol
  /** Name shown in the trigger, e.g. "Bitcoin / BTC". */
  name: string
  /** Label shown in the Pair column. */
  pair: string
  price: number
  priceLabel: string
  change: number
  changeLabel: string
  maxLeverage: number
  favorite: boolean
}

// Placeholder rows taken from the Figma frame (it repeats BNB and XRP).
// Replace with the real market feed.
export const COINS: Coin[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', pair: 'BITCOIN', price: 73834.3, priceLabel: '73.834,3', change: 0.07, changeLabel: '+0,07%', maxLeverage: 25, favorite: true },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', pair: 'ETH', price: 2056.8, priceLabel: '2.056,80', change: -0.41, changeLabel: '−0,41%', maxLeverage: 25, favorite: true },
  { id: 'bnb', symbol: 'BNB', name: 'BNB', pair: 'BNB', price: 679.6, priceLabel: '679,60', change: -0.54, changeLabel: '−0,54%', maxLeverage: 20, favorite: true },
  { id: 'xrp', symbol: 'XRP', name: 'XRP', pair: 'XRP', price: 1.049, priceLabel: '1,0490', change: -1.24, changeLabel: '−1,24%', maxLeverage: 20, favorite: false },
  { id: 'sol', symbol: 'SOL', name: 'Solana', pair: 'SOL', price: 83.37, priceLabel: '83,37', change: -0.19, changeLabel: '−0,19%', maxLeverage: 20, favorite: false },
  { id: 'bnb-2', symbol: 'BNB', name: 'BNB', pair: 'BNB', price: 679.6, priceLabel: '679,60', change: -0.54, changeLabel: '−0,54%', maxLeverage: 20, favorite: false },
  { id: 'xrp-2', symbol: 'XRP', name: 'XRP', pair: 'XRP', price: 1.049, priceLabel: '1,0490', change: -1.24, changeLabel: '−1,24%', maxLeverage: 20, favorite: false },
  { id: 'sol-2', symbol: 'SOL', name: 'Solana', pair: 'SOL', price: 83.37, priceLabel: '83,37', change: -0.19, changeLabel: '−0,19%', maxLeverage: 20, favorite: false },
  { id: 'eth-2', symbol: 'ETH', name: 'Ethereum', pair: 'ETH', price: 2056.8, priceLabel: '2.056,80', change: -0.41, changeLabel: '−0,41%', maxLeverage: 25, favorite: false },
  { id: 'bnb-3', symbol: 'BNB', name: 'BNB', pair: 'BNB', price: 679.6, priceLabel: '679,60', change: -0.54, changeLabel: '−0,54%', maxLeverage: 20, favorite: false },
]
