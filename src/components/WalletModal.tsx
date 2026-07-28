import React, { useState } from 'react';
import {
  X,
  QrCode,
  ShieldCheck,
  Ghost,
  Wallet,
  Send,
  Shield,
  Layers,
  Key,
  Zap,
  Diamond,
  CheckCircle2,
  ArrowRight,
  Plus,
  Trash2,
  Cpu,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  Globe,
} from 'lucide-react';
import { useWallet, SUPPORTED_WALLET_PROVIDERS } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { WalletProviderId, NetworkId } from '../types';

const WALLET_ICONS: Record<WalletProviderId, React.ReactNode> = {
  nexorum_vault: <Cpu className="w-6 h-6 text-amber-400" />,
  walletconnect: <QrCode className="w-6 h-6 text-blue-400" />,
  metamask: <ShieldCheck className="w-6 h-6 text-amber-400" />,
  phantom: <Ghost className="w-6 h-6 text-purple-400" />,
  tonkeeper: <Diamond className="w-6 h-6 text-cyan-400" />,
  telegram_wallet: <Send className="w-6 h-6 text-sky-400" />,
  trust: <Shield className="w-6 h-6 text-emerald-400" />,
  coinbase: <Wallet className="w-6 h-6 text-indigo-400" />,
  okx: <Layers className="w-6 h-6 text-zinc-300" />,
  rabby: <Key className="w-6 h-6 text-teal-400" />,
  ton_wallet: <Zap className="w-6 h-6 text-cyan-300" />,
};

interface ReownWalletOption {
  id: string;
  name: string;
  category: 'wallet' | 'exchange';
  color: string;
  iconBg: string;
  universalLink: string;
  popular?: boolean;
}

const REOWN_APPKIT_DIRECTORY: ReownWalletOption[] = [
  { id: 'metamask', name: 'MetaMask Mobile', category: 'wallet', color: 'text-amber-400', iconBg: 'bg-amber-500/10 border-amber-500/30', universalLink: 'https://metamask.app.link/wc', popular: true },
  { id: 'trust', name: 'Trust Wallet', category: 'wallet', color: 'text-emerald-400', iconBg: 'bg-emerald-500/10 border-emerald-500/30', universalLink: 'https://link.trustwallet.com/wc', popular: true },
  { id: 'binance', name: 'Binance Web3 Wallet', category: 'exchange', color: 'text-yellow-400', iconBg: 'bg-yellow-500/10 border-yellow-500/30', universalLink: 'https://bnc.app/wc', popular: true },
  { id: 'okx', name: 'OKX Wallet', category: 'exchange', color: 'text-zinc-200', iconBg: 'bg-zinc-800 border-zinc-700', universalLink: 'https://www.okx.com/download', popular: true },
  { id: 'coinbase', name: 'Coinbase Wallet', category: 'wallet', color: 'text-blue-400', iconBg: 'bg-blue-500/10 border-blue-500/30', universalLink: 'https://wallet.coinbase.com/wc', popular: true },
  { id: 'rainbow', name: 'Rainbow Wallet', category: 'wallet', color: 'text-purple-400', iconBg: 'bg-purple-500/10 border-purple-500/30', universalLink: 'https://rainbow.me', popular: true },
  { id: 'phantom', name: 'Phantom Mobile', category: 'wallet', color: 'text-indigo-400', iconBg: 'bg-indigo-500/10 border-indigo-500/30', universalLink: 'https://phantom.app/ul/v1/connect' },
  { id: 'bitget', name: 'Bitget Wallet', category: 'exchange', color: 'text-cyan-400', iconBg: 'bg-cyan-500/10 border-cyan-500/30', universalLink: 'https://bkcode.vip/wc' },
  { id: 'crypto_com', name: 'Crypto.com DeFi Wallet', category: 'exchange', color: 'text-blue-300', iconBg: 'bg-blue-900/30 border-blue-700', universalLink: 'https://wallet.crypto.com/wc' },
  { id: 'tonkeeper', name: 'Tonkeeper Mobile', category: 'wallet', color: 'text-sky-400', iconBg: 'bg-sky-500/10 border-sky-500/30', universalLink: 'https://app.tonkeeper.com/wc' },
  { id: 'safe', name: 'Safe (Gnosis)', category: 'wallet', color: 'text-green-400', iconBg: 'bg-green-500/10 border-green-500/30', universalLink: 'https://gnosis-safe.io' },
  { id: 'ledger', name: 'Ledger Live', category: 'wallet', color: 'text-orange-400', iconBg: 'bg-orange-500/10 border-orange-500/30', universalLink: 'https://ledger.com/ledger-live' },
  { id: 'exodus', name: 'Exodus Mobile', category: 'wallet', color: 'text-violet-400', iconBg: 'bg-violet-500/10 border-violet-500/30', universalLink: 'https://exodus.com' },
  { id: 'oneinch', name: '1inch Wallet', category: 'wallet', color: 'text-rose-400', iconBg: 'bg-rose-500/10 border-rose-500/30', universalLink: 'https://1inch.io/wallet' },
];

