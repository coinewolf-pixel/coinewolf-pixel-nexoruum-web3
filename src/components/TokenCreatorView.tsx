import React, { useState } from 'react';
import {
  PlusCircle,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Upload,
  ArrowRight,
  Sparkles,
  DollarSign,
  Rocket,
  Check,
  Layers,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { TokenStandard, NetworkId } from '../types';

interface TokenCreatorViewProps {
  setActiveTab: (tab: string) => void;
}

export const TokenCreatorView: React.FC<TokenCreatorViewProps> = ({ setActiveTab }) => {
  const { activeWallet, activeNetwork } = useWallet();
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [tokenName, setTokenName] = useState('NEXORUM Quantum Coin');
  const [tokenSymbol, setTokenSymbol] = useState('NEXQ');
  const [network, setNetwork] = useState<NetworkId>('nexorum');
  const [standard, setStandard] = useState<TokenStandard>('NEX20');
  const [decimals, setDecimals] = useState(18);
  const [totalSupply, setTotalSupply] = useState('100000000');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=150&q=80');
  const [addLiquidityUsd, setAddLiquidityUsd] = useState(2500);

  // AI Token Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiDescription, setAiDescription] = useState('');

  // Deployment Progress Pipeline
  const [isDeploying, setIsDeploying] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<string[]>([]);
  const [deployedToken, setDeployedToken] = useState<any>(null);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      addToast('Prompt Required', 'Please enter a concept or token topic for AI generation', 'warning');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const res = await api.generateAiToken(aiPrompt.trim());
      if (res.success && res.aiData) {
        const data = res.aiData;
        if (data.name) setTokenName(data.name);
        if (data.symbol) setTokenSymbol(data.symbol.toUpperCase());
        if (data.totalSupply) setTotalSupply(String(data.totalSupply));
        if (data.decimals) setDecimals(Number(data.decimals));
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.description) setAiDescription(data.description);
        if (data.network) handleStandardChange(data.network as NetworkId);
        addToast('AI Token Generated! ✨', `Created parameters and custom logo for ${data.name} (${data.symbol})`, 'success');
      } else {
        addToast('AI Generation Error', res.error || 'Failed to generate token concept', 'error');
      }
    } catch (err: any) {
      addToast('AI Error', err.message || 'Error executing AI generation', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleStandardChange = (net: NetworkId) => {
    setNetwork(net);
    if (net === 'nexorum') {
      setStandard('NEX20');
      setDecimals(18);
    } else if (net === 'ton') {
      setStandard('TON_JETTON');
      setDecimals(9);
    } else if (net === 'solana') {
      setStandard('SPL');
      setDecimals(9);
    } else if (net === 'bsc') {
      setStandard('BEP20');
      setDecimals(18);
    } else {
      setStandard('ERC20');
      setDecimals(18);
    }
  };

  const handleDeployToken = async () => {
    setIsDeploying(true);
    setPipelineProgress(['Generating Smart Contract Bytecode...']);

    setTimeout(() => {
      setPipelineProgress((prev) => [...prev, `Deploying ${standard} to ${network.toUpperCase()} Blockchain...`]);
    }, 800);

    setTimeout(() => {
      setPipelineProgress((prev) => [...prev, 'Verifying Smart Contract Source Code on Explorer...']);
    }, 1600);

    setTimeout(() => {
      setPipelineProgress((prev) => [...prev, `Creating Automated Liquidity Pool with $${addLiquidityUsd}...`]);
    }, 2400);

    setTimeout(async () => {
      setPipelineProgress((prev) => [...prev, 'Publishing Token Metadata to NEXORUM Marketplace & Home...']);

      try {
        const res = await api.createToken({
          name: tokenName,
          symbol: tokenSymbol,
          network,
          standard,
          decimals,
          totalSupply,
          logoUrl,
          ownerAddress: activeWallet?.address || user?.primaryWallet || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          userId: user?.id || 'usr_nex_982341',
          addInitialLiquidityUsd: addLiquidityUsd,
        });

        if (res.success && res.token) {
          setDeployedToken(res.token);
          setIsDeploying(false);
          setStep(3); // Success step
          addToast('Token Deployed!', `${tokenName} (${tokenSymbol}) deployed on ${network.toUpperCase()}`, 'success');
        }
      } catch (err) {
        console.error('Token creation failed:', err);
        setIsDeploying(false);
      }
    }, 3200);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
          <PlusCircle className="w-4 h-4" />
          <span>NEXORUM Token Engine</span>
        </div>
        <h1 className="text-3xl font-black text-white">Token Creator Wizard</h1>
        <p className="text-slate-400 text-xs mt-1">
          Deploy ERC20, BEP20, SPL, or TON Jetton tokens with automated verification, liquidity pools, and marketplace listing.
        </p>
      </div>

      {/* Progress Wizard Header */}
      <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
        <div className={`flex items-center gap-2 p-2 rounded-xl ${step === 1 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
          <span>Select Standard</span>
        </div>
        <div className={`flex items-center gap-2 p-2 rounded-xl ${step === 2 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
          <span>Token Parameters</span>
        </div>
        <div className={`flex items-center gap-2 p-2 rounded-xl ${step === 3 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-500'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">3</span>
          <span>Deployment & Pools</span>
        </div>
      </div>

      {/* STEP 1: Standard & Network */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-white">Choose Blockchain & Token Standard</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'nexorum', name: 'NEXORUM Blockchain', std: 'NEX20', desc: 'Native high-speed zero-gas NEX20 token standard' },
              { id: 'ethereum', name: 'Ethereum', std: 'ERC20', desc: 'Standard EVM fungible token for Uniswap & Etherscan' },
              { id: 'bsc', name: 'BNB Smart Chain', std: 'BEP20', desc: 'Ultra-low gas EVM token for PancakeSwap' },
              { id: 'polygon', name: 'Polygon', std: 'ERC20', desc: 'High-speed EVM token on Polygon PoS' },
              { id: 'arbitrum', name: 'Arbitrum One', std: 'ERC20', desc: 'L2 Scaling token with low gas fees' },
              { id: 'base', name: 'Base Network', std: 'ERC20', desc: 'Coinbase L2 Network standard' },
              { id: 'solana', name: 'Solana', std: 'SPL', desc: 'Solana Program Library token for Raydium & Jupiter' },
              { id: 'ton', name: 'TON Network', std: 'TON_JETTON', desc: 'TON Jetton Standard for Telegram Wallets & DeDust' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleStandardChange(item.id as NetworkId)}
                className={`p-4 rounded-2xl border text-left transition-all group ${
                  network === item.id
                    ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-lg shadow-cyan-950'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm group-hover:text-cyan-300">{item.name}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {item.std}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </button>
            ))}
          </div>

          <button
            id="btn_step1_next"
            onClick={() => setStep(2)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Token Parameters</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Parameters Form */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Configure Token Parameters</h2>
              <p className="text-slate-400 text-xs">Fill parameters manually or use Gemini AI to generate concept & custom logo.</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-500/30 self-start sm:self-center">
              Target: {network.toUpperCase()} ({standard})
            </span>
          </div>

          {/* AI TOKEN ARCHITECT & LOGO GENERATOR BOX */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-950 to-indigo-950/80 border border-purple-500/40 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              <h3 className="text-sm font-black text-white">Gemini AI Token & Logo Architect</h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                Auto-Generate
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Enter a token concept (e.g. <i>"Space Dragon coin for gaming metaverse"</i> or <i>"Cybernetic Wolf meme token on BNB"</i>) and AI will craft the token name, symbol, supply, utility description, and custom AI logo!
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                id="input_ai_prompt"
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                placeholder="Describe your token idea..."
                className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono"
              />
              <button
                id="btn_ai_generate_token"
                type="button"
                onClick={handleAiGenerate}
                disabled={isGeneratingAi}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-purple-950 flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'AI Crafting...' : 'Generate Token & AI Logo'}</span>
              </button>
            </div>

            {aiDescription && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/20 text-xs text-purple-200 space-y-1">
                <span className="font-bold text-purple-300 block">AI Generated Utility Description:</span>
                <p>{aiDescription}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Token Name</label>
              <input
                id="input_token_name"
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Token Symbol</label>
              <input
                id="input_token_symbol"
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Total Supply</label>
              <input
                id="input_token_supply"
                type="text"
                value={totalSupply}
                onChange={(e) => setTotalSupply(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Decimals</label>
              <input
                id="input_token_decimals"
                type="number"
                value={decimals}
                onChange={(e) => setDecimals(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Logo URL / AI Custom Emblem</label>
              <div className="flex gap-3 items-center">
                <input
                  id="input_token_logo"
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
                <div className="w-11 h-11 rounded-xl bg-slate-950 border border-cyan-500/40 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
                  <img
                    src={logoUrl}
                    alt="Token Logo Preview"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Initial Liquidity Pool Allocation ($ USD)</label>
              <input
                id="input_token_liquidity"
                type="number"
                value={addLiquidityUsd}
                onChange={(e) => setAddLiquidityUsd(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Deployment Execution Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Network:</span>
              <span className="font-bold text-cyan-300 uppercase">{network} ({standard})</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Owner Wallet:</span>
              <span className="font-mono text-slate-300">{activeWallet?.address || user?.primaryWallet || '0x71C7...8976F'}</span>
            </div>

            {isDeploying && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <Zap className="w-4 h-4 animate-spin" />
                  <span>Executing NEXORUM Pipeline...</span>
                </div>
                {pipelineProgress.map((msg, i) => (
                  <p key={i} className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>{msg}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              disabled={isDeploying}
              className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Back
            </button>
            <button
              id="btn_deploy_token_now"
              onClick={handleDeployToken}
              disabled={isDeploying}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              <span>{isDeploying ? 'Deploying...' : 'Deploy & Publish Token'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Success Screen */}
      {step === 3 && deployedToken && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Token Successfully Deployed!</h2>
            <p className="text-slate-400 text-xs mt-1">
              {deployedToken.name} (${deployedToken.symbol}) is now published on the {deployedToken.network.toUpperCase()} Blockchain.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs font-mono space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Contract Address:</span>
              <span className="text-cyan-400 font-bold">{deployedToken.contractAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Liquidity Pool:</span>
              <span className="text-emerald-400 font-bold">{deployedToken.liquidityPoolAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Marketplace Status:</span>
              <span className="text-cyan-300 font-bold">LISTED & ACTIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              id="btn_success_view_discover"
              onClick={() => setActiveTab('discover')}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              View in Discover
            </button>
            <button
              id="btn_success_view_profile"
              onClick={() => setActiveTab('profile')}
              className="py-3 px-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
            >
              Check My Portfolio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
