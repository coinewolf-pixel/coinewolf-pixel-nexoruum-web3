import React, { useState } from 'react';
import { Search, Wallet, Zap, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { formatAddress, formatCurrency } from '../lib/utils';

interface SearchViewProps {
  setActiveTab: (tab: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [searchTab, setSearchTab] = useState<'All' | 'Tokens' | 'Wallets' | 'Transactions'>('All');

  const mockResults = [
    { type: 'Token', title: 'NEXORUM Quantum Engine', symbol: 'NEX', address: '0x9522...BAfe5', network: 'ethereum' },
    { type: 'Token', title: 'Cyber AI Protocol', symbol: 'CYAI', address: '0x32A2...840192', network: 'base' },
    { type: 'Wallet', title: 'Primary Creator Wallet', symbol: 'ETH/TON', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', network: 'multi' },
    { type: 'Transaction', title: 'Token Creation Tx', symbol: 'DEPLOY', address: '0x8f2a1b9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a', network: 'ethereum' },
  ];

  const filtered = mockResults.filter((item) => {
    const q = (query || '').toLowerCase();
    const matchesTab = searchTab === 'All' || item.type === searchTab || (searchTab === 'Tokens' && item.type === 'Token');
    const matchesText =
      (item.title || '').toLowerCase().includes(q) ||
      (item.symbol || '').toLowerCase().includes(q) ||
      (item.address || '').toLowerCase().includes(q);
    return matchesTab && matchesText;
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Search className="w-4 h-4" />
          <span>NEXORUM Global Explorer</span>
        </div>
        <h1 className="text-3xl font-black text-white">Search Ecosystem</h1>
        <p className="text-slate-400 text-xs mt-1">
          Search contracts, tokens, wallet addresses, NFTs, and transaction logs across all chains.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="input_global_search_page"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search token symbol, name, wallet 0x..., or transaction hash..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono shadow-2xl"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['All', 'Tokens', 'Wallets', 'Transactions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSearchTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                searchTab === tab
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2 shadow-2xl">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No records found</div>
        ) : (
          filtered.map((res, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{res.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 uppercase">
                      {res.network}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">{res.address}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('discover')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                <ArrowUpRight className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
