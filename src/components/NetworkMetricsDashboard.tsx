import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Activity,
  Zap,
  Flame,
  Users,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Gauge,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { formatNumber } from '../lib/utils';

export const NetworkMetricsDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [activeMetricView, setActiveMetricView] = useState<'gas' | 'users' | 'combined'>('combined');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchMetrics = async (tf = timeframe) => {
    setIsRefreshing(true);
    try {
      const res = await api.getNetworkMetrics(tf);
      if (res && res.success) {
        setMetrics(res);
      }
    } catch (err) {
      console.error('Failed to load network metrics:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    fetchMetrics(timeframe);
    const interval = setInterval(() => {
      fetchMetrics(timeframe);
    }, 12000); // Live poll every 12s
    return () => clearInterval(interval);
  }, [timeframe]);

  const summary = metrics?.summary || {
    currentGasGwei: 0.19,
    currentGasUsd: 0.0028,
    averageL1GasGwei: 34.6,
    gasSavingsPct: 99.4,
    activeUsers24h: 168100,
    activeUsersGrowth24h: '+18.4%',
    totalTransactions24h: 4289150,
    averageTps: 3650,
    peakTps: 4780,
    blockTimeMs: 250,
    paymasterSubsidizedUsd: 142850,
  };

  const chartData = metrics?.data || [
    { time: '00:00', gasGwei: 0.22, gasUsd: 0.003, activeUsers: 84200, l1GasGwei: 28.4, tps: 2150 },
    { time: '04:00', gasGwei: 0.15, gasUsd: 0.002, activeUsers: 64500, l1GasGwei: 21.8, tps: 1840 },
    { time: '08:00', gasGwei: 0.28, gasUsd: 0.004, activeUsers: 112400, l1GasGwei: 38.2, tps: 3120 },
    { time: '12:00', gasGwei: 0.31, gasUsd: 0.004, activeUsers: 149200, l1GasGwei: 42.1, tps: 4180 },
    { time: '16:00', gasGwei: 0.33, gasUsd: 0.005, activeUsers: 168100, l1GasGwei: 48.2, tps: 4780 },
    { time: '20:00', gasGwei: 0.21, gasUsd: 0.003, activeUsers: 131500, l1GasGwei: 31.0, tps: 3640 },
  ];

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-cyan-500/40 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md space-y-2 text-xs font-mono z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-300">
            <span className="font-bold">{label}</span>
            <span className="text-[10px] text-cyan-400">NEXORUM Live Data</span>
          </div>

          <div className="space-y-1 text-[11px]">
            {payload.map((entry: any, idx: number) => {
              let formattedVal = entry.value;
              if (entry.dataKey === 'activeUsers') formattedVal = `${(entry.value / 1000).toFixed(1)}k Users`;
              else if (entry.dataKey === 'gasGwei') formattedVal = `${entry.value} Gwei ($0.003)`;
              else if (entry.dataKey === 'l1GasGwei') formattedVal = `${entry.value} Gwei (L1 Standard)`;
              else if (entry.dataKey === 'tps') formattedVal = `${entry.value} TPS`;

              return (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}:
                  </span>
                  <span className="font-bold text-white">{formattedVal}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">NEXORUM Chain Analytics</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live On-Chain
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time gas fee trend analysis, active user growth, and paymaster throughput metrics.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Switcher */}
          <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1">
            {(['24h', '7d', '30d'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Metric View Switcher */}
          <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveMetricView('combined')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeMetricView === 'combined' ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Metrics
            </button>
            <button
              type="button"
              onClick={() => setActiveMetricView('gas')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeMetricView === 'gas' ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gas Trends
            </button>
            <button
              type="button"
              onClick={() => setActiveMetricView('users')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeMetricView === 'users' ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Users
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchMetrics(timeframe)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Refresh on-chain metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Current Gas Fee Card */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Average Gas Fee
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
              -{summary.gasSavingsPct}% vs L1
            </span>
          </div>
          <div className="text-xl font-black text-cyan-300 font-mono flex items-baseline gap-1.5">
            <span>{summary.currentGasGwei} Gwei</span>
            <span className="text-xs text-slate-400 font-sans">(${summary.currentGasUsd})</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Ethereum L1: <span className="text-slate-500 line-through">{summary.averageL1GasGwei} Gwei</span>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" /> Active User Count
            </span>
            <span className="text-emerald-400 font-mono flex items-center gap-0.5 font-bold">
              <TrendingUp className="w-3 h-3" /> {summary.activeUsersGrowth24h}
            </span>
          </div>
          <div className="text-xl font-black text-white font-mono">
            {summary.activeUsers24h.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            24h Unique Active Wallet Addresses
          </div>
        </div>

        {/* Network Throughput Card */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Speed & Throughput
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
              {summary.blockTimeMs}ms Block
            </span>
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono flex items-baseline gap-1.5">
            <span>{summary.averageTps.toLocaleString()} TPS</span>
            <span className="text-xs text-slate-400 font-sans">(Peak {summary.peakTps.toLocaleString()})</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Total 24h Tx: {summary.totalTransactions24h.toLocaleString()}
          </div>
        </div>

        {/* Paymaster Subsidized Gas Card */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Paymaster Subsidy
            </span>
            <span className="text-indigo-400 font-mono font-bold text-[9px]">
              ERC-4337
            </span>
          </div>
          <div className="text-xl font-black text-indigo-300 font-mono">
            ${summary.paymasterSubsidizedUsd.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-400/80 font-mono">
            Saved by users in zero-gas relay batches
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="space-y-4">
        {/* Gas Fee Trend Chart Section */}
        {(activeMetricView === 'combined' || activeMetricView === 'gas') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Gas Fee Trend & Savings Comparison (Gwei)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  NEXORUM Zero-Gas Paymaster vs Standard L1 Ethereum Gas Fees
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-cyan-400" />
                  <span className="text-slate-300">NEXORUM Chain (Gwei)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-600" />
                  <span className="text-slate-400">Standard L1 Gas</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="nexorumGasGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="l1GasGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#475569" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#475569" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="l1GasGwei"
                    name="L1 Standard Gas"
                    stroke="#475569"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#l1GasGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="gasGwei"
                    name="NEXORUM Gas"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#nexorumGasGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Active User Growth & TPS Chart Section */}
        {(activeMetricView === 'combined' || activeMetricView === 'users') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Active Unique Users & Network Throughput (TPS)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Wallet address activity growth synchronized with real-time TPS transactions per second
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-500" />
                  <span className="text-slate-300">Active Users</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-400" />
                  <span className="text-slate-300">Network TPS</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="activeUsers" name="Active Users" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="tps" name="Network TPS" fill="#34d399" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
