import React, { useState, useRef } from 'react';
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
  AlertTriangle,
  Loader2,
  Send,
  Share2,
  Youtube,
  Facebook,
  Image as ImageIcon,
  Link as LinkIcon,
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
  const { activeWallet } = useWallet();
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Creator Social Links (Optional)
  const [telegramLink, setTelegramLink] = useState('');
  const [twitterLink, setTwitterLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');

  // AI Token Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiDescription, setAiDescription] = useState('');

  // Deployment Progress Pipeline
  const [isDeploying, setIsDeploying] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<string[]>([]);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [deployedToken, setDeployedToken] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('File Too Large', 'Please select an image smaller than 5MB', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
        addToast('Logo Photo Uploaded!', 'Custom token logo attached successfully.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const PRESET_LOGOS = [
    { name: 'Quantum Gold', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=150&q=80' },
    { name: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=150&q=80' },
    { name: 'TON Jetton', url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=150&q=80' },
    { name: 'Solana Glow', url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=150&q=80' },
  ];

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      addToast('Prompt Required', 'Please enter a concept or token topic for AI generation', 'warning');
      return;
    }
    setIsGeneratingAi(true);
    setDeploymentError(null);
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
    if (!tokenName.trim() || !tokenSymbol.trim()) {
      addToast('Missing Fields', 'Token Name and Symbol are required.', 'warning');
      return;
    }
    if (!totalSupply || parseFloat(totalSupply) <= 0) {
      addToast('Invalid Supply', 'Total supply must be greater than 0.', 'warning');
      return;
    }

    setIsDeploying(true);
    setDeploymentError(null);
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
          socials: {
            telegram: telegramLink.trim() || undefined,
            twitter: twitterLink.trim() || undefined,
            facebook: facebookLink.trim() || undefined,
            youtube: youtubeLink.trim() || undefined,
            website: websiteLink.trim() || undefined,
          },
        });

        if (res.success && res.token) {
          setDeployedToken(res.token);
          setIsDeploying(false);
          setStep(3); // Success step
          addToast('Token Deployed!', `${tokenName} (${tokenSymbol}) deployed on ${network.toUpperCase()}`, 'success');
        } else {
          setDeploymentError(res.error || 'Failed to create and index token on blockchain network.');
          setIsDeploying(false);
          addToast('Deployment Failed', res.error || 'Failed to create token', 'error');
        }
      } catch (err: any) {
        console.warn('Token creation failed:', err);
        setDeploymentError(err.message || 'Transaction broadcast rejected or network error');
        setIsDeploying(false);
        addToast('Deployment Error', err.message || 'Network exception during token deployment', 'error');
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

            {/* Logo Photo Upload & Presets Section */}
            <div className="space-y-2 md:col-span-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Логотип токена (Загрузка фото или URL)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">JPG, PNG, WebP (макс. 5MB)</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-lg shadow-cyan-950/40 relative group">
                  <img
                    src={logoUrl}
                    alt="Token Logo Preview"
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-slate-950/70 text-cyan-300 text-[10px] font-bold opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Сменить</span>
                  </button>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="input_token_logo"
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Вставьте URL изображения или загрузите с устройства..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer min-h-[38px]"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">Загрузить фото</span>
                    </button>
                  </div>

                  {/* Preset Logos */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-[10px] text-slate-500 shrink-0 font-medium">Готовые пресеты:</span>
                    {PRESET_LOGOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLogoUrl(preset.url)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                          logoUrl === preset.url
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media & Community Links Section (Optional) */}
            <div className="space-y-3 md:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/20">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white">Социальные сети & Ссылки проекта (По желанию)</h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  Social Links
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Telegram */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Telegram-канал / Чат</span>
                  </label>
                  <input
                    id="input_token_telegram"
                    type="text"
                    value={telegramLink}
                    onChange={(e) => setTelegramLink(e.target.value)}
                    placeholder="t.me/your_token_chat или @community"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>

                {/* Twitter / X */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Twitter / X</span>
                  </label>
                  <input
                    id="input_token_twitter"
                    type="text"
                    value={twitterLink}
                    onChange={(e) => setTwitterLink(e.target.value)}
                    placeholder="x.com/your_token или @handle"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>

                {/* Facebook */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5 text-blue-500" />
                    <span>Facebook Страница</span>
                  </label>
                  <input
                    id="input_token_facebook"
                    type="text"
                    value={facebookLink}
                    onChange={(e) => setFacebookLink(e.target.value)}
                    placeholder="facebook.com/your_token_page"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>

                {/* YouTube */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-rose-500" />
                    <span>YouTube Канал</span>
                  </label>
                  <input
                    id="input_token_youtube"
                    type="text"
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                    placeholder="youtube.com/@your_channel"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>

                {/* Official Website */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Официальный сайт проекта</span>
                  </label>
                  <input
                    id="input_token_website"
                    type="text"
                    value={websiteLink}
                    onChange={(e) => setWebsiteLink(e.target.value)}
                    placeholder="https://yourtokenproject.io"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
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
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Executing On-Chain Deployment Pipeline...</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  {pipelineProgress.map((msg, i) => {
                    const isLast = i === pipelineProgress.length - 1;
                    return (
                      <div key={i} className="text-[11px] font-mono text-emerald-400 flex items-center gap-2">
                        {isLast ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className={isLast ? 'text-cyan-300 font-bold' : 'text-emerald-400'}>{msg}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {deploymentError && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Deployment Transaction Failed</span>
                </div>
                <p className="text-[11px] font-mono text-rose-200/90">{deploymentError}</p>
                <button
                  type="button"
                  onClick={handleDeployToken}
                  className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] transition-all flex items-center gap-1.5 mt-1"
                >
                  <Rocket className="w-3 h-3" />
                  <span>Retry On-Chain Deployment</span>
                </button>
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

            {deployedToken.socials && Object.values(deployedToken.socials).some(Boolean) && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-slate-500 text-[11px]">Socials Attached:</span>
                {deployedToken.socials.telegram && (
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] flex items-center gap-1">
                    <Send className="w-3 h-3" /> Telegram
                  </span>
                )}
                {deployedToken.socials.twitter && (
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] flex items-center gap-1">
                    <Share2 className="w-3 h-3" /> Twitter/X
                  </span>
                )}
                {deployedToken.socials.facebook && (
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] flex items-center gap-1">
                    <Facebook className="w-3 h-3" /> Facebook
                  </span>
                )}
                {deployedToken.socials.youtube && (
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] flex items-center gap-1">
                    <Youtube className="w-3 h-3" /> YouTube
                  </span>
                )}
                {deployedToken.socials.website && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Website
                  </span>
                )}
              </div>
            )}
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
