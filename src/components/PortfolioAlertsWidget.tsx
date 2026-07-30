import React, { useState } from 'react';
import {
  Bell,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Sliders,
  Volume2,
  VolumeX,
  Play,
  RotateCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications, PortfolioAlertRecord } from '../context/NotificationContext';
import { formatCurrency, timeAgo } from '../lib/utils';

export const PortfolioAlertsWidget: React.FC = () => {
  const {
    portfolioAlertSettings,
    updatePortfolioAlertSettings,
    portfolioAlertsHistory,
    triggerVolatilitySimulation,
    clearAlertsHistory,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'monitor' | 'history' | 'settings'>('monitor');
  const [selectedSimAsset, setSelectedSimAsset] = useState<string>('ETH');

  const THRESHOLD_OPTIONS = [1.0, 2.0, 3.0, 5.0, 10.0];

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Portfolio Volatility Alert Engine</h2>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1.5 border ${
                  portfolioAlertSettings.isEnabled
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    portfolioAlertSettings.isEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                {portfolioAlertSettings.isEnabled ? 'Live Radar Active' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Monitors price swings in your holdings and dispatches real-time push notifications.
            </p>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('monitor')}
              className={`py-1.5 px-3 rounded-lg transition-all ${
                activeTab === 'monitor' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monitor & Test
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-1.5 px-3 rounded-lg transition-all relative ${
                activeTab === 'history' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Alert Log ({portfolioAlertsHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-1.5 px-3 rounded-lg transition-all ${
                activeTab === 'settings' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Thresholds
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MONITOR & TEST SIMULATION */}
      {activeTab === 'monitor' && (
        <div className="space-y-4">
          {/* Active Settings Summary Banner */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400 font-medium">Trigger Threshold:</span>
              <span className="font-extrabold font-mono text-cyan-400 text-sm">
                ±{portfolioAlertSettings.thresholdPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400 font-medium">Sound Alerts:</span>
              <span className="font-bold text-white flex items-center gap-1">
                {portfolioAlertSettings.soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Enabled</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-500">Muted</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400 font-medium">Total Triggered Alerts:</span>
              <span className="font-extrabold font-mono text-amber-300">
                {portfolioAlertsHistory.length} Alerts
              </span>
            </div>
          </div>

          {/* Interactive Volatility Test Simulation Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  Real-Time Push Notification Test Simulator
                </h3>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
                Push Notification Test
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Test how the Portfolio Volatility Alert engine dispatches push notifications and records value changes when market prices break your sensitivity thresholds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                type="button"
                id="btn_sim_eth_surge"
                onClick={() => triggerVolatilitySimulation('ETH', 5.8)}
                className="py-2.5 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg group cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Simulate ETH Surge (+5.8%)</span>
              </button>

              <button
                type="button"
                id="btn_sim_sol_crash"
                onClick={() => triggerVolatilitySimulation('SOL', -6.4)}
                className="py-2.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900/90 text-rose-200 border border-rose-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg group cursor-pointer"
              >
                <TrendingDown className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>Simulate SOL Dip (-6.4%)</span>
              </button>

              <button
                type="button"
                id="btn_sim_random_spike"
                onClick={() => triggerVolatilitySimulation()}
                className="py-2.5 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-200 border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg group cursor-pointer"
              >
                <Zap className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
                <span>Simulate Random Volatility</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALERT HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Dispatched Volatility Alerts ({portfolioAlertsHistory.length})</span>
            </span>
            {portfolioAlertsHistory.length > 0 && (
              <button
                type="button"
                onClick={clearAlertsHistory}
                className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 text-[11px] font-bold transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {portfolioAlertsHistory.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 space-y-2">
              <ShieldAlert className="w-8 h-8 mx-auto text-slate-700" />
              <p className="text-xs">No volatility alerts recorded yet.</p>
              <p className="text-[10px] text-slate-600">
                Click "Simulate Volatility" above or let the price monitor run in the background.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {portfolioAlertsHistory.map((item) => {
                const isSurge = item.direction === 'SURGE';
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                      isSurge
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          isSurge ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isSurge ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{item.symbol}</span>
                          <span className="text-[10px] text-slate-400">{item.name}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              isSurge
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                            }`}
                          >
                            {isSurge ? '+' : ''}
                            {item.changePercent.toFixed(2)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          Price: {formatCurrency(item.newPriceUsd)} • Portfolio Impact:{' '}
                          <span className={item.portfolioImpactUsd >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {item.portfolioImpactUsd >= 0 ? '+' : ''}
                            {formatCurrency(item.portfolioImpactUsd)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-500 font-mono">
                      {timeAgo(item.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: THRESHOLDS & SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            {/* Enable Alert Engine Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <div>
                <span className="text-xs font-bold text-white block">Enable Volatility Alerts</span>
                <span className="text-[11px] text-slate-400">
                  Receive live push notifications when token prices break thresholds.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  updatePortfolioAlertSettings({ isEnabled: !portfolioAlertSettings.isEnabled })
                }
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  portfolioAlertSettings.isEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    portfolioAlertSettings.isEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Threshold Percent Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Volatility Sensitivity Threshold (% Price Movement)
              </label>
              <div className="flex flex-wrap gap-2">
                {THRESHOLD_OPTIONS.map((pct) => {
                  const isSelected = portfolioAlertSettings.thresholdPercent === pct;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => updatePortfolioAlertSettings({ thresholdPercent: pct })}
                      className={`py-2 px-3.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      ±{pct}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Event Direction Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Surge */}
              <button
                type="button"
                onClick={() =>
                  updatePortfolioAlertSettings({ notifyOnSurge: !portfolioAlertSettings.notifyOnSurge })
                }
                className={`p-3 rounded-xl border text-left transition-all ${
                  portfolioAlertSettings.notifyOnSurge
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Bullish Surges 📈</span>
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      portfolioAlertSettings.notifyOnSurge ? 'text-emerald-400' : 'text-slate-700'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Notify when price gains exceed threshold.</p>
              </button>

              {/* Crash */}
              <button
                type="button"
                onClick={() =>
                  updatePortfolioAlertSettings({ notifyOnCrash: !portfolioAlertSettings.notifyOnCrash })
                }
                className={`p-3 rounded-xl border text-left transition-all ${
                  portfolioAlertSettings.notifyOnCrash
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Bearish Dips 📉</span>
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      portfolioAlertSettings.notifyOnCrash ? 'text-rose-400' : 'text-slate-700'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Notify when price drops exceed threshold.</p>
              </button>

              {/* Sound */}
              <button
                type="button"
                onClick={() =>
                  updatePortfolioAlertSettings({ soundEnabled: !portfolioAlertSettings.soundEnabled })
                }
                className={`p-3 rounded-xl border text-left transition-all ${
                  portfolioAlertSettings.soundEnabled
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Audio Chime 🔔</span>
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      portfolioAlertSettings.soundEnabled ? 'text-cyan-400' : 'text-slate-700'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Play chime sound on push notifications.</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
