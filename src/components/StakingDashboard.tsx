import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Lock,
  Unlock,
  Coins,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  RefreshCw,
  Gift,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useNotifications } from '../context/NotificationContext';
import { formatCurrency } from '../lib/utils';

export const StakingDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeWallet, syncOnChainBalances } = useWallet();
  const { addToast } = useNotifications();

  const [loading, setLoading] = useState<boolean>(true);
  const [stakingData, setStakingData] = useState<any>(null);

  // Form state
  const [selectedPoolId, setSelectedPoolId] = useState<string>('pool_90d');
  const [stakeAmount, setStakeAmount] = useState<string>('500');
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimingStakeId, setClaimingStakeId] = useState<string | null>(null);
  const [unstakingStakeId, setUnstakingStakeId] = useState<string | null>(null);

  const fetchStakingData = async () => {
    try {
      const res = await api.getStakingPositions(user?.id);
      if (res && res.success) {
        setStakingData(res);
      }
    } catch (err) {
      console.error('Failed to fetch staking positions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStakingData();
  }, [user?.id]);

  const pools = stakingData?.pools || [
    {
      id: 'pool_flex',
      name: 'Flexible Staking Vault',
      lockDays: 0,
      apyPercent: 8.5,
      multiplier: '1.0x',
      minStake: 10,
      contractAddress: '0xStaking_7780_Flex_Vault',
      description: 'Zero lock period. Withdraw anytime with real-time interest compounding.',
      badge: 'Flexible',
    },
    {
      id: 'pool_30d',
      name: '30-Day High Yield Lock',
      lockDays: 30,
      apyPercent: 18.2,
      multiplier: '1.25x',
      minStake: 50,
      contractAddress: '0xStaking_7780_Vault_30D',
      description: '30-Day Smart Contract vault with 1.25x yield boost.',
      badge: 'Popular',
    },
    {
      id: 'pool_90d',
      name: '90-Day Quantum Multiplier',
      lockDays: 90,
      apyPercent: 36.5,
      multiplier: '1.8x',
      minStake: 100,
      contractAddress: '0xStaking_7780_Vault_90D',
      description: 'High APY 90-day lock with automated daily auto-compounding.',
      badge: 'High APY',
    },
    {
      id: 'pool_365d',
      name: '365-Day Genesis Sovereign Lock',
      lockDays: 365,
      apyPercent: 85.0,
      multiplier: '3.5x',
      minStake: 500,
      contractAddress: '0xStaking_7780_Genesis_365D',
      description: 'Maximum yield 1-year lock with protocol governance voting rights & VIP Airdrop priority.',
      badge: 'Max Yield',
    },
  ];

  const selectedPool = pools.find((p: any) => p.id === selectedPoolId) || pools[2];

  const getAvailableWalletNex = () => {
    if (activeWallet) {
      const balanceStr = activeWallet.nativeBalance || '1000.00 NEX';
      const num = parseFloat(balanceStr.replace(/[^0-9.]/g, '')) || 1000;
      return num;
    }
    return 1000;
  };

  const handleApplyPreset = (pct: string) => {
    const total = getAvailableWalletNex();
    let mult = 1.0;
    if (pct === '25%') mult = 0.25;
    else if (pct === '50%') mult = 0.50;
    else if (pct === '75%') mult = 0.75;
    else if (pct === 'MAX') mult = 1.0;

    setStakeAmount((total * mult).toFixed(2));
  };

  const calculateCalculatedRewards = () => {
    const numAmount = parseFloat(stakeAmount) || 0;
    const priceUsd = stakingData?.priceUsd || 12.45;
    const apy = selectedPool.apyPercent;
    const days = selectedPool.lockDays || 365;

    const yearlyYieldNex = numAmount * (apy / 100);
    const periodYieldNex = yearlyYieldNex * (days / 365);
    const dailyYieldNex = yearlyYieldNex / 365;

    return {
      numAmount,
      totalUsd: (numAmount * priceUsd).toFixed(2),
      yearlyYieldNex: yearlyYieldNex.toFixed(2),
      periodYieldNex: (days > 0 ? periodYieldNex : yearlyYieldNex).toFixed(2),
      periodYieldUsd: ((days > 0 ? periodYieldNex : yearlyYieldNex) * priceUsd).toFixed(2),
      dailyYieldNex: dailyYieldNex.toFixed(2),
      dailyYieldUsd: (dailyYieldNex * priceUsd).toFixed(2),
    };
  };

  const handleLockTokens = async () => {
    const num = parseFloat(stakeAmount);
    if (!num || num <= 0) return;

    setIsStaking(true);
    try {
      const res = await api.lockStakingTokens({
        poolId: selectedPoolId,
        amountNex: stakeAmount,
        userId: user?.id,
      });

      if (res && res.success) {
        addToast(
          'Tokens Locked in Smart Contract!',
          res.message || `Successfully locked ${stakeAmount} NEX tokens in ${selectedPool.name}`,
          'success'
        );
        fetchStakingData();
        syncOnChainBalances();
      }
    } catch (err: any) {
      console.error(err);
      addToast('Staking Execution Failed', err?.message || 'Could not lock tokens.', 'error');
    } finally {
      setIsStaking(false);
    }
  };

  const handleClaimAllRewards = async (stakeId?: string) => {
    if (stakeId) setClaimingStakeId(stakeId);
    else setIsClaiming(true);

    try {
      const res = await api.claimStakingRewards({ stakeId, userId: user?.id });
      if (res && res.success) {
        addToast(
          'Yield Claimed Successfully!',
          res.message || `Claimed ${res.claimedAmount} NEX staking yield to wallet`,
          'success'
        );
        fetchStakingData();
        syncOnChainBalances();
      }
    } catch (err: any) {
      console.error(err);
      addToast('Claim Failed', err?.message || 'Failed to claim rewards', 'error');
    } finally {
      setIsClaiming(false);
      setClaimingStakeId(null);
    }
  };

  const handleUnstakePosition = async (stakeId: string) => {
    setUnstakingStakeId(stakeId);
    try {
      const res = await api.unstakePosition({ stakeId, userId: user?.id });
      if (res && res.success) {
        addToast(
          'Contract Unstaked',
          res.message || 'Successfully unstaked tokens and returned to wallet',
          'success'
        );
        fetchStakingData();
        syncOnChainBalances();
      }
    } catch (err: any) {
      console.error(err);
      addToast('Unstake Failed', err?.message || 'Failed to unstake contract', 'error');
    } finally {
      setUnstakingStakeId(null);
    }
  };

  const calcMetrics = calculateCalculatedRewards();
  const stakesList = stakingData?.stakes || [];
  const activeStakes = stakesList.filter((s: any) => s.status === 'ACTIVE');

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">NEXORUM High-Yield Staking Dashboard</h2>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">
                Up to 85% APY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Lock NEX tokens in non-custodial Smart Contract Vaults to earn automated compound yield & protocol rewards.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleClaimAllRewards()}
          disabled={isClaiming}
          className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Gift className={`w-4 h-4 ${isClaiming ? 'animate-bounce' : ''}`} />
          <span>{isClaiming ? 'Claiming Yield...' : `Claim All Yield (${(stakingData?.totalEarnedNex || 142.8).toFixed(2)} NEX)`}</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Staked (NEX)</span>
          <div className="text-xl font-black text-white font-mono flex items-baseline gap-1.5">
            <span>{(stakingData?.totalStakedNex || 1550).toLocaleString()}</span>
            <span className="text-xs text-cyan-400 font-sans">NEX</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            ≈ {formatCurrency(stakingData?.totalStakedUsd || 19297.50)} USD
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Yield Earned</span>
          <div className="text-xl font-black text-emerald-400 font-mono flex items-baseline gap-1.5">
            <span>+{(stakingData?.totalEarnedNex || 142.8).toFixed(2)}</span>
            <span className="text-xs text-emerald-300 font-sans">NEX</span>
          </div>
          <p className="text-[11px] text-emerald-400/80 font-mono">
            ≈ {formatCurrency(stakingData?.totalEarnedUsd || 1777.86)} USD
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Lock Vaults</span>
          <div className="text-xl font-black text-cyan-300 font-mono flex items-baseline gap-1.5">
            <span>{stakingData?.activeStakesCount || activeStakes.length}</span>
            <span className="text-xs text-slate-400 font-sans">Contracts</span>
          </div>
          <p className="text-[11px] text-cyan-400/80 font-mono">100% On-Chain Protected</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NEX Token Live Price</span>
          <div className="text-xl font-black text-amber-400 font-mono">
            ${(stakingData?.priceUsd || 12.45).toFixed(2)} USD
          </div>
          <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +24.8% (24h)
          </p>
        </div>
      </div>

      {/* Staking Pool Tier Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-cyan-400" />
            <span>Select Staking Vault Tier</span>
          </h3>
          <span className="text-[11px] text-slate-400">Higher lock duration = Higher APY Multiplier</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pools.map((p: any) => {
            const isSelected = selectedPoolId === p.id;
            return (
              <motion.div
                key={p.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedPoolId(p.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/80 to-slate-950 border-cyan-400/80 ring-1 ring-cyan-400/50 shadow-xl shadow-cyan-950/40'
                    : 'bg-slate-950 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {p.badge && (
                  <span
                    className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                      p.id === 'pool_365d'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : p.id === 'pool_90d'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {p.badge}
                  </span>
                )}

                <div className="space-y-2">
                  <span className="text-xs font-bold text-white block pr-14">{p.name}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-400 font-mono">{p.apyPercent}%</span>
                    <span className="text-xs text-emerald-300 font-bold">APY</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{p.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">Lock: {p.lockDays === 0 ? 'Flexible' : `${p.lockDays} Days`}</span>
                  <span className="text-cyan-400 font-mono font-bold">{p.multiplier} Boost</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Staking & Yield Yield Calculator Box */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Inputs */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">Lock NEX Tokens</span>
              <span className="text-[11px] text-slate-400">Vault: <span className="text-cyan-300 font-semibold">{selectedPool.name}</span></span>
            </div>
            <span className="text-[11px] text-slate-400">
              Wallet Balance: <span className="text-cyan-400 font-mono font-bold">{getAvailableWalletNex().toLocaleString()} NEX</span>
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="Enter NEX amount..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white outline-none focus:border-cyan-500"
              />
              <div className="flex items-center gap-1">
                {['25%', '50%', '75%', 'MAX'].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleApplyPreset(pct)}
                    className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors cursor-pointer"
                  >
                    {pct}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 font-mono px-1">
              <span>USD Value: ${calcMetrics.totalUsd}</span>
              <span>Min Stake: {selectedPool.minStake || 10} NEX</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
            onClick={handleLockTokens}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-950 cursor-pointer disabled:opacity-50"
          >
            <Lock className={`w-4 h-4 ${isStaking ? 'animate-spin' : ''}`} />
            <span>
              {isStaking
                ? 'Executing Smart Contract Lock...'
                : `Lock ${stakeAmount || '0'} NEX for ${selectedPool.lockDays} Days (${selectedPool.apyPercent}% APY)`}
            </span>
          </motion.button>
        </div>

        {/* Right Projected Yield Live Preview */}
        <div className="lg:col-span-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Projected Yield Preview</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              {selectedPool.apyPercent}% Compound APY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Daily Reward</span>
              <div className="font-mono font-bold text-emerald-400 text-sm">
                +{calcMetrics.dailyYieldNex} NEX
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                ≈ ${calcMetrics.dailyYieldUsd} / day
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                {selectedPool.lockDays > 0 ? `${selectedPool.lockDays}-Day Period Yield` : 'Annual Yield'}
              </span>
              <div className="font-mono font-bold text-cyan-300 text-sm">
                +{calcMetrics.periodYieldNex} NEX
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                ≈ ${calcMetrics.periodYieldUsd} total
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/60">
            <div className="flex justify-between">
              <span>Contract Security:</span>
              <span className="text-emerald-400 font-mono font-semibold">Audited (CertiK / OpenZeppelin)</span>
            </div>
            <div className="flex justify-between">
              <span>Early Withdrawal Fee:</span>
              <span className="text-slate-300 font-mono">{selectedPool.lockDays === 0 ? '0%' : '1.5% penalty before maturity'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Staked Positions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Active Staking Contracts & Locked Positions</span>
          </h3>
          <button
            type="button"
            onClick={fetchStakingData}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Refresh Contracts
          </button>
        </div>

        {activeStakes.length > 0 ? (
          <div className="space-y-3">
            {activeStakes.map((stake: any) => {
              const stakedAtDate = new Date(stake.stakedAt || Date.now());
              const maturesAtDate = new Date(stake.maturesAt || Date.now() + 86400000 * 30);
              const now = new Date();
              const totalDays = Math.max(1, stake.durationDays || stake.lockDays || 30);
              const elapsedDays = Math.max(0, Math.min(totalDays, (now.getTime() - stakedAtDate.getTime()) / (1000 * 60 * 60 * 24)));
              const progressPct = Math.min(100, Math.max(5, (elapsedDays / totalDays) * 100));

              return (
                <div
                  key={stake.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{stake.poolName || 'High Yield Vault'}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        {stake.apyPercent || 25}% APY
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        Contract: {stake.contractAddress?.slice(0, 16)}...
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-sans block">Locked Amount</span>
                        <span className="font-bold text-cyan-300">{stake.amountNex || stake.amount || 500} NEX</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-sans block">Accrued Yield</span>
                        <span className="font-bold text-emerald-400">
                          +{(stake.earnedRewardNex || stake.estimatedRewardNex || 12.5).toFixed(2)} NEX
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-sans block">Locked At</span>
                        <span>{stakedAtDate.toLocaleDateString()}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-sans block">Matures At</span>
                        <span>{maturesAtDate.toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Lock Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-sans">
                        <span>Lock Progress</span>
                        <span>{progressPct.toFixed(1)}% ({Math.max(0, Math.ceil(totalDays - elapsedDays))} days remaining)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
                    <button
                      type="button"
                      disabled={claimingStakeId === stake.id}
                      onClick={() => handleClaimAllRewards(stake.id)}
                      className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>{claimingStakeId === stake.id ? 'Claiming...' : 'Claim Yield'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={unstakingStakeId === stake.id}
                      onClick={() => handleUnstakePosition(stake.id)}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{unstakingStakeId === stake.id ? 'Unstaking...' : 'Unstake'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">No active staking contracts found.</p>
            <p className="text-[11px] text-slate-500">Select a vault tier above and lock NEX tokens to begin earning daily interest.</p>
          </div>
        )}
      </div>
    </div>
  );
};
