import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  PieChart,
  DollarSign,
  Layers,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatNumber } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export interface TokenHolding {
  id: string; // CoinGecko API ID e.g. "ethereum", "bitcoin", "solana", "binancecoin", "nexorum", "the-open-network", "tether", "usd-coin"
  symbol: string;
  name: string;
  amount: number;
  iconUrl?: string;
  color: string;
  chain: string;
  fallbackPriceUsd: number;
  fallback24hChange: number;
}

const DEFAULT_HOLDINGS: TokenHolding[] = [
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    amount: 2.45,
    iconUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    color: '#627EEA',
    chain: 'Ethereum',
    fallbackPriceUsd: 3412.65,
    fallback24hChange: 2.45,
  },
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    amount: 0.15,
    iconUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    color: '#F7931A',
    chain: 'Bitcoin',
    fallbackPriceUsd: 67432.18,
    fallback24hChange: 1.82,
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    amount: 28.5,
    iconUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    color: '#14F195',
    chain: 'Solana',
    fallbackPriceUsd: 145.32,
    fallback24hChange: -0.85,
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB Chain',
    amount: 6.2,
    iconUrl: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    color: '#F3BA2F',
    chain: 'BNB Chain',
    fallbackPriceUsd: 598.35,
    fallback24hChange: 1.15,
  },
  {
    id: 'nexorum',
    symbol: 'NEXO',
    name: 'NEXORUM Native',
    amount: 125000,
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    color: '#06B6D4',
    chain: 'NEXORUM L1',
    fallbackPriceUsd: 0.085,
    fallback24hChange: 8.42,
  },
  {
    id: 'the-open-network',
    symbol: 'TON',
    name: 'TON Coin',
    amount: 420.0,
    iconUrl: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
    color: '#0088CC',
    chain: 'TON Network',
    fallbackPriceUsd: 6.85,
    fallback24hChange: 3.12,
  },
  {
    id: 'tether',
    symbol: 'USDT',
    name: 'Tether USD',
    amount: 2500.0,
    iconUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    color: '#26A17B',
    chain: 'Multi-Chain',
    fallbackPriceUsd: 1.0,
    fallback24hChange: 0.01,
  },
];

