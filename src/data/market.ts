import type { CoinSymbol } from './coins'

export type MarketCoin = {
  symbol: CoinSymbol
  name: string
  /** Balance limit in USD. */
  balanceLimit: number
  /** Minimum order in USD. */
  minimum: number
  /** Funding interval in hours. */
  fundingHours: number
}

// Price and 24h change come from the live feed. The other columns are the
// placeholder values from the Figma frame.
export const MARKET: MarketCoin[] = [
  { symbol: 'BTC', name: 'Bitcoin', balanceLimit: 5000, minimum: 7.8, fundingHours: 8 },
  { symbol: 'ETH', name: 'Ethereum', balanceLimit: 3500, minimum: 0.15, fundingHours: 12 },
  { symbol: 'LTC', name: 'Litecoin', balanceLimit: 800, minimum: 0.5, fundingHours: 10 },
  { symbol: 'XRP', name: 'Ripple', balanceLimit: 1200, minimum: 0.02, fundingHours: 6 },
  { symbol: 'DOT', name: 'Polkadot', balanceLimit: 1500, minimum: 0.08, fundingHours: 7 },
  { symbol: 'ADA', name: 'Cardano', balanceLimit: 2000, minimum: 0.1, fundingHours: 9 },
  { symbol: 'SOL', name: 'Solana', balanceLimit: 1800, minimum: 0.12, fundingHours: 11 },
  { symbol: 'BNB', name: 'Binance', balanceLimit: 1800, minimum: 0.12, fundingHours: 11 },
]
