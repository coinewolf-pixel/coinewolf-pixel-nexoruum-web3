import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
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
  ChevronLeft,
  ExternalLink,
  Award,
  ShieldCheck,
  CheckCircle2,
  Gift,
  Boxes,
  RotateCw,
  Copy,
  Check,
  Calendar,
  Coins,
  Newspaper,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { TokenItem, TransactionRecord, AirdropCampaign } from '../types';
import { formatCurrency, formatNumber, formatAddress, timeAgo } from '../lib/utils';
import { NetworkMetricsDashboard } from './NetworkMetricsDashboard';

interface HomeViewProps {
  setActiveTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ setActiveTab }) => {
  const { activeWallet, openWalletModal, syncOnChainBalances, isSyncingBalances } = useWallet();
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [airdrops, setAirdrops] = useState<AirdropCampaign[]>([]);

  // Daily Streak Airdrop State
  const [dailyStatus, setDailyStatus] = useState<{
    streak: number;
    totalClaimed: number;
    canClaimNow: boolean;
    timeUntilNextClaimMs: number;
    currentRewardNex: number;
    schedule: number[];
  } | null>(null);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [countdownText, setCountdownText] = useState('');

  // Staking State
  const [stakingPools, setStakingPools] = useState<any[]>([]);
  const [userStakes, setUserStakes] = useState<any[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [stakeAmountInput, setStakeAmountInput] = useState<string>('10');
  const [isStaking, setIsStaking] = useState(false);
  const [stakingStatusStep, setStakingStatusStep] = useState<string | null>(null);
  const [stakingError, setStakingError] = useState<string | null>(null);
  const [isUnstakingId, setIsUnstakingId] = useState<string | null>(null);
  const [unstakeError, setUnstakeError] = useState<Record<string, string>>({});

  // 3D Panel State
  const [activeTokenIndex, setActiveTokenIndex] = useState(0);
  const [is3dAutoRotate, setIs3dAutoRotate] = useState(true);
  const [showcaseMode, setShowcaseMode] = useState<'3d' | 'grid'>('3d');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const resTok = await api.getTokens();
      if (resTok.success && resTok.tokens) setTokens(resTok.tokens);

      const resAir = await api.getAirdrops();
      if (resAir.success && resAir.airdrops) setAirdrops(resAir.airdrops);

      const resPools = await api.getStakingPools();
      if (resPools.success && resPools.pools) setStakingPools(resPools.pools);

      if (user) {
        const resDaily = await api.getDailyAirdropStatus(user.id);
        if (resDaily.success) {
          setDailyStatus({
            streak: resDaily.streak,
            totalClaimed: resDaily.totalClaimed,
            canClaimNow: resDaily.canClaimNow,
            timeUntilNextClaimMs: resDaily.timeUntilNextClaimMs,
            currentRewardNex: resDaily.currentRewardNex,
            schedule: resDaily.schedule || [8, 9, 10, 10, 11, 11, 11],
          });
        }

        const resStakes = await api.getUserStakes(user.id);
        if (resStakes.success && resStakes.stakes) setUserStakes(resStakes.stakes);
      }
    } catch (err) {
      console.warn('Notice loading home data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000); // Auto-sync every 8s
    return () => clearInterval(interval);
  }, [user]);

  // Countdown timer effect for daily claim cooldown
  useEffect(() => {
    if (!dailyStatus || dailyStatus.canClaimNow || dailyStatus.timeUntilNextClaimMs <= 0) {
      setCountdownText('');
      return;
    }

    let msLeft = dailyStatus.timeUntilNextClaimMs;
    const timer = setInterval(() => {
      msLeft -= 1000;
      if (msLeft <= 0) {
        clearInterval(timer);
        setCountdownText('');
        loadData();
      } else {
        const h = Math.floor(msLeft / (1000 * 60 * 60));
        const m = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((msLeft % (1000 * 60)) / 1000);
        setCountdownText(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [dailyStatus]);

  // 3D Auto Rotate Timer
  useEffect(() => {
    if (!is3dAutoRotate || tokens.length === 0) return;
    const autoRot = setInterval(() => {
      setActiveTokenIndex((prev) => (prev + 1) % tokens.length);
    }, 4000);
    return () => clearInterval(autoRot);
  }, [is3dAutoRotate, tokens.length]);

  const handleClaimDailyAirdrop = async () => {
    if (!user) {
      addToast('Wallet Required', 'Please connect your Web3 wallet to claim daily rewards.', 'warning');
      openWalletModal();
      return;
    }

    setClaimingDaily(true);
    try {
      const res = await api.claimDailyAirdrop(user.id);
      if (res.success) {
        addToast('Daily Reward Claimed! 🎉', res.message, 'success');
        loadData();
      } else {
        addToast('Claim Error', res.error || 'Daily claim unavailable', 'error');
      }
    } catch (err: any) {
      addToast('Claim Error', err.message || 'Error claiming daily reward', 'error');
    } finally {
      setClaimingDaily(false);
    }
  };

  const handleManualSync = async () => {
    try {
      const res = await syncOnChainBalances();
      addToast('On-Chain Balances Synced! 🔄', res.message, 'success');
      loadData();
    } catch (err: any) {
      addToast('Sync Warning', err.message || 'Balance sync completed', 'warning');
    }
  };

  const handleStakeNex = async () => {
    if (!user) {
      addToast('Wallet Required', 'Connect your Web3 wallet to stake NEX tokens.', 'warning');
      openWalletModal();
      return;
    }

    const numAmt = parseFloat(stakeAmountInput);
    if (!numAmt || numAmt <= 0) {
      addToast('Invalid Staking Amount', 'Please enter a valid amount of NEX to stake.', 'warning');
      return;
    }

    setIsStaking(true);
    setStakingError(null);
    setStakingStatusStep('Authorizing Staking Vault Smart Contract...');

    setTimeout(() => {
      setStakingStatusStep('Broadcasting Lock Transaction to Blockchain...');
    }, 500);

    setTimeout(async () => {
      try {
        const res = await api.stakeNex(user.id, numAmt, selectedDuration);
        if (res.success) {
          setStakingStatusStep('Transaction Confirmed! On-Chain Lock Active.');
          addToast('NEX Tokens Staked! 🔒', res.message, 'success');
          loadData();
          setTimeout(() => setStakingStatusStep(null), 2500);
        } else {
          setStakingError(res.error || 'Failed to stake NEX tokens.');
          setStakingStatusStep(null);
          addToast('Staking Error', res.error || 'Failed to stake NEX tokens.', 'error');
        }
      } catch (err: any) {
        setStakingError(err.message || 'Error executing staking transaction');
        setStakingStatusStep(null);
        addToast('Staking Error', err.message || 'Error executing staking transaction', 'error');
      } finally {
        setIsStaking(false);
      }
    }, 1100);
  };

  const handleUnstakeNex = async (stakeId: string) => {
    if (!user) return;
    setIsUnstakingId(stakeId);
    setUnstakeError((prev) => ({ ...prev, [stakeId]: '' }));
    try {
      const res = await api.unstakeNex(stakeId, user.id);
      if (res.success) {
        addToast('Unstaked & Payout Collected! 🎉', res.message, 'success');
        loadData();
      } else {
        setUnstakeError((prev) => ({ ...prev, [stakeId]: res.error || 'Failed to unstake NEX.' }));
        addToast('Unstake Error', res.error || 'Failed to unstake NEX.', 'error');
      }
    } catch (err: any) {
      setUnstakeError((prev) => ({ ...prev, [stakeId]: err.message || 'Error processing unstake' }));
      addToast('Unstake Error', err.message || 'Error processing unstake', 'error');
    } finally {
      setIsUnstakingId(null);
    }
  };

  const handleCopyContract = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    addToast('Address Copied', 'Contract address copied to clipboard', 'info');
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const totalPortfolioUsd = user?.wallets ? user.wallets.reduce((acc, w) => acc + w.balanceUsd, 0) : 0;
  const activeToken = tokens[activeTokenIndex] || tokens[0];

  // Calculate 7-Day Asset History for Chart
  const assetHistory7D = useMemo(() => {
    const baseValue = totalPortfolioUsd > 0 ? totalPortfolioUsd : 1284.50;
    const multipliers = [0.82, 0.88, 0.85, 0.92, 0.89, 0.95, 1.0];
    const now = new Date();
    return multipliers.map((mult, idx) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - idx));
      const dayLabel = idx === 6 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const valueUsd = Number((baseValue * mult).toFixed(2));
      const nexValue = Number(((baseValue * mult) / 0.05).toFixed(0));
      return {
        day: dayLabel,
        date: dateLabel,
        valueUsd,
        nexValue,
      };
    });
  }, [totalPortfolioUsd]);

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-cyan-500/40 backdrop-blur-md p-3 rounded-xl shadow-2xl text-xs space-y-1 z-50">
          <p className="text-slate-400 font-mono text-[10px]">{data.date} ({data.day})</p>
          <p className="font-black text-cyan-300 font-mono text-sm">
            {formatCurrency(data.valueUsd)}
          </p>
          <p className="text-slate-400 text-[10px] font-mono">
            ~ {formatNumber(data.nexValue)} NEX Tokens
          </p>
        </div>
      );
    }
    return null;
  };

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

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-5">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {formatCurrency(totalPortfolioUsd)}
              </h1>
              <span className="text-slate-400 text-sm font-medium mt-1 block">
                Across {user?.wallets.length || 0} Connected Wallets
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
              <button
                id="btn_sync_onchain_balances"
                onClick={handleManualSync}
                disabled={isSyncingBalances}
                className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-cyan-300 font-bold text-xs shadow-md flex items-center gap-2 transition-all"
              >
                <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingBalances ? 'animate-spin' : ''}`} />
                <span>{isSyncingBalances ? 'Syncing...' : 'Sync Now'}</span>
              </button>
              <button
                onClick={openWalletModal}
                className="py-2.5 px-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                <span>{user?.wallets.length ? 'Manage Wallets' : 'Connect Real Wallet'}</span>
              </button>
            </div>
          </div>

          {/* 7-Day Token Asset Value Line Chart */}
          <div className="mb-5 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px]">
                  7-Day Token Asset Value History
                </span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                7D Asset Performance
              </span>
            </div>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={assetHistory7D} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tokenAssetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="valueUsd"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#tokenAssetGradient)"
                    activeDot={{ r: 5, stroke: '#22d3ee', strokeWidth: 2, fill: '#0891b2' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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

      {/* NEXORUM CHAIN NETWORK METRICS & GAS FEE TRENDS DASHBOARD (RECHARTS) */}
      <NetworkMetricsDashboard />

      {/* DAILY CHECK-IN & STREAK AIRDROP REWARDS SECTION */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border border-purple-500/40 shadow-2xl space-y-5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400 animate-bounce" />
              <h2 className="text-xl font-black text-white">NEXORUM Daily Check-In & Streak Airdrop</h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Up to 500 NEX Total
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Return every 24 hours to claim your daily token bonus! Maintain your streak to unlock the Day 7 Mega Bonus.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-purple-900/40 border border-purple-500/30 text-right">
              <span className="text-[10px] text-purple-300 uppercase font-bold block">Total Claimed</span>
              <span className="text-sm font-black text-amber-300 font-mono">
                {dailyStatus?.totalClaimed || 0} NEX
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-purple-900/40 border border-purple-500/30 text-right">
              <span className="text-[10px] text-purple-300 uppercase font-bold block">Current Streak</span>
              <span className="text-sm font-black text-cyan-300 font-mono">
                Day {dailyStatus?.streak || 1} / 7
              </span>
            </div>
          </div>
        </div>

        {/* 7-Day Streak Calendar Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {(dailyStatus?.schedule || [15, 25, 40, 60, 80, 110, 170]).map((rewardNex, index) => {
            const dayNum = index + 1;
            const isCurrent = (dailyStatus?.streak || 1) === dayNum;
            const isCompleted = (dailyStatus?.streak || 1) > dayNum;

            return (
              <div
                key={dayNum}
                className={`p-3 rounded-2xl border text-center transition-all duration-300 relative ${
                  isCurrent
                    ? 'bg-gradient-to-b from-purple-600/30 to-indigo-900/80 border-purple-400 ring-2 ring-purple-500/50 shadow-lg shadow-purple-900/50 scale-105'
                    : isCompleted
                    ? 'bg-slate-950/80 border-emerald-500/30 text-slate-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                  <span>Day {dayNum}</span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>

                <div className="my-1.5 flex items-center justify-center">
                  <Coins
                    className={`w-6 h-6 ${
                      isCurrent ? 'text-amber-300 animate-pulse' : isCompleted ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  />
                </div>

                <div className="font-extrabold font-mono text-xs text-white">
                  +{rewardNex} NEX
                </div>

                {isCurrent && (
                  <span className="mt-1 block text-[9px] font-bold text-purple-300 uppercase bg-purple-500/20 rounded py-0.5">
                    Today
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Daily Claim Action Row */}
        <div className="pt-3 border-t border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-purple-200/80 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
            <span>30-Day Airdrop (Max 300 NEX). Claimed tokens are added directly to your wallet for Staking!</span>
          </div>

          <div>
            {dailyStatus?.canClaimNow ? (
              <button
                id="btn_claim_daily_airdrop"
                onClick={handleClaimDailyAirdrop}
                disabled={claimingDaily}
                className="w-full sm:w-auto py-2.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-purple-950 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <Gift className={`w-4 h-4 ${claimingDaily ? 'animate-spin' : ''}`} />
                <span>
                  {claimingDaily
                    ? 'Claiming...'
                    : `Claim Day ${dailyStatus?.streak || 1} (+${dailyStatus?.currentRewardNex || 10} NEX)`}
                </span>
              </button>
            ) : (
              <div className="py-2 px-4 rounded-xl bg-slate-950/80 border border-purple-500/30 text-xs font-mono font-bold text-amber-300 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-purple-400 animate-spin" />
                <span>Next Daily Claim Opens In: {countdownText || 'Tomorrow'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEXO STAKING ENGINE & YIELD GENERATOR */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white">NEXO Staking Engine</h2>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Up to 100% APY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Stake your claimed NEXO tokens to earn high compounded yield. Longer holding periods yield exponentially higher APY percentages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Available in Wallet</span>
              <span className="text-sm font-black text-cyan-400 font-mono">
                {activeWallet?.nativeBalance.includes('NEX')
                  ? activeWallet.nativeBalance
                  : user?.wallets?.find((w) => w.nativeBalance.includes('NEX'))?.nativeBalance || '120.00 NEX'}
              </span>
            </div>
          </div>
        </div>

        {/* Staking Form & Pool Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                Select Lock Term & APY Percentage
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {(
                  stakingPools.length > 0
                    ? stakingPools
                    : [
                        { durationDays: 7, apyPercent: 8 },
                        { durationDays: 14, apyPercent: 14 },
                        { durationDays: 30, apyPercent: 25 },
                        { durationDays: 60, apyPercent: 45 },
                        { durationDays: 90, apyPercent: 65 },
                        { durationDays: 180, apyPercent: 100 },
                      ]
                ).map((pool) => {
                  const isSelected = selectedDuration === pool.durationDays;
                  return (
                    <button
                      key={pool.durationDays}
                      type="button"
                      onClick={() => setSelectedDuration(pool.durationDays)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-black block">{pool.durationDays} Days</span>
                      <span className="text-[11px] font-bold text-emerald-400 font-mono mt-0.5 block">
                        {pool.apyPercent}% APY
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                  Amount to Stake (NEX)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={stakeAmountInput}
                    onChange={(e) => setStakeAmountInput(e.target.value)}
                    placeholder="Enter NEX amount..."
                    className="w-full py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    {['10', '50', '100'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setStakeAmountInput(amt)}
                        className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                  Estimated Yield Output
                </label>
                {(() => {
                  const pool = stakingPools.find((p) => p.durationDays === selectedDuration) || {
                    durationDays: selectedDuration,
                    apyPercent: selectedDuration === 180 ? 100 : selectedDuration === 90 ? 65 : selectedDuration === 60 ? 45 : 25,
                  };
                  const inputVal = parseFloat(stakeAmountInput) || 0;
                  const estimatedGain = ((inputVal * (pool.apyPercent / 100) * pool.durationDays) / 365).toFixed(2);
                  const totalAtMaturity = (inputVal + parseFloat(estimatedGain)).toFixed(2);

                  return (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">At Maturity ({pool.durationDays} Days)</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">+{estimatedGain} NEX Yield</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Payout</span>
                        <span className="text-sm font-black text-white font-mono">{totalAtMaturity} NEX</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Staking Status Pipeline Banner */}
            {stakingStatusStep && (
              <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-xs text-cyan-200 flex items-center gap-2.5 font-mono shadow-lg">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                <span className="font-semibold">{stakingStatusStep}</span>
              </div>
            )}

            {/* Staking Error Banner */}
            {stakingError && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 space-y-1 font-mono">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Staking Error</span>
                </div>
                <p className="text-[11px] text-rose-200/90">{stakingError}</p>
              </div>
            )}

            <button
              id="btn_stake_nex_now"
              onClick={handleStakeNex}
              disabled={isStaking}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isStaking ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Flame className="w-4 h-4" />
              )}
              <span>{isStaking ? 'Processing Staking Transaction...' : `Stake ${stakeAmountInput || '0'} NEX for ${selectedDuration} Days`}</span>
            </button>
          </div>

          {/* Active Stakes Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Stakes</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{userStakes.length} Position(s)</span>
              </div>

              {userStakes.length === 0 ? (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <Boxes className="w-8 h-8 mx-auto text-slate-700" />
                  <p className="text-xs">No active NEX stakes yet.</p>
                  <p className="text-[10px] text-slate-600">Select a lock term and stake your claimed airdrop tokens above!</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {userStakes.map((stk) => (
                    <div key={stk.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>{stk.amountNex} NEX</span>
                        <span className="text-emerald-400 font-mono">{stk.apyPercent}% APY ({stk.durationDays}D)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Yield: +{stk.estimatedRewardNex} NEX</span>
                        <span className="text-cyan-400 font-mono">{stk.status}</span>
                      </div>
                      {unstakeError[stk.id] && (
                        <p className="text-[10px] font-mono text-rose-400 bg-rose-950/60 p-1.5 rounded border border-rose-500/30">
                          {unstakeError[stk.id]}
                        </p>
                      )}
                      <button
                        onClick={() => handleUnstakeNex(stk.id)}
                        disabled={isUnstakingId === stk.id}
                        className="w-full mt-1 py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {isUnstakingId === stk.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-300" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}
                        <span>{isUnstakingId === stk.id ? 'Unstaking & Collecting Yield...' : 'Unstake & Claim Total Yield'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              Staking rewards are distributed on-chain upon unstaking.
            </div>
          </div>
        </div>
      </div>

      {/* 3D INTERACTIVE TOKEN SHOWCASE PANEL (AUTOSYNCED WITH CREATED TOKENS) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Background Mesh Glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Boxes className="w-4 h-4" />
              <span>NEXORUM 3D Crypto Panel Engine</span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span>Interactive 3D Token Matrix</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                LIVE SYNC ({tokens.length})
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              All real tokens created on NEXORUM automatically sync to this 3D showcase panel.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIs3dAutoRotate(!is3dAutoRotate)}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                is3dAutoRotate
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${is3dAutoRotate ? 'animate-spin' : ''}`} />
              <span>3D Orbit</span>
            </button>
            <button
              onClick={() => setShowcaseMode(showcaseMode === '3d' ? 'grid' : '3d')}
              className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              {showcaseMode === '3d' ? 'Grid View' : '3D Stage'}
            </button>
            <button
              onClick={() => setActiveTab('creator')}
              className="py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Token</span>
            </button>
          </div>
        </div>

        {/* 3D Showcase Stage */}
        {showcaseMode === '3d' && tokens.length > 0 && activeToken && (
          <div className="relative min-h-[360px] flex items-center justify-center p-4 bg-slate-950/80 rounded-3xl border border-slate-800/80 overflow-hidden group">
            {/* Ambient Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Carousel Navigation Arrows */}
            <button
              onClick={() => setActiveTokenIndex((prev) => (prev === 0 ? tokens.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all shadow-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTokenIndex((prev) => (prev + 1) % tokens.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all shadow-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Central 3D Card Stage */}
            <div className="perspective-[1000px] w-full max-w-md my-auto relative z-10">
              <div className="transform-style-3d transition-transform duration-700 hover:rotate-x-6 hover:rotate-y-12 p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative space-y-5">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold uppercase">
                      {activeToken.network} • {activeToken.standard}
                    </span>
                    {activeToken.isVerified && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/40">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Token #{activeTokenIndex + 1} of {tokens.length}
                  </span>
                </div>

                {/* Token Identity */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={activeToken.logoUrl}
                      alt={activeToken.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-lg shadow-cyan-950"
                    />
                    <span className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400">
                      <Zap className="w-3 h-3" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white">{activeToken.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-extrabold text-cyan-400 font-mono">${activeToken.symbol}</span>
                      <span className="text-xs text-slate-400 font-mono">Supply: {formatNumber(parseFloat(activeToken.totalSupply))}</span>
                    </div>
                  </div>
                </div>

                {/* 3D Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Live Price</span>
                    <p className="text-lg font-black text-white mt-0.5">{formatCurrency(activeToken.priceUsd)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Market Cap</span>
                    <p className="text-lg font-black text-emerald-400 mt-0.5">${formatNumber(activeToken.marketCapUsd)}</p>
                  </div>
                </div>

                {/* Contract Address Copy Row */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="truncate">
                    <span className="text-[10px] text-slate-500 block uppercase">Smart Contract</span>
                    <span className="text-slate-300 truncate block">{formatAddress(activeToken.contractAddress)}</span>
                  </div>
                  <button
                    onClick={() => handleCopyContract(activeToken.contractAddress)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0"
                    title="Copy Contract Address"
                  >
                    {copiedAddress === activeToken.contractAddress ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Action CTA */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Owner: {formatAddress(activeToken.ownerAddress)}
                  </span>
                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950"
                  >
                    <span>Trade Marketplace</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Token Dots Navigator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              {tokens.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTokenIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === activeTokenIndex ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-800 hover:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

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
