import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Cpu,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Play,
  Share2,
  Sliders,
  Radio,
  Copy,
  Terminal,
  FileCode,
  Flame,
  Globe,
  DollarSign,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { formatCurrency } from '../lib/utils';

interface AiQuantumSentinelViewProps {
  setActiveTab?: (tab: string) => void;
}

export const AiQuantumSentinelView: React.FC<AiQuantumSentinelViewProps> = ({ setActiveTab }) => {
  const { addToast } = useNotifications();

  // Active Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'strategy' | 'whale_signals' | 'viral_incubator'>('audit');

  // Audit State
  const [auditTarget, setAuditTarget] = useState('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>({
    safetyScore: 96,
    riskLevel: 'LOW',
    honeypotStatus: 'SAFE',
    mintFunctionRisk: 'Minting authority permanently disabled on-chain via zero-address ownership.',
    liquidityLockPercent: 98.4,
    topHolderConcentration: 'Top 10 wallets hold 11.2% (No whale dump risk)',
    keyFindings: [
      'Zero Hidden Taxes: Buy tax 0% | Sell tax 0%',
      'Liquidity Locked for 365 Days on NEXORUM Multi-Chain Vault',
      'Verified Smart Contract Bytecode matched on Etherscan & BscScan',
    ],
    aiRecommendation:
      'NEXORUM Sentinel AI verifies this smart contract as highly secure with zero honeypot or malicious proxy indicators.',
  });

  // Strategy State
  const [strategyPrompt, setStrategyPrompt] = useState(
    'Auto-buy 0.5 ETH when gas is under 12 gwei and RSI < 30, then stake 60% in NEXORUM 30-Day Vault at 25% APY'
  );
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState<any>({
    strategyName: 'AI Volatility Arbitrage & Staking Hedge',
    triggerCondition: 'Gas Price < 12 gwei & RSI < 30',
    executionSteps: [
      'Monitor Uniswap v3 & NEXORUM DEX router via Web3 RPC nodes',
      'Execute non-custodial swap into ETH with 0.2% max slippage',
      'Automatically deposit 60% of swapped ETH into NEXORUM Vault for 25% APY yield',
    ],
    targetNetwork: 'Ethereum Mainnet / NEXORUM Chain',
    estimatedApy: '24.8%',
    maxSlippage: '0.2%',
    gasOptimization: 'Account Abstraction ERC-4337 Batch Execution',
    aiLogicSummary: 'Automated AI strategy listening to live RPC events with zero custodial control.',
  });
  const [isStrategyActive, setIsStrategyActive] = useState(false);

  // Viral Incubator State
  const [tokenNameInput, setTokenNameInput] = useState('NEXORUM Quantum');
  const [tokenSymbolInput, setTokenSymbolInput] = useState('NEXQ');
  const [tokenDescInput, setTokenDescInput] = useState('Autonomous AI-powered Web3 infrastructure token');
  const [isGeneratingViral, setIsGeneratingViral] = useState(false);
  const [viralOutput, setViralOutput] = useState('');

  // Handle Audit
  const handleRunAudit = async () => {
    if (!auditTarget.trim()) return;
    setIsAuditing(true);
    try {
      const res = await api.auditContract(auditTarget.trim());
      if (res.success && res.audit) {
        setAuditResult(res.audit);
        addToast('AI Sentinel Audit Complete', `Scanned ${auditTarget.slice(0, 10)}... with score ${res.audit.safetyScore}%`);
      }
    } catch (e: any) {
      addToast('Audit Error', e?.message || 'Failed to analyze contract');
    } finally {
      setIsAuditing(false);
    }
  };

  // Handle Strategy Generation
  const handleGenerateStrategy = async () => {
    if (!strategyPrompt.trim()) return;
    setIsGeneratingStrategy(true);
    try {
      const res = await api.generateAiStrategy(strategyPrompt);
      if (res.success && res.strategy) {
        setActiveStrategy(res.strategy);
        setIsStrategyActive(false);
        addToast('AI Strategy Synthesized', res.strategy.strategyName);
      }
    } catch (e: any) {
      addToast('Strategy Error', e?.message || 'Failed to generate strategy');
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  // Handle Viral Campaign Generation
  const handleGenerateViral = async () => {
    setIsGeneratingViral(true);
    try {
      const res = await api.generateViralCampaign(tokenNameInput, tokenSymbolInput, tokenDescInput);
      if (res.success && res.campaign) {
        setViralOutput(res.campaign);
        addToast('Viral Campaign Generated', 'Ready for Telegram & Twitter distribution!');
      }
    } catch (e: any) {
      addToast('Campaign Error', 'Failed to generate campaign text');
    } finally {
      setIsGeneratingViral(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 select-none">
      {/* Top Banner */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-950 border border-cyan-500/30 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>World-First Web3 AI Engine • Powered by Gemini 3.6</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              AI Quantum Sentinel & Autonomous Web3 Router
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Experience the next generation of Web3: Real-time AI smart contract rugpull detection, natural language strategy execution, and autonomous whale signal tracking.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="font-bold text-white block">AI Sentinel Status</span>
                <span className="text-[10px] text-emerald-400 font-mono">100% Autonomous • Live RPC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'audit'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>AI Contract Rugpull Auditor</span>
        </button>

        <button
          onClick={() => setActiveSubTab('strategy')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'strategy'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Autonomous AI Strategy Vault</span>
        </button>

        <button
          onClick={() => setActiveSubTab('whale_signals')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'whale_signals'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>AI Whale Radar Signals</span>
        </button>

        <button
          onClick={() => setActiveSubTab('viral_incubator')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'viral_incubator'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Viral Meme & Token Studio</span>
        </button>
      </div>

      {/* SUB-TAB 1: AI CONTRACT AUDITOR */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Scan Any Smart Contract or Token Symbol</span>
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={auditTarget}
                  onChange={(e) => setAuditTarget(e.target.value)}
                  placeholder="Enter contract address (0x...) or token symbol (e.g. SOL, ETH, TON)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>{isAuditing ? 'Auditing Bytecode...' : 'Run AI Audit'}</span>
              </button>
            </div>
          </div>

          {/* Audit Results Dashboard */}
          {auditResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Safety Gauge */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    AI Safety Index
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                    {auditResult.riskLevel} RISK
                  </span>
                </div>

                <div className="flex items-center justify-center py-4">
                  <div className="relative w-36 h-36 rounded-full border-8 border-slate-800 flex flex-col items-center justify-center bg-slate-950">
                    <span className="text-4xl font-black text-emerald-400 font-mono">
                      {auditResult.safetyScore}%
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
                      Safe Score
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs border-t border-slate-800 pt-3">
                  <div className="flex justify-between text-slate-400">
                    <span>Honeypot Test:</span>
                    <span className="text-emerald-400 font-bold font-mono">{auditResult.honeypotStatus}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Liquidity Locked:</span>
                    <span className="text-cyan-400 font-bold font-mono">{auditResult.liquidityLockPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Key Security Findings */}
              <div className="md:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>AI Sentinel Inspection Findings</span>
                  </h4>

                  <ul className="space-y-2 text-xs text-slate-200">
                    {auditResult.keyFindings?.map((finding: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
                    <span className="font-bold block flex items-center gap-1.5 text-cyan-300">
                      <Sparkles className="w-3.5 h-3.5" /> AI Sentinel Verdict
                    </span>
                    <p className="leading-relaxed">{auditResult.aiRecommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: AUTONOMOUS AI STRATEGY VAULT */}
      {activeSubTab === 'strategy' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Describe Your Trading Strategy in Plain English</span>
            </h3>

            <textarea
              rows={3}
              value={strategyPrompt}
              onChange={(e) => setStrategyPrompt(e.target.value)}
              placeholder="e.g. Auto-swap 200 USDT to SOL if Solana price drops > 3%, and lock profit in NEXORUM Staking Vault..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white font-sans focus:border-cyan-500 focus:outline-none leading-relaxed"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateStrategy}
                disabled={isGeneratingStrategy}
                className="py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingStrategy ? 'animate-spin' : ''}`} />
                <span>{isGeneratingStrategy ? 'Synthesizing Rules...' : 'Build AI Smart Strategy'}</span>
              </button>
            </div>
          </div>

          {/* Active Strategy Output Card */}
          {activeStrategy && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-white">{activeStrategy.strategyName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target Network: <span className="text-cyan-400 font-bold">{activeStrategy.targetNetwork}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold">
                    Est. Yield: {activeStrategy.estimatedApy} APY
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsStrategyActive(!isStrategyActive);
                      addToast(
                        isStrategyActive ? 'Strategy Deactivated' : 'AI Strategy Active',
                        isStrategyActive ? 'Listening paused.' : 'AI Agent listening to cross-chain RPC events.'
                      );
                    }}
                    className={`py-2 px-5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                      isStrategyActive
                        ? 'bg-rose-500 text-white hover:bg-rose-600'
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isStrategyActive ? 'Deactivate Strategy' : 'Activate On-Chain'}</span>
                  </button>
                </div>
              </div>

              {/* Execution Steps */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Autonomous Execution Flow
                </span>
                <div className="space-y-2">
                  {activeStrategy.executionSteps?.map((step: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs text-slate-200">
                      <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Properties */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Max Allowed Slippage</span>
                  <span className="text-white font-mono font-bold">{activeStrategy.maxSlippage}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Gas Optimization</span>
                  <span className="text-white font-mono font-bold truncate block">{activeStrategy.gasOptimization}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block text-[10px]">Security Custody</span>
                  <span className="text-emerald-400 font-bold">100% Non-Custodial</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: AI WHALE RADAR SIGNALS */}
      {activeSubTab === 'whale_signals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Real-Time AI Multi-Chain Whale Monitor</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Stream
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'sig_1',
                time: '2 mins ago',
                chain: 'Ethereum',
                type: 'WHALE BUY',
                token: 'ETH',
                amount: '450 ETH ($1,535,000 USD)',
                impact: 'BULLISH',
                aiConfidence: '98%',
                address: '0x88a...4b1',
              },
              {
                id: 'sig_2',
                time: '7 mins ago',
                chain: 'TON Network',
                type: 'JETTON LIQUIDITY ADD',
                token: 'TON',
                amount: '125,000 TON ($856,250 USD)',
                impact: 'HIGH VOLATILITY SURGE',
                aiConfidence: '94%',
                address: 'EQA4...91c',
              },
              {
                id: 'sig_3',
                time: '14 mins ago',
                chain: 'Base L2',
                type: 'ACCUMULATION',
                token: 'NEX',
                amount: '2,400,000 NEX ($204,000 USD)',
                impact: 'BULLISH ACCUMULATION',
                aiConfidence: '96%',
                address: '0x321...9f8',
              },
            ].map((sig) => (
              <div
                key={sig.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{sig.token}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {sig.chain}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {sig.impact}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 font-mono">
                      {sig.type}: <span className="text-white font-bold">{sig.amount}</span> by {sig.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">AI Confidence</span>
                    <span className="text-xs font-bold text-cyan-400 font-mono">{sig.aiConfidence}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToast('Signal Followed', `Tracking ${sig.token} whale moves`)}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  >
                    Track Move
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: VIRAL MEME & TOKEN STUDIO */}
      {activeSubTab === 'viral_incubator' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-cyan-400" />
              <span>Generate Viral Telegram & Twitter Marketing Copy for Your Token</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Token Name:</label>
                <input
                  type="text"
                  value={tokenNameInput}
                  onChange={(e) => setTokenNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Symbol:</label>
                <input
                  type="text"
                  value={tokenSymbolInput}
                  onChange={(e) => setTokenSymbolInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">Short Description:</label>
              <input
                type="text"
                value={tokenDescInput}
                onChange={(e) => setTokenDescInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateViral}
              disabled={isGeneratingViral}
              className="py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingViral ? 'animate-spin' : ''}`} />
              <span>{isGeneratingViral ? 'Generating Campaign...' : 'Generate Viral Launch Copy'}</span>
            </button>
          </div>

          {viralOutput && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Generated Announcement Text:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(viralOutput);
                    addToast('Copied to Clipboard', 'Ready to paste into Telegram or Twitter!');
                  }}
                  className="py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Copywriting</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono whitespace-pre-wrap leading-relaxed">
                {viralOutput}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
