import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowDownUp,
  Settings,
  RefreshCw,
  Zap,
  CheckCircle2,
  ChevronDown,
  Info,
  ShieldCheck,
  Wallet,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  Flame,
  Gauge,
  Clock,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useNotifications } from '../context/NotificationContext';
import { formatCurrency, formatNumber } from '../lib/utils';
import { GasPriceD3Chart } from './GasPriceD3Chart';

export interface SwapTokenOption {
  symbol: string;
  name: string;
  priceUsd: number;
  iconBg: string;
  badge: string;
  decimals: number;
  balance: number;
}

export type GasSpeedTier = 'low' | 'medium' | 'high';

export interface GasFeeEstimate {
  tier: GasSpeedTier;
  label: string;
  gwei: number;
  costUsd: number;
  estimatedSeconds: number;
  nativeFeeText: string;
}

const SUPPORTED_SWAP_TOKENS: SwapTokenOption[] = [
  { symbol: 'NEX', name: 'NEXORUM Native', priceUsd: 0.085, iconBg: 'bg-gradient-to-tr from-cyan-500 to-blue-600', badge: 'L1 Native', decimals: 18, balance: 12500.0 },
  { symbol: 'ETH', name: 'Ethereum', priceUsd: 3412.65, iconBg: 'bg-gradient-to-tr from-indigo-500 to-purple-600', badge: 'EVM', decimals: 18, balance: 2.45 },
  { symbol: 'SOL', name: 'Solana', priceUsd: 145.32, iconBg: 'bg-gradient-to-tr from-purple-500 to-emerald-500', badge: 'Solana', decimals: 9, balance: 18.5 },
  { symbol: 'BNB', name: 'BNB Chain', priceUsd: 580.4, iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-600', badge: 'BSC', decimals: 18, balance: 1.2 },
  { symbol: 'TON', name: 'TON Network', priceUsd: 6.85, iconBg: 'bg-gradient-to-tr from-blue-500 to-cyan-400', badge: 'TON', decimals: 9, balance: 420.0 },
  { symbol: 'USDT', name: 'Tether USD', priceUsd: 1.0, iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-600', badge: 'Stable', decimals: 6, balance: 1500.0 },
  { symbol: 'USDC', name: 'USD Coin', priceUsd: 1.0, iconBg: 'bg-gradient-to-tr from-blue-600 to-cyan-500', badge: 'Stable', decimals: 6, balance: 850.0 },
  { symbol: 'WBTC', name: 'Wrapped BTC', priceUsd: 67430.0, iconBg: 'bg-gradient-to-tr from-amber-600 to-orange-500', badge: 'Bitcoin', decimals: 8, balance: 0.045 },
];

export const TokenSwap: React.FC = () => {
  const { activeWallet, openWalletModal } = useWallet();
  const { addToast } = useNotifications();

  // Selected Tokens
  const [fromToken, setFromToken] = useState<SwapTokenOption>(SUPPORTED_SWAP_TOKENS[1]); // ETH
  const [toToken, setToToken] = useState<SwapTokenOption>(SUPPORTED_SWAP_TOKENS[0]); // NEX

  // Amounts
  const [fromAmount, setFromAmount] = useState<string>('0.5');
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5%
  const [showSettings, setShowSettings] = useState(false);
  const [customSlippageInput, setCustomSlippageInput] = useState('');

  // Gas Fee Estimator States
  const [selectedGasTier, setSelectedGasTier] = useState<GasSpeedTier>('medium');
  const [gasBaseGwei, setGasBaseGwei] = useState<number>(16);
  const [isUpdatingGas, setIsUpdatingGas] = useState<boolean>(false);

  // Dropdown states
  const [selectingTarget, setSelectingTarget] = useState<'from' | 'to' | null>(null);

  // Execution states
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStepText, setSwapStepText] = useState<string | null>(null);

  // Real-time gas price fluctuation ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdatingGas(true);
      setGasBaseGwei((prev) => {
        const delta = (Math.random() - 0.5) * 2;
        return Math.max(10, Math.min(45, parseFloat((prev + delta).toFixed(1))));
      });
      setTimeout(() => setIsUpdatingGas(false), 600);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Compute low, medium, high gas estimates dynamically
  const gasEstimates = useMemo<Record<GasSpeedTier, GasFeeEstimate>>(() => {
    // Network multiplier based on badge/symbol
    const isEth = fromToken.symbol === 'ETH' || fromToken.symbol === 'WBTC';
    const isSol = fromToken.symbol === 'SOL';
    const isTon = fromToken.symbol === 'TON';

    const baseMultiplier = isSol ? 0.05 : isTon ? 0.08 : isEth ? 1.0 : 0.35;

    const lowGwei = Math.round(gasBaseGwei * 0.75);
    const medGwei = Math.round(gasBaseGwei * 1.0);
    const highGwei = Math.round(gasBaseGwei * 1.45);

    const lowCost = Math.max(0.01, parseFloat((0.02 * baseMultiplier * (lowGwei / 15)).toFixed(3)));
    const medCost = Math.max(0.03, parseFloat((0.04 * baseMultiplier * (medGwei / 15)).toFixed(3)));
    const highCost = Math.max(0.07, parseFloat((0.09 * baseMultiplier * (highGwei / 15)).toFixed(3)));

    return {
      low: {
        tier: 'low',
        label: 'Low (Eco)',
        gwei: lowGwei,
        costUsd: lowCost,
        estimatedSeconds: isSol ? 1 : isTon ? 2 : 25,
        nativeFeeText: `${lowGwei} Gwei`,
      },
      medium: {
        tier: 'medium',
        label: 'Medium (Standard)',
        gwei: medGwei,
        costUsd: medCost,
        estimatedSeconds: isSol ? 0.5 : isTon ? 1 : 12,
        nativeFeeText: `${medGwei} Gwei`,
      },
      high: {
        tier: 'high',
        label: 'High (Priority)',
        gwei: highGwei,
        costUsd: highCost,
        estimatedSeconds: isSol ? 0.2 : isTon ? 0.5 : 4,
        nativeFeeText: `${highGwei} Gwei`,
      },
    };
  }, [gasBaseGwei, fromToken]);

  const activeGasEstimate = gasEstimates[selectedGasTier];

  // Calculate receive amount automatically
  const fromNum = parseFloat(fromAmount) || 0;
  const fromValueUsd = fromNum * fromToken.priceUsd;

  const calculatedToAmount = useMemo(() => {
    if (fromNum <= 0 || toToken.priceUsd <= 0) return 0;
    return (fromNum * fromToken.priceUsd) / toToken.priceUsd;
  }, [fromNum, fromToken, toToken]);

  const toValueUsd = calculatedToAmount * toToken.priceUsd;

  // Rate ratio calculation
  const exchangeRate = useMemo(() => {
    if (!toToken.priceUsd) return 0;
    return fromToken.priceUsd / toToken.priceUsd;
  }, [fromToken, toToken]);

  // Flip pay <-> receive tokens
  const handleFlipTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    if (calculatedToAmount > 0) {
      setFromAmount(calculatedToAmount.toFixed(4));
    }
  };

  // Quick preset shortcuts (25%, 50%, 75%, MAX)
  const handleApplyPercentage = (pct: number) => {
    const amt = (fromToken.balance * pct) / 100;
    setFromAmount(amt > 0 ? amt.toFixed(4) : '0');
  };

  // Refresh gas fee manually
  const refreshGasFee = () => {
    setIsUpdatingGas(true);
    setGasBaseGwei((prev) => parseFloat((12 + Math.random() * 25).toFixed(1)));
    setTimeout(() => setIsUpdatingGas(false), 500);
  };

  // Execute Swap workflow
  const handleExecuteSwap = async () => {
    if (!activeWallet) {
      openWalletModal();
      return;
    }

    if (fromNum <= 0) {
      addToast('Invalid Amount', 'Please enter a valid amount to swap.', 'warning');
      return;
    }

    if (fromNum > fromToken.balance) {
      addToast('Insufficient Balance', `You only have ${fromToken.balance} ${fromToken.symbol}.`, 'error');
      return;
    }

    setIsSwapping(true);
    setSwapStepText(`Estimating Gas Fee (${activeGasEstimate.label}: ${activeGasEstimate.nativeFeeText})...`);

    try {
      await new Promise((r) => setTimeout(r, 800));
      setSwapStepText(`Broadcasting Transaction (${activeGasEstimate.nativeFeeText} / ${formatCurrency(activeGasEstimate.costUsd)})...`);

      await new Promise((r) => setTimeout(r, 1000));
      setSwapStepText(`Routing ${fromToken.symbol} ➔ ${toToken.symbol} On-Chain...`);

      await new Promise((r) => setTimeout(r, 1000));

      addToast(
        `Swap Complete! 🎉`,
        `Swapped ${fromAmount} ${fromToken.symbol} for ${calculatedToAmount.toFixed(
          4
        )} ${toToken.symbol} using ${activeGasEstimate.label} gas (${formatCurrency(activeGasEstimate.costUsd)}).`,
        'success'
      );

      // Reset / deduct simulated balance locally for visual feedback
      setFromToken((prev) => ({ ...prev, balance: Math.max(0, prev.balance - fromNum) }));
      setToToken((prev) => ({ ...prev, balance: prev.balance + calculatedToAmount }));

      setFromAmount('');
    } catch (err: any) {
      addToast('Swap Execution Failed', err?.message || 'Transaction reverted on-chain.', 'error');
    } finally {
      setIsSwapping(false);
      setSwapStepText(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden space-y-4 sm:space-y-5">
      {/* Background Decorator */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 relative z-10 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <ArrowDownUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white">NEXORUM Instant Swap</h2>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Zero Slippage Router
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cross-chain automated liquidity pool with real-time gas fee estimator.
            </p>
          </div>
        </div>

        {/* Settings Toggle & Refresh */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border text-slate-400 hover:text-white transition-all ${
              showSettings ? 'bg-slate-800 border-cyan-500/50 text-cyan-400' : 'bg-slate-950 border-slate-800'
            }`}
            title="Slippage & Router Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slippage Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 overflow-hidden text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                Slippage Tolerance
              </span>
              <span className="font-mono font-bold text-cyan-300">{slippage}%</span>
            </div>

            <div className="flex items-center gap-2">
              {[0.1, 0.5, 1.0, 2.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setSlippage(val);
                    setCustomSlippageInput('');
                  }}
                  className={`py-1.5 px-3 rounded-xl border font-mono font-bold transition-all ${
                    slippage === val && !customSlippageInput
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {val}%
                </button>
              ))}

              <div className="relative flex-1">
                <input
                  type="number"
                  placeholder="Custom"
                  value={customSlippageInput}
                  onChange={(e) => {
                    setCustomSlippageInput(e.target.value);
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed) && parsed >= 0.05 && parsed <= 15) {
                      setSlippage(parsed);
                    }
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-2 top-2 text-slate-500 font-mono text-[10px]">%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN SWAP CARDS */}
      <div className="space-y-2 relative">
        {/* PAY CARD */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700/80 transition-all space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold">You Pay</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400">
                Bal: <span className="text-slate-200 font-bold">{fromToken.balance}</span> {fromToken.symbol}
              </span>
              {/* Quick Percent Buttons */}
              <div className="flex items-center gap-1">
                {[25, 50, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleApplyPercentage(pct)}
                    className="py-0.5 px-1.5 rounded bg-slate-900 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 transition-colors"
                  >
                    {pct === 100 ? 'MAX' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-black font-mono text-white focus:outline-none"
            />

            {/* Token Selector Trigger */}
            <button
              type="button"
              onClick={() => setSelectingTarget('from')}
              className="py-2 px-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-bold text-xs flex items-center gap-2.5 shrink-0 transition-all shadow-md hover:border-slate-700"
            >
              <div
                className={`w-6 h-6 rounded-full ${fromToken.iconBg} flex items-center justify-center text-[10px] font-black text-white shadow`}
              >
                {fromToken.symbol.slice(0, 3)}
              </div>
              <div className="text-left">
                <span className="font-bold text-sm block leading-none">{fromToken.symbol}</span>
                <span className="text-[9px] text-slate-400 block font-mono">{fromToken.badge}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>≈ {formatCurrency(fromValueUsd)} USD</span>
            {fromNum > fromToken.balance && (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Exceeds Balance
              </span>
            )}
          </div>
        </div>

        {/* FLIP BUTTON */}
        <div className="flex justify-center -my-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={handleFlipTokens}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-cyan-400 hover:text-white shadow-xl hover:bg-cyan-950 transition-colors cursor-pointer"
            title="Switch Swap Directions"
          >
            <ArrowDownUp className="w-4 h-4" />
          </motion.button>
        </div>

        {/* RECEIVE CARD */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700/80 transition-all space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold">You Receive (Estimated)</span>
            <span className="font-mono text-slate-400">
              Bal: <span className="text-slate-200 font-bold">{toToken.balance}</span> {toToken.symbol}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-2xl font-black font-mono text-emerald-400 select-all">
              {calculatedToAmount > 0 ? calculatedToAmount.toFixed(4) : '0.0'}
            </div>

            {/* Token Selector Trigger */}
            <button
              type="button"
              onClick={() => setSelectingTarget('to')}
              className="py-2 px-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-bold text-xs flex items-center gap-2.5 shrink-0 transition-all shadow-md hover:border-slate-700"
            >
              <div
                className={`w-6 h-6 rounded-full ${toToken.iconBg} flex items-center justify-center text-[10px] font-black text-white shadow`}
              >
                {toToken.symbol.slice(0, 3)}
              </div>
              <div className="text-left">
                <span className="font-bold text-sm block leading-none">{toToken.symbol}</span>
                <span className="text-[9px] text-slate-400 block font-mono">{toToken.badge}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>≈ {formatCurrency(toValueUsd)} USD</span>
            <span>Rate: 1 {fromToken.symbol} = {exchangeRate.toFixed(4)} {toToken.symbol}</span>
          </div>
        </div>
      </div>

      {/* REAL-TIME GAS FEE ESTIMATOR PANEL */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Real-Time Gas Fee Estimator</h3>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              <span className={`w-1.5 h-1.5 rounded-full ${isUpdatingGas ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              {gasBaseGwei} Gwei
            </span>
          </div>
          <button
            type="button"
            onClick={refreshGasFee}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Refresh Gas Fee Rates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingGas ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Gas Speed Selector Cards (Low, Medium, High) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as GasSpeedTier[]).map((tierKey) => {
            const est = gasEstimates[tierKey];
            const isSelected = selectedGasTier === tierKey;

            return (
              <button
                key={tierKey}
                type="button"
                onClick={() => setSelectedGasTier(tierKey)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-400 text-white ring-1 ring-cyan-400/50 shadow-lg'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className={tierKey === 'low' ? 'text-emerald-400' : tierKey === 'medium' ? 'text-cyan-300' : 'text-amber-400'}>
                    {tierKey === 'low' ? '🌱 Eco (Low)' : tierKey === 'medium' ? '⚡ Standard' : '🚀 Fast (High)'}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>

                <div className="mt-1 font-mono">
                  <span className="text-sm font-black text-white block">
                    {formatCurrency(est.costUsd)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{est.nativeFeeText}</span>
                </div>

                <div className="mt-1 text-[9.5px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>~{est.estimatedSeconds}s confirmation</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Real-Time D3 Gas Price Trend Line Chart (Last 60 Minutes) */}
        <GasPriceD3Chart
          currentGwei={gasBaseGwei}
          selectedTier={selectedGasTier}
          isUpdating={isUpdatingGas}
        />
      </div>

      {/* ROUTE & IMPACT SUMMARY */}
      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span>Price Impact:</span>
          <span className="text-emerald-400 font-bold">&lt; 0.05%</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Selected Network Gas Fee ({activeGasEstimate.label}):</span>
          <span className="text-cyan-300 font-bold flex items-center gap-1">
            {formatCurrency(activeGasEstimate.costUsd)} ({activeGasEstimate.nativeFeeText})
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Minimum Received ({slippage}%):</span>
          <span className="text-slate-200 font-bold">
            {(calculatedToAmount * (1 - slippage / 100)).toFixed(4)} {toToken.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Smart Route:</span>
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <Zap className="w-3 h-3" /> NEXORUM Liquidity Router
          </span>
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div>
        {!activeWallet ? (
          <button
            type="button"
            onClick={openWalletModal}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-950 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet to Swap</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleExecuteSwap}
            disabled={isSwapping || fromNum <= 0 || fromNum > fromToken.balance}
            className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
              isSwapping
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 cursor-wait'
                : fromNum <= 0
                ? 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
                : fromNum > fromToken.balance
                ? 'bg-rose-950 text-rose-300 border border-rose-800/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white shadow-emerald-950 hover:scale-[1.01]'
            }`}
          >
            {isSwapping ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                <span>{swapStepText || 'Processing Swap...'}</span>
              </>
            ) : fromNum <= 0 ? (
              <span>Enter an Amount to Swap</span>
            ) : fromNum > fromToken.balance ? (
              <span>Insufficient {fromToken.symbol} Balance</span>
            ) : (
              <>
                <Zap className="w-5 h-5 text-amber-300" />
                <span>
                  Swap {fromToken.symbol} ➔ {toToken.symbol} ({formatCurrency(activeGasEstimate.costUsd)} Fee)
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* TOKEN SELECTOR MODAL */}
      <AnimatePresence>
        {selectingTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setSelectingTarget(null)}
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.35}
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                if (info.offset.y > 70 || info.velocity.y > 250) {
                  setSelectingTarget(null);
                }
              }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 cursor-grab active:cursor-grabbing relative"
            >
              {/* Drag handle for mobile */}
              <div className="w-full flex justify-center pt-0 pb-1 touch-none select-none">
                <div className="w-12 h-1.5 bg-slate-700/80 hover:bg-slate-500 rounded-full transition-colors" />
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Select a Token</h3>
                <button
                  type="button"
                  onClick={() => setSelectingTarget(null)}
                  className="text-slate-400 hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {SUPPORTED_SWAP_TOKENS.map((token) => {
                  const isSelected =
                    selectingTarget === 'from'
                      ? fromToken.symbol === token.symbol
                      : toToken.symbol === token.symbol;

                  return (
                    <button
                      key={token.symbol}
                      type="button"
                      onClick={() => {
                        if (selectingTarget === 'from') {
                          if (toToken.symbol === token.symbol) handleFlipTokens();
                          else setFromToken(token);
                        } else {
                          if (fromToken.symbol === token.symbol) handleFlipTokens();
                          else setToToken(token);
                        }
                        setSelectingTarget(null);
                      }}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-white ring-1 ring-cyan-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-2xl ${token.iconBg} flex items-center justify-center font-black text-xs text-white shadow`}
                        >
                          {token.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{token.symbol}</span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {token.badge}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">{token.name}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-slate-200 block">
                          {token.balance} {token.symbol}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatCurrency(token.priceUsd)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