export const WalletModal: React.FC = () => {
  const { isModalOpen, closeWalletModal, connectWalletProvider, activeNetwork } = useWallet();
  const { clearDemoWallets } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<WalletProviderId | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>(activeNetwork?.id || 'ethereum');
  const [connectTab, setConnectTab] = useState<'appkit' | 'extensions' | 'manual'>('appkit');
  const [manualAddressInput, setManualAddressInput] = useState('');

  // Reown AppKit State
  const [reownProjectId, setReownProjectId] = useState<string>(() => {
    const saved = localStorage.getItem('reown_project_id');
    if (!saved || saved === '8a381920392019382019382') {
      localStorage.setItem('reown_project_id', '9eb28dc61f1cde5b93c657e530bcebec');
      return '9eb28dc61f1cde5b93c657e530bcebec';
    }
    return saved;
  });
  const [showReownInput, setShowReownInput] = useState(false);
  const [appKitSearch, setAppKitSearch] = useState('');
  const [appKitFilter, setAppKitFilter] = useState<'all' | 'wallet' | 'exchange'>('all');
  const [selectedReownWallet, setSelectedReownWallet] = useState<ReownWalletOption | null>(null);
  const [copiedUri, setCopiedUri] = useState(false);
  const [wcSessionStep, setWcSessionStep] = useState<'idle' | 'generating' | 'awaiting' | 'connected'>('idle');

  if (!isModalOpen) return null;

  const getWcUri = () => {
    return `wc:${reownProjectId.slice(0, 12)}...${Date.now().toString(36)}@2?bridge=https://relay.walletconnect.org&key=nexorum_${selectedNetwork}`;
  };

  const handleSelectWallet = async (id: WalletProviderId) => {
    setSelectedProvider(id);
    setConnecting(true);
    setErrorMessage(null);

    try {
      await connectWalletProvider(id, selectedNetwork);
      closeWalletModal();
    } catch (err: any) {
      console.warn(err);
      setErrorMessage(err?.message || 'Extension not detected or connection rejected.');
    } finally {
      setConnecting(false);
      setSelectedProvider(null);
    }
  };

  const handleOpenReownWalletFlow = (wallet: ReownWalletOption) => {
    setSelectedReownWallet(wallet);
    setWcSessionStep('generating');
    setConnecting(true);
    setTimeout(() => {
      setWcSessionStep('awaiting');
    }, 600);
  };

  const handleConfirmReownConnection = async () => {
    setWcSessionStep('generating');
    try {
      // Execute WalletConnect / Reown session connection
      const targetProvider: WalletProviderId = (selectedReownWallet?.id as WalletProviderId) || 'walletconnect';
      await connectWalletProvider(targetProvider, selectedNetwork);
      setWcSessionStep('connected');
      setTimeout(() => {
        closeWalletModal();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Reown AppKit Session authorization failed.');
      setWcSessionStep('idle');
    } finally {
      setConnecting(false);
    }
  };

  const handleCopyWcUri = () => {
    navigator.clipboard.writeText(getWcUri());
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAddressInput.trim()) return;
    setConnecting(true);
    setErrorMessage(null);
    try {
      await connectWalletProvider('walletconnect', selectedNetwork, manualAddressInput.trim());
      setManualAddressInput('');
      closeWalletModal();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Error connecting address.');
    } finally {
      setConnecting(false);
    }
  };

  const handleResetDemoWallets = () => {
    clearDemoWallets();
    setErrorMessage('Demo wallets cleared. You can now link your real Web3 address!');
  };

  const filteredReownWallets = REOWN_APPKIT_DIRECTORY.filter((w) => {
    const matchesCategory = appKitFilter === 'all' || w.category === appKitFilter;
    const matchesSearch = w.name.toLowerCase().includes(appKitSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          id="btn_close_wallet_modal"
          onClick={closeWalletModal}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-1">
            <Zap className="w-4 h-4" />
            <span>Reown AppKit / WalletConnect v2 Engine</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Connect Web3 Wallet or Exchange</h2>
          <p className="text-slate-400 text-xs mt-1">
            Choose your preferred mobile wallet, crypto exchange app, browser extension, or enter your wallet address.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs space-y-2 animate-in fade-in">
            <p className="font-semibold">{errorMessage}</p>
            {errorMessage.includes('Extension') && (
              <button
                type="button"
                onClick={() => {
                  setConnectTab('manual');
                  setErrorMessage(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition-colors"
              >
                Switch to 'Real Address Input' Tab →
              </button>
            )}
          </div>
        )}

        {/* Connection Method Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              setConnectTab('appkit');
              setSelectedReownWallet(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              connectTab === 'appkit' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Reown AppKit Directory
          </button>
          <button
            onClick={() => setConnectTab('extensions')}
            className={`py-2 rounded-xl transition-all ${
              connectTab === 'extensions' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Browser Extensions
          </button>
          <button
            onClick={() => setConnectTab('manual')}
            className={`py-2 rounded-xl transition-all ${
              connectTab === 'manual' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Real Address Input
          </button>
        </div>

        {/* Target Network Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Chain</label>
            <span className="text-[10px] text-cyan-400 font-mono">Chain ID: {selectedNetwork === 'nexorum' ? '7780' : selectedNetwork === 'ethereum' ? '1' : selectedNetwork === 'bsc' ? '56' : '137'}</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
            {(['nexorum', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'solana', 'ton'] as NetworkId[]).map((net) => (
              <button
                key={net}
                onClick={() => setSelectedNetwork(net)}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  selectedNetwork === net
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {net}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: Reown AppKit Wallet & Exchange Directory */}
        {connectTab === 'appkit' && (
          <div className="space-y-3">
            {!selectedReownWallet ? (
              <>
                {/* Search & Category Filter */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={appKitSearch}
                      onChange={(e) => setAppKitSearch(e.target.value)}
                      placeholder="Search 300+ wallets & exchanges..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setAppKitFilter('all')}
                      className={`px-2.5 py-1 rounded-lg ${appKitFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAppKitFilter('wallet')}
                      className={`px-2.5 py-1 rounded-lg ${appKitFilter === 'wallet' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
                    >
                      Wallets
                    </button>
                    <button
                      onClick={() => setAppKitFilter('exchange')}
                      className={`px-2.5 py-1 rounded-lg ${appKitFilter === 'exchange' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
                    >
                      Exchanges
                    </button>
                  </div>
                </div>

                {/* Grid of Reown Supported Wallets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {filteredReownWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleOpenReownWalletFlow(wallet)}
                      className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 transition-all text-left flex items-center gap-3 group relative"
                    >
                      <div className={`p-2.5 rounded-xl ${wallet.iconBg} flex items-center justify-center shrink-0`}>
                        <Smartphone className={`w-5 h-5 ${wallet.color}`} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">{wallet.name}</p>
                        <span className="text-[9px] text-slate-500 capitalize">{wallet.category}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Reown Project ID: <span className="font-mono text-cyan-400">{reownProjectId.slice(0, 10)}...</span></span>
                  </span>
                  <button
                    onClick={() => setShowReownInput(!showReownInput)}
                    className="text-cyan-400 hover:underline font-semibold"
                  >
                    {showReownInput ? 'Hide' : 'Configure'}
                  </button>
                </div>

                {showReownInput && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Reown Cloud Project ID (`projectId`)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={reownProjectId}
                        onChange={(e) => {
                          setReownProjectId(e.target.value);
                          localStorage.setItem('reown_project_id', e.target.value);
                        }}
                        placeholder="Enter Reown AppKit Project ID..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('reown_project_id', reownProjectId);
                          setShowReownInput(false);
                          setErrorMessage('Reown Project ID updated!');
                        }}
                        className="px-3 py-1.5 bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-cyan-400"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Selected Wallet Detail & Connection QR Handshake */
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center animate-in fade-in">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedReownWallet(null)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    ← Back to Catalog
                  </button>
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{selectedReownWallet.name}</span>
                  </span>
                </div>

                {/* QR Code and Universal Link Box */}
                <div className="w-48 h-48 mx-auto p-3 bg-white rounded-2xl flex flex-col items-center justify-center shadow-2xl relative group">
                  <QrCode className="w-36 h-36 text-slate-900" />
                  {wcSessionStep === 'generating' && (
                    <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex items-center justify-center text-cyan-400 font-bold text-xs gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Generating WC Session...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-white">Scan with {selectedReownWallet.name} or tap to open directly</p>
                  <p className="text-slate-400 text-[11px]">
                    Open {selectedReownWallet.name} on your phone to scan this QR code or authorize the Web3 handshake request.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleCopyWcUri}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    {copiedUri ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUri ? 'URI Copied!' : 'Copy WC URI'}</span>
                  </button>

                  <a
                    href={selectedReownWallet.universalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open App</span>
                  </a>
                </div>

                <button
                  onClick={handleConfirmReownConnection}
                  disabled={connecting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950"
                >
                  <Zap className="w-4 h-4" />
                  <span>{connecting ? 'Waiting for Mobile Authorization...' : 'Authorize Connected Session'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Extension Wallets */}
        {connectTab === 'extensions' && (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {SUPPORTED_WALLET_PROVIDERS.map((provider) => {
              const isSelected = selectedProvider === provider.id;
              return (
                <button
                  key={provider.id}
                  id={`btn_connect_${provider.id}`}
                  disabled={connecting}
                  onClick={() => handleSelectWallet(provider.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 group ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/80 text-white'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      {WALLET_ICONS[provider.id]}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{provider.name}</span>
                        {provider.isPopular && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                            Direct Extension
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Supports {provider.supportedNetworks.slice(0, 3).join(', ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isSelected && connecting ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 animate-pulse">
                        <Zap className="w-3.5 h-3.5 animate-spin" />
                        <span>Prompting Extension...</span>
                      </div>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 3: Manual Real Address Input */}
        {connectTab === 'manual' && (
          <form onSubmit={handleManualConnect} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Paste Real Wallet Address ({selectedNetwork.toUpperCase()})</label>
              <input
                type="text"
                value={manualAddressInput}
                onChange={(e) => setManualAddressInput(e.target.value)}
                placeholder={
                  selectedNetwork === 'ton'
                    ? 'EQA... or UQA... (TON Address)'
                    : selectedNetwork === 'solana'
                    ? 'Solana Wallet Public Key'
                    : '0x... (EVM Wallet Address)'
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={connecting || !manualAddressInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950"
            >
              <Plus className="w-4 h-4" />
              <span>Link Real Wallet Address</span>
            </button>
          </form>
        )}

        {/* Footer & Reset Demo Wallets Option */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <button
            type="button"
            onClick={handleResetDemoWallets}
            className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Demo Wallets</span>
          </button>
          <span className="text-slate-500">NEXORUM Reown AppKit v2.4</span>
        </div>
      </div>
    </div>
  );
};

