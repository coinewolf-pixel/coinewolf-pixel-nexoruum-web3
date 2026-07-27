import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Wallet,
  Zap,
  PlusCircle,
  Flame,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ExternalLink,
  Newspaper,
  Award,
  ShieldCheck,
  CheckCircle2,
  Gift,
  Send,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { TokenItem, TransactionRecord, AirdropCampaign } from '../types';
import { formatCurrency, formatNumber, formatAddress, timeAgo } from '../lib/utils';

interface HomeViewProps {
  setActiveTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ setActiveTab }) => {
  const { activeWallet, openWalletModal } = useWallet();
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [airdrops, setAirdrops] = useState<AirdropCampaign[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const resTok = await api.getTokens();
      if (resTok.success && resTok.tokens) setTokens(resTok.tokens);

      const resAir = await api.getAirdrops();
      if (resAir.success && resAir.airdrops) setAirdrops(resAir.airdrops);
    } catch (err) {
      console.error('Failed to load home data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaimAirdrop = async (airdropId: string) => {
    if (!user) {
      addToast('Wallet Required', 'Please connect your wallet to claim airdrops.', 'warning');
      openWalletModal();
      return;
    }
    setClaimingId(airdropId);
    try {
      const res = await api.claimAirdrop(airdropId, user.id);
      if (res.success) {
        addToast('Airdrop Claimed! 🎉', res.message, 'success');
        loadData();
      } else {
        addToast('Claim Error', res.error || 'Failed to claim airdrop', 'error');
      }
    } catch (err: any) {
      addToast('Claim Error', err.message || 'Error executing claim', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const totalPortfolioUsd = user?.wallets ? user.wallets.reduce((acc, w) => acc + w.balanceUsd, 0) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Card */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all duration-500" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Multi-Chain Portfolio
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +14.8% 24h
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {formatCurrency(totalPortfolioUsd)}
              </h1>
              <span className="text-slate-400 text-sm font-medium mt-1 block">
                Across {user?.wallets.length || 0} Connected Wallets
              </span>
            </div>
            <button
              onClick={openWalletModal}
              className="py-2.5 px-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all flex items-center gap-2 self-start sm:self-center shrink-0"
            >
              <Wallet className="w-4 h-4" />
              <span>{user?.wallets.length ? 'Manage Wallets' : 'Connect Real Wallet'}</span>
            </button>
          </div>

          {/* Mini Portfolio Sparkline Visual */}
          <div className="h-16 flex items-end gap-1.5 mb-6 pt-2">
            {[45, 52, 48, 65, 72, 68, 84, 91, 88, 95, 110, 125].map((val, idx) => (
              <div key={idx} className="flex-1 bg-slate-800 rounded-t-md overflow-hidden relative group/bar">
                <div
                  className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-500"
                  style={{ height: `${(val / 125) * 100}%` }}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-800/80 pt-4">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Primary Wallet</span>
              <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                {activeWallet ? formatAddress(activeWallet.address) : 'Not Connected'}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Created Tokens</span>
              <p className="text-xs font-bold text-cyan-400 mt-0.5">3 Live Tokens</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">NEXORUM User ID</span>
              <p className="text-xs font-mono font-bold text-slate-300 mt-0.5">{user?.id || 'usr_nex_982341'}</p>
            </div>
          </div>
        </div>

        {/* AI Assistant Quick Prompt Box */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h3 className="font-bold text-white text-base">AI Assistant Engine</h3>
                <p className="text-slate-400 text-xs">Powered by Gemini AI</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              "Your portfolio on Base & TON shows strong 24h momentum. Recommend deploying liquidity on TON Jettons."
            </p>
          </div>

          <div className="space-y-2 mt-4">
            <button
              id="btn_home_ai_portfolio_analysis"
              onClick={() => setActiveTab('ai')}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex items-center justify-between"
            >
              <span>Run Full Portfolio Analysis</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              id="btn_home_create_token_prompt"
              onClick={() => setActiveTab('creator')}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>Launch Token via Token Engine</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE AIRDROPS BANNER SECTION */}
      {airdrops.filter((a) => a.status === 'ACTIVE').length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400 animate-bounce" />
            <h2 className="text-xl font-black text-white">Active NEXORUM Token Airdrops</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {airdrops
              .filter((a) => a.status === 'ACTIVE')
              .map((air) => {
                const isClaimed = user && air.claimedUserIds.includes(user.id);
                return (
                  <div
                    key={air.id}
                    className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 shadow-xl flex flex-col justify-between gap-4 relative overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-white text-base">{air.title}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                          {air.amountPerUser} {air.symbol}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{air.description}</p>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                        <span>Network: <strong className="text-cyan-300">{air.network.toUpperCase()}</strong></span>
                        <span>Pool: <strong className="text-emerald-400">{air.remainingPool} {air.symbol}</strong></span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between gap-3">
                      {isClaimed ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Airdrop Claimed to Wallet</span>
                        </div>
                      ) : (
                        <button
                          id={`btn_claim_airdrop_${air.id}`}
                          onClick={() => handleClaimAirdrop(air.id)}
                          disabled={claimingId === air.id}
                          className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-950 flex items-center justify-center gap-2 transition-all"
                        >
                          <Gift className={`w-4 h-4 ${claimingId === air.id ? 'animate-spin' : ''}`} />
                          <span>{claimingId === air.id ? 'Claiming Tokens...' : `Claim ${air.amountPerUser} ${air.symbol}`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* NEW TOKENS & HOT TOKENS CAROUSEL / TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-white">Live Tokens in NEXORUM Engine</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {tokens.length} Active
            </span>
          </div>
          <button
            id="btn_view_all_discover"
            onClick={() => setActiveTab('discover')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View All in Discover</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tokens Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 shadow-xl group space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={token.logoUrl}
                    alt={token.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-white text-base group-hover:text-cyan-300 transition-colors">
                        {token.name}
                      </h3>
                      {token.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" title="Verified Contract" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono font-bold text-slate-400">${token.symbol}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {token.network}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {token.isHot && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      HOT
                    </span>
                  )}
                  {token.isNew && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                      NEW
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Market Cap */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium">Current Price</span>
                  <p className="text-sm font-bold font-mono text-white mt-0.5">
                    {formatCurrency(token.priceUsd)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium">Market Cap</span>
                  <p className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                    ${formatNumber(token.marketCapUsd)}
                  </p>
                </div>
              </div>

              {/* Details & Owner */}
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Owner Address:</span>
                  <span className="font-mono text-slate-300">{formatAddress(token.ownerAddress)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Created:</span>
                  <span className="font-mono text-slate-400">{timeAgo(token.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>24h Volume:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    ${formatNumber(token.volume24hUsd)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                id={`btn_trade_token_${token.id}`}
                onClick={() => setActiveTab('marketplace')}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-600/30 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>Trade in Marketplace</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT TRANSACTIONS & MARKET NEWS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Recent Blockchain Transactions</h3>
            </div>
            <span className="text-xs text-slate-500">Live Engine Log</span>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'tx_1',
                type: 'DEPLOY_TOKEN',
                symbol: 'NEX',
                hash: '0x8f2a1b...7d8e9f0',
                amountUsd: 4820.0,
                status: 'CONFIRMED',
                network: 'ethereum',
                time: '2h ago',
              },
              {
                id: 'tx_2',
                type: 'BUY_MARKETPLACE',
                symbol: 'USDT',
                hash: '0x10293a...9021812',
                amountUsd: 250.0,
                status: 'CONFIRMED',
                network: 'arbitrum',
                time: '5h ago',
              },
              {
                id: 'tx_3',
                type: 'TRANSFER',
                symbol: 'TON',
                hash: 'EQA892...TON_TX',
                amountUsd: 1200.0,
                status: 'CONFIRMED',
                network: 'ton',
                time: '1d ago',
              },
            ].map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{tx.type}</span>
                      <span className="font-mono text-slate-400 text-[10px]">{tx.hash}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{tx.network} • {tx.time}</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <p className="font-bold text-white">{formatCurrency(tx.amountUsd)}</p>
                  <span className="text-[10px] font-bold text-emerald-400">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Overview & News */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">NEXORUM Ecosystem Announcements</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">TON Jetton Support Live</span>
                <span className="text-[10px] text-slate-500">2 hours ago</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                NEXORUM Token Engine now supports native TON Jetton token creation, auto-deploy, and Tonkeeper wallet integration.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">Gemini 2.5 AI Assistant Updated</span>
                <span className="text-[10px] text-slate-500">1 day ago</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run cross-chain price prediction and automated smart contract auditing directly inside the AI Assistant module.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
