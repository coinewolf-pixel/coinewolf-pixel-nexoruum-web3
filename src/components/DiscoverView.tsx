import React, { useState, useEffect } from 'react';
import {
  Compass,
  Flame,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { TokenItem, NetworkId } from '../types';
import { formatCurrency, formatNumber, formatAddress, timeAgo } from '../lib/utils';

interface DiscoverViewProps {
  setActiveTab: (tab: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ setActiveTab }) => {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<
    'all' | 'trending' | 'new' | 'top_gainers' | 'verified'
  >('all');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getTokens().then((res) => {
      if (res.success && res.tokens) setTokens(res.tokens);
    });
  }, []);

  const filteredTokens = tokens.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contractAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesNetwork = selectedNetwork === 'all' || t.network === selectedNetwork;

    if (!matchesSearch || !matchesNetwork) return false;

    if (filterCategory === 'trending') return t.priceChange24h > 15;
    if (filterCategory === 'new') return t.isNew;
    if (filterCategory === 'top_gainers') return t.priceChange24h > 20;
    if (filterCategory === 'verified') return t.isVerified;

    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>NEXORUM Blockchain Engine</span>
          </div>
          <h1 className="text-3xl font-black text-white">Discover & Trending Tokens</h1>
          <p className="text-slate-400 text-xs mt-1">
            Explore newly created tokens, top gainers, and verified smart contracts across all supported chains.
          </p>
        </div>

        <button
          id="btn_discover_create_token"
          onClick={() => setActiveTab('creator')}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 shrink-0"
        >
          <Zap className="w-4 h-4" />
          <span>Launch Your Token</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input_discover_search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by token name, symbol, or contract address..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Tokens' },
            { id: 'trending', label: 'Trending 🔥' },
            { id: 'new', label: 'Recently Created ✨' },
            { id: 'top_gainers', label: 'Top Gainers 🚀' },
            { id: 'verified', label: 'Verified Only 🛡️' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                filterCategory === cat.id
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Network Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Network:</span>
        {(['all', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'base', 'solana', 'ton'] as const).map((net) => (
          <button
            key={net}
            onClick={() => setSelectedNetwork(net)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase transition-all border ${
              selectedNetwork === net
                ? 'bg-slate-800 border-cyan-500 text-cyan-300'
                : 'bg-slate-950 border-slate-800/80 text-slate-500 hover:text-slate-300'
            }`}
          >
            {net}
          </button>
        ))}
      </div>

      {/* Tokens List / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Asset / Token</th>
                <th className="p-4">Network</th>
                <th className="p-4">Price</th>
                <th className="p-4">24h Change</th>
                <th className="p-4">Market Cap</th>
                <th className="p-4">24h Volume</th>
                <th className="p-4">Contract Address</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No tokens found matching search filters.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token) => (
                  <tr key={token.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="p-4 font-sans">
                      <div className="flex items-center gap-3">
                        <img
                          src={token.logoUrl}
                          alt={token.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-white text-sm group-hover:text-cyan-300">
                            <span>{token.name}</span>
                            {token.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
                          </div>
                          <span className="text-[11px] text-slate-400">${token.symbol}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 uppercase font-bold text-slate-300">{token.network}</td>
                    <td className="p-4 font-bold text-white">{formatCurrency(token.priceUsd)}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded text-[11px] ${
                          token.priceChange24h >= 0
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                        }`}
                      >
                        {token.priceChange24h >= 0 ? '+' : ''}
                        {token.priceChange24h}%
                      </span>
                    </td>
                    <td className="p-4 font-bold text-cyan-400">${formatNumber(token.marketCapUsd)}</td>
                    <td className="p-4 font-bold text-slate-300">${formatNumber(token.volume24hUsd)}</td>
                    <td className="p-4 text-slate-400">{formatAddress(token.contractAddress)}</td>
                    <td className="p-4 text-right font-sans">
                      <button
                        id={`btn_discover_trade_${token.id}`}
                        onClick={() => setActiveTab('marketplace')}
                        className="py-1.5 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all inline-flex items-center gap-1"
                      >
                        <span>Trade</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