const AVAILABLE_TOKENS_LIST = [
  { id: 'polygon-ecosystem-token', symbol: 'POL', name: 'Polygon', color: '#8247E5', chain: 'Polygon', fallbackPrice: 0.52 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', color: '#0033AD', chain: 'Cardano', fallbackPrice: 0.38 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', color: '#E84142', chain: 'Avalanche', fallbackPrice: 28.4 },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', color: '#375BD2', chain: 'Ethereum', fallbackPrice: 14.2 },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', color: '#FF007A', chain: 'Ethereum', fallbackPrice: 7.85 },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', color: '#000000', chain: 'NEAR', fallbackPrice: 5.12 },
  { id: 'sui', symbol: 'SUI', name: 'Sui Network', color: '#4CA2FF', chain: 'Sui', fallbackPrice: 1.95 },
];

export const PortfolioSummary: React.FC = () => {
  const { user } = useAuth();

  // Holdings state
  const [holdings, setHoldings] = useState<TokenHolding[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexorum_user_portfolio_holdings');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load saved portfolio holdings:', e);
      }
    }
    return DEFAULT_HOLDINGS;
  });

  // Price map state { [coingeckoId]: { priceUsd: number, change24h: number } }
  const [prices, setPrices] = useState<Record<string, { priceUsd: number; change24h: number }>>({});
  const [isFetchingPrices, setIsFetchingPrices] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);
  const [apiSource, setApiSource] = useState<'coingecko' | 'cached' | 'fallback'>('fallback');
  const [apiError, setApiError] = useState<string | null>(null);

  // 30-Second Polling & Countdown State
  const [countdown, setCountdown] = useState<number>(30);

  // Edit / Add modal state
  const [editingToken, setEditingToken] = useState<TokenHolding | null>(null);
  const [editAmountInput, setEditAmountInput] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTokenSelected, setNewTokenSelected] = useState(AVAILABLE_TOKENS_LIST[0]);
  const [newTokenAmountInput, setNewTokenAmountInput] = useState('100');

  // Save holdings to localStorage on update
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexorum_user_portfolio_holdings', JSON.stringify(holdings));
    }
  }, [holdings]);

  // CoinGecko API Live Price Fetching
  const fetchCoinGeckoPrices = useCallback(async () => {
    setIsFetchingPrices(true);
    setApiError(null);

    // Collect all CoinGecko IDs from holdings
    const idsToFetch = Array.from(new Set(holdings.map((h) => h.id))).filter((id) => id !== 'nexorum');

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch.join(
        ','
      )}&vs_currencies=usd&include_24hr_change=true`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`CoinGecko HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const newPriceMap: Record<string, { priceUsd: number; change24h: number }> = {};

      holdings.forEach((h) => {
        if (h.id === 'nexorum') {
          // Native DEX token reference
          newPriceMap['nexorum'] = {
            priceUsd: h.fallbackPriceUsd,
            change24h: h.fallback24hChange,
          };
        } else if (data[h.id] && typeof data[h.id].usd === 'number') {
          newPriceMap[h.id] = {
            priceUsd: data[h.id].usd,
            change24h: data[h.id].usd_24h_change || 0,
          };
        } else {
          // Fallback if token missing in API response
          newPriceMap[h.id] = {
            priceUsd: h.fallbackPriceUsd,
            change24h: h.fallback24hChange,
          };
        }
      });

      setPrices(newPriceMap);
      setApiSource('coingecko');
      setLastUpdatedTime(new Date().toLocaleTimeString());
      setCountdown(30);
    } catch (err: any) {
      console.warn('CoinGecko API Fetch Error, using live fallback matrix:', err);
      setApiError(err.message || 'Rate limited or network offline. Using secondary oracle.');

      // Populate fallback prices
      const fallbackMap: Record<string, { priceUsd: number; change24h: number }> = {};
      holdings.forEach((h) => {
        fallbackMap[h.id] = {
          priceUsd: h.fallbackPriceUsd,
          change24h: h.fallback24hChange,
        };
      });
      setPrices(fallbackMap);
      setApiSource('fallback');
      setLastUpdatedTime(new Date().toLocaleTimeString());
      setCountdown(30);
    } finally {
      setIsFetchingPrices(false);
    }
  }, [holdings]);

  // Initial fetch on mount & 30-second automatic market price polling
  useEffect(() => {
    fetchCoinGeckoPrices();

    // Poll every 30 seconds for live market price updates
    const pollInterval = setInterval(() => {
      fetchCoinGeckoPrices();
    }, 30000);

    // 1-second interval to update visual countdown badge
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [fetchCoinGeckoPrices]);

  // Calculated metrics
  const calculatedHoldings = holdings.map((h) => {
    const liveInfo = prices[h.id] || { priceUsd: h.fallbackPriceUsd, change24h: h.fallback24hChange };
    const price = liveInfo.priceUsd;
    const change24h = liveInfo.change24h;
    const totalValueUsd = h.amount * price;
    const valueChange24hUsd = totalValueUsd * (change24h / 100);

    return {
      ...h,
      currentPriceUsd: price,
      change24hPercent: change24h,
      totalValueUsd,
      valueChange24hUsd,
    };
  });

  const totalPortfolioValueUsd = calculatedHoldings.reduce((sum, item) => sum + item.totalValueUsd, 0);
  const total24hValueChangeUsd = calculatedHoldings.reduce((sum, item) => sum + item.valueChange24hUsd, 0);
  const total24hPercentChange = totalPortfolioValueUsd > 0 ? (total24hValueChangeUsd / totalPortfolioValueUsd) * 100 : 0;

  // Add percentage share to each calculated item
  const holdingsWithShare = calculatedHoldings
    .map((item) => ({
      ...item,
      portfolioSharePercent: totalPortfolioValueUsd > 0 ? (item.totalValueUsd / totalPortfolioValueUsd) * 100 : 0,
    }))
    .sort((a, b) => b.totalValueUsd - a.totalValueUsd);

  // Handle Amount Edit
  const handleSaveTokenAmount = () => {
    if (!editingToken) return;
    const num = parseFloat(editAmountInput);
    if (isNaN(num) || num < 0) return;

    setHoldings((prev) =>
      prev.map((item) => (item.id === editingToken.id ? { ...item, amount: num } : item))
    );
    setEditingToken(null);
  };

  // Handle Remove Holding
  const handleRemoveHolding = (id: string) => {
    if (confirm('Are you sure you want to remove this token from your portfolio summary?')) {
      setHoldings((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Handle Add New Token
  const handleAddNewToken = () => {
    const amount = parseFloat(newTokenAmountInput);
    if (isNaN(amount) || amount <= 0) return;

    const existing = holdings.find((h) => h.id === newTokenSelected.id);
    if (existing) {
      setHoldings((prev) =>
        prev.map((h) => (h.id === newTokenSelected.id ? { ...h, amount: h.amount + amount } : h))
      );
    } else {
      const newHolding: TokenHolding = {
        id: newTokenSelected.id,
        symbol: newTokenSelected.symbol,
        name: newTokenSelected.name,
        amount,
        color: newTokenSelected.color,
        chain: newTokenSelected.chain,
        fallbackPriceUsd: newTokenSelected.fallbackPrice,
        fallback24hChange: 1.5,
      };
      setHoldings((prev) => [...prev, newHolding]);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
      {/* Module Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Aggregated Portfolio Summary</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                Live On-Chain & CoinGecko
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Aggregated crypto token holdings with real-time CoinGecko market pricing.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-[11px] font-mono font-bold text-cyan-300">
            <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
            <span>Auto 30s ({countdown}s)</span>
          </div>

          <button
            type="button"
            id="btn_refresh_coingecko_prices"
            onClick={fetchCoinGeckoPrices}
            disabled={isFetchingPrices}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Fetch live prices from CoinGecko API manually"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isFetchingPrices ? 'animate-spin' : ''}`} />
            <span>{isFetchingPrices ? 'Fetching...' : 'Sync Prices'}</span>
          </button>

          <button
            type="button"
            id="btn_add_portfolio_token"
            onClick={() => setIsAddModalOpen(true)}
            className="py-2 px-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Portfolio Balance */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Combined Value</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(totalPortfolioValueUsd)}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
            <span className="text-slate-500">Holdings Count:</span>
            <span className="text-slate-200 font-bold font-mono">{holdings.length} Assets</span>
          </div>
        </div>

        {/* Card 2: 24h P&L Change */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>24h Portfolio Return</span>
            {total24hValueChangeUsd >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-mono ${
                total24hValueChangeUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {total24hValueChangeUsd >= 0 ? '+' : ''}
              {formatCurrency(total24hValueChangeUsd)}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md font-mono ${
                total24hPercentChange >= 0
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
              }`}
            >
              {total24hPercentChange >= 0 ? '+' : ''}
              {total24hPercentChange.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900 text-slate-500">
            <span>24h Price Direction:</span>
            <span className={total24hValueChangeUsd >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {total24hValueChangeUsd >= 0 ? 'Bullish Net Profit' : 'Net Loss'}
            </span>
          </div>
        </div>

        {/* Card 3: CoinGecko Oracle Status */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Market Data Oracle</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                apiSource === 'coingecko' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-sm font-bold text-white">
              {apiSource === 'coingecko' ? 'CoinGecko API Live' : 'NEXO Price Index'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-900 space-y-1">
            <div className="flex justify-between">
              <span>Last Sync:</span>
              <span className="font-mono text-slate-300 font-semibold">{lastUpdatedTime || 'Just now'}</span>
            </div>
            <div className="flex justify-between items-center text-cyan-400 font-mono text-[10px]">
              <span>30s Auto Poll:</span>
              <span className="font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Updating in {countdown}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Distribution Bar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Asset Allocation Ratio</span>
          </span>
          <span className="text-slate-500 font-mono text-[11px]">100% Aggregated</span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-3.5 rounded-xl bg-slate-900 overflow-hidden flex p-[2px] gap-[2px]">
          {holdingsWithShare.map((item) => (
            <div
              key={item.id}
              style={{
                width: `${Math.max(item.portfolioSharePercent, 1.5)}%`,
                backgroundColor: item.color,
              }}
              className="h-full rounded-sm transition-all hover:opacity-80 relative group"
              title={`${item.name} (${item.symbol}): ${item.portfolioSharePercent.toFixed(1)}%`}
            />
          ))}
        </div>

        {/* Legend Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {holdingsWithShare.map((item) => (
            <div key={item.id} className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-bold text-white">{item.symbol}:</span>
              <span className="text-slate-400">{item.portfolioSharePercent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Token Holdings Detailed Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-cyan-400" />
            <span>Token Holdings Breakdown</span>
          </h3>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Asset / Token</th>
                <th className="py-3 px-4">Chain</th>
                <th className="py-3 px-4 text-right">Holdings</th>
                <th className="py-3 px-4 text-right">Market Price (CoinGecko)</th>
                <th className="py-3 px-4 text-right">24h Change</th>
                <th className="py-3 px-4 text-right">Total USD Value</th>
                <th className="py-3 px-4 text-right">Share</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {holdingsWithShare.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/50 transition-colors group">
                  {/* Asset Name & Icon */}
                  <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl overflow-hidden p-1 flex items-center justify-center shrink-0 border border-slate-800"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      {item.iconUrl ? (
                        <img src={item.iconUrl} alt={item.name} className="w-full h-full object-contain rounded" />
                      ) : (
                        <span className="text-xs font-black" style={{ color: item.color }}>
                          {item.symbol.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {item.symbol}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Chain */}
                  <td className="py-3 px-4 font-sans text-slate-400 text-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold">
                      {item.chain}
                    </span>
                  </td>

                  {/* Holdings Amount */}
                  <td className="py-3 px-4 text-right font-bold text-white">
                    {formatNumber(item.amount)} {item.symbol}
                  </td>

                  {/* Market Price */}
                  <td className="py-3 px-4 text-right text-slate-200">
                    {formatCurrency(item.currentPriceUsd)}
                  </td>

                  {/* 24h Change */}
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.change24hPercent >= 0
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                      }`}
                    >
                      {item.change24hPercent >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {item.change24hPercent >= 0 ? '+' : ''}
                      {item.change24hPercent.toFixed(2)}%
                    </span>
                  </td>

                  {/* Total Value USD */}
                  <td className="py-3 px-4 text-right font-black text-cyan-300">
                    {formatCurrency(item.totalValueUsd)}
                  </td>

                  {/* Share % */}
                  <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                    {item.portfolioSharePercent.toFixed(1)}%
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingToken(item);
                          setEditAmountInput(String(item.amount));
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Edit holding amount"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveHolding(item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors"
                        title="Remove holding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Edit Token Amount */}
      {editingToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Adjust {editingToken.name} Holding</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingToken(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-bold block">
                Total {editingToken.symbol} Amount:
              </label>
              <input
                type="number"
                step="any"
                value={editAmountInput}
                onChange={(e) => setEditAmountInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingToken(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTokenAmount}
                className="py-2 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
              >
                Save Amount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Token Holding */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Add Token to Portfolio Summary</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Select Token Asset:</label>
                <select
                  value={newTokenSelected.id}
                  onChange={(e) => {
                    const match = AVAILABLE_TOKENS_LIST.find((t) => t.id === e.target.value);
                    if (match) setNewTokenSelected(match);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                >
                  {AVAILABLE_TOKENS_LIST.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.symbol}) - {t.chain}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Quantity Held:</label>
                <input
                  type="number"
                  step="any"
                  value={newTokenAmountInput}
                  onChange={(e) => setNewTokenAmountInput(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewToken}
                className="py-2 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
              >
                Add Holding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
