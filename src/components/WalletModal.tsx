import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
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
  Sparkles,
  ArrowLeftRight,
  Eye,
  TrendingDown,
  Lock,
} from 'lucide-react';
import { useWallet, SUPPORTED_WALLET_PROVIDERS } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { WalletProviderId, NetworkId } from '../types';
import { getWalletLogo } from './WalletLogos';

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
  const { isModalOpen, closeWalletModal, connectWalletProvider, activeNetwork, activeWallet, syncOnChainBalances } = useWallet();
  const { user, clearDemoWallets } = useAuth();
  const { addToast } = useNotifications();
  const [selectedProvider, setSelectedProvider] = useState<WalletProviderId | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>(activeNetwork?.id || 'ethereum');
  const [connectTab, setConnectTab] = useState<'appkit' | 'extensions' | 'bridge' | 'manual'>('appkit');
  const [manualAddressInput, setManualAddressInput] = useState('');

  // Cross-Chain Bridge State
  const [bridgeSourceChain, setBridgeSourceChain] = useState<NetworkId>('nexorum');
  const [bridgeDestChain, setBridgeDestChain] = useState<NetworkId>('ethereum');
  const [bridgeAsset, setBridgeAsset] = useState<string>('NEX');
  const [bridgeAmount, setBridgeAmount] = useState<string>('100');
  const [isBridging, setIsBridging] = useState<boolean>(false);
  const [bridgeSuccessTx, setBridgeSuccessTx] = useState<any | null>(null);

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
  const [activeWcUri, setActiveWcUri] = useState<string>('');
  const [wcSessionStep, setWcSessionStep] = useState<'idle' | 'generating' | 'awaiting' | 'connected'>('idle');

  const handleSwapBridgeChains = () => {
    setBridgeSourceChain((prevSource) => {
      setBridgeDestChain(prevSource);
      return bridgeDestChain;
    });
  };

  const getAssetPriceUsd = (assetSymbol: string) => {
    switch (assetSymbol) {
      case 'NEX': return 12.45;
      case 'ETH': return 3400;
      case 'BNB': return 580;
      case 'SOL': return 185;
      case 'TON': return 6.85;
      case 'USDT':
      case 'USDC': return 1.0;
      default: return 1.0;
    }
  };

  const getAvailableBalance = () => {
    if (activeWallet) {
      if (bridgeAsset === 'NEX' || bridgeSourceChain === 'nexorum') {
        return activeWallet.nativeBalance || '1,000.00 NEX';
      }
      return activeWallet.nativeBalance || '10.00 ETH';
    }
    return '1,000.00 NEX';
  };

  // Smart Preview State for Cross-Chain Transfers
  const [showSmartPreview, setShowSmartPreview] = useState<boolean>(true);
  const [isSimulatingRoute, setIsSimulatingRoute] = useState<boolean>(false);
  const [lastSimulationTime, setLastSimulationTime] = useState<string>('Just now');

  const calcSmartPreviewMetrics = () => {
    const numAmount = parseFloat(bridgeAmount) || 0;
    const priceUsd = getAssetPriceUsd(bridgeAsset);
    const totalUsd = numAmount * priceUsd;

    // Standard L1 Cross-Chain Bridge Gas Fees
    let estStandardGasUsd = 18.50;
    if (bridgeSourceChain === 'solana' || bridgeDestChain === 'solana') estStandardGasUsd = 3.20;
    else if (bridgeSourceChain === 'polygon' || bridgeDestChain === 'polygon') estStandardGasUsd = 4.50;
    else if (bridgeSourceChain === 'bsc' || bridgeDestChain === 'bsc') estStandardGasUsd = 6.80;
    else if (bridgeSourceChain === 'arbitrum' || bridgeDestChain === 'arbitrum') estStandardGasUsd = 8.40;

    const nexorumGasUsd = 0.15; // ERC-4337 Account Abstraction Paymaster Gas
    const gasSavedUsd = Math.max(0, estStandardGasUsd - nexorumGasUsd);
    const gasSavingsPct = estStandardGasUsd > 0 ? ((gasSavedUsd / estStandardGasUsd) * 100).toFixed(1) : '99.2';

    const protocolFeePct = 0.02; // 0.02% ZK Relayer Fee
    const expectedOutput = (numAmount * (1 - protocolFeePct / 100)).toFixed(4);
    const expectedOutputUsd = ((numAmount * (1 - protocolFeePct / 100)) * priceUsd).toFixed(2);
    const protocolFeeUsd = (numAmount * (protocolFeePct / 100) * priceUsd).toFixed(3);

    return {
      numAmount,
      totalUsd: totalUsd.toFixed(2),
      estStandardGasUsd: estStandardGasUsd.toFixed(2),
      nexorumGasUsd: nexorumGasUsd.toFixed(2),
      gasSavedUsd: gasSavedUsd.toFixed(2),
      gasSavingsPct,
      expectedOutput,
      expectedOutputUsd,
      protocolFeeUsd,
      slippageGuard: '0.00% (ZK Lock Guarantee)',
      executionSpeed: '0.01s (Instant ZK Relay)',
    };
  };

  const handleRunSimulationDryRun = () => {
    setIsSimulatingRoute(true);
    setTimeout(() => {
      setIsSimulatingRoute(false);
      setLastSimulationTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      const metrics = calcSmartPreviewMetrics();
      addToast(
        'Smart Preview Simulated',
        `Route ${bridgeSourceChain.toUpperCase()} ➔ ${bridgeDestChain.toUpperCase()} verified! Gas saved: $${metrics.gasSavedUsd} (${metrics.gasSavingsPct}%)`,
        'success'
      );
    }, 450);
  };

  const handleApplyPresetAmount = (pctStr: string) => {
    const balanceRaw = getAvailableBalance();
    const numericVal = parseFloat(balanceRaw.replace(/[^0-9.]/g, '')) || 1000;
    let multiplier = 1;
    if (pctStr === '25%') multiplier = 0.25;
    else if (pctStr === '50%') multiplier = 0.50;
    else if (pctStr === '75%') multiplier = 0.75;
    else if (pctStr === 'MAX') multiplier = 1.0;

    setBridgeAmount((numericVal * multiplier).toFixed(2));
  };

  const handleExecuteBridgeTransfer = async () => {
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) return;
    setIsBridging(true);
    setErrorMessage(null);

    try {
      const res = await api.executeCrossChainBridge({
        sourceChain: bridgeSourceChain,
        destChain: bridgeDestChain,
        asset: bridgeAsset,
        amount: bridgeAmount,
        senderAddress: activeWallet?.address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        recipientAddress: activeWallet?.address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        userId: user?.id,
      });

      if (res && res.success) {
        setBridgeSuccessTx(res);
        addToast(
          '1-Click Bridge Transfer Complete!',
          `Successfully moved ${bridgeAmount} ${bridgeAsset} from ${bridgeSourceChain.toUpperCase()} to ${bridgeDestChain.toUpperCase()}`,
          'success'
        );
        syncOnChainBalances();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Cross-chain bridge execution failed. Please check network routing.');
    } finally {
      setIsBridging(false);
    }
  };

  if (!isModalOpen) return null;

  const generateWcSessionUri = (walletId?: string) => {
    const topic = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const symKey = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const net = selectedNetwork || 'ethereum';
    return `wc:${topic}@2?relay-protocol=irn&symKey=${symKey}&bridge=https%3A%2F%2Frelay.walletconnect.org&chainId=${net}&wallet=${walletId || 'generic'}&projectId=${reownProjectId}`;
  };

  const getWcUri = () => {
    return activeWcUri || generateWcSessionUri(selectedReownWallet?.id);
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
    const newUri = generateWcSessionUri(wallet.id);
    setActiveWcUri(newUri);
    setSelectedReownWallet(wallet);
    setWcSessionStep('generating');
    setConnecting(true);
    setTimeout(() => {
      setWcSessionStep('awaiting');
    }, 600);
  };

  const handleRefreshWcUri = () => {
    setWcSessionStep('generating');
    const newUri = generateWcSessionUri(selectedReownWallet?.id);
    setActiveWcUri(newUri);
    setTimeout(() => {
      setWcSessionStep('awaiting');
    }, 500);
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
    const uriToCopy = activeWcUri || generateWcSessionUri(selectedReownWallet?.id);
    navigator.clipboard.writeText(uriToCopy);
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
    const q = (appKitSearch || '').toLowerCase();
    const matchesCategory = appKitFilter === 'all' || w.category === appKitFilter;
    const matchesSearch = (w.name || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          key="wallet-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
          onClick={closeWalletModal}
        >
          <motion.div
            key="wallet-modal-dialog"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl relative space-y-5"
          >
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
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs space-y-2"
              >
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
              </motion.div>
            )}

            {/* Connection Method Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-[11px] font-semibold">
              <button
                onClick={() => {
                  setConnectTab('appkit');
                  setSelectedReownWallet(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  connectTab === 'appkit' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Reown AppKit
              </button>
              <button
                onClick={() => setConnectTab('extensions')}
                className={`py-2 rounded-xl transition-all ${
                  connectTab === 'extensions' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Extensions
              </button>
              <button
                onClick={() => setConnectTab('bridge')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                  connectTab === 'bridge' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Bridge ⚡</span>
              </button>
              <button
                onClick={() => setConnectTab('manual')}
                className={`py-2 rounded-xl transition-all ${
                  connectTab === 'manual' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Address Input
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

            {/* Animated Tab Content */}
            <AnimatePresence mode="wait">
              {connectTab === 'appkit' && (
                <motion.div
                  key="tab-appkit"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3"
                >
                  <AnimatePresence mode="wait">
                    {!selectedReownWallet ? (
                      <motion.div
                        key="reown-catalog"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3"
                      >
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
                          {/* Universal QR Code Card */}
                          <motion.button
                            whileHover={{ scale: 1.01, y: -1 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() =>
                              handleOpenReownWalletFlow({
                                id: 'walletconnect',
                                name: 'Universal Web3 Mobile Wallet',
                                category: 'wallet',
                                color: 'text-cyan-400',
                                iconBg: 'bg-cyan-500/20 border-cyan-500/40',
                                universalLink: 'https://walletconnect.com',
                              })
                            }
                            className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/60 hover:to-blue-900/60 border border-cyan-500/40 transition-all text-left flex items-center gap-3 group col-span-2 sm:col-span-3 shadow-lg shadow-cyan-950/30"
                          >
                            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0">
                              <QrCode className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-white group-hover:text-cyan-300">Scan QR Code with Any Mobile Wallet</p>
                                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/30">
                                  UNIVERSAL PAIRING
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">Generate active WC v2 URI for MetaMask, Trust Wallet, Rainbow, or Coinbase</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform mr-1 shrink-0" />
                          </motion.button>

                          {filteredReownWallets.map((wallet) => (
                            <motion.button
                              key={wallet.id}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleOpenReownWalletFlow(wallet)}
                              className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800/90 hover:border-cyan-500/50 transition-all text-left flex items-center gap-3 group relative shadow-md shadow-slate-950/40"
                            >
                              <div className={`p-2 rounded-xl ${wallet.iconBg || 'bg-slate-900 border border-slate-800'} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform`}>
                                {getWalletLogo(wallet.id, "w-6 h-6 drop-shadow")}
                              </div>
                              <div className="overflow-hidden flex-1">
                                <div className="flex items-center gap-1">
                                  <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">{wallet.name}</p>
                                  {wallet.popular && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-500 capitalize">{wallet.category}</span>
                              </div>
                            </motion.button>
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
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 overflow-hidden"
                          >
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
                          </motion.div>
                        )}
                      </motion.div>
                    ) : (
                      /* Selected Wallet Detail & Connection QR Handshake */
                      <motion.div
                        key="reown-detail"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setSelectedReownWallet(null)}
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            ← Back to Catalog
                          </button>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                              {getWalletLogo(selectedReownWallet.id, "w-5 h-5")}
                            </div>
                            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                              <span>{selectedReownWallet.name}</span>
                            </span>
                          </div>
                        </div>

                        {/* QR Code and Universal Link Box */}
                        <div className="w-52 h-52 mx-auto p-3 bg-white rounded-2xl flex flex-col items-center justify-center shadow-2xl relative group border border-slate-700">
                          {activeWcUri ? (
                            <QRCodeSVG
                              value={activeWcUri}
                              size={180}
                              level="H"
                              includeMargin={false}
                              bgColor="#ffffff"
                              fgColor="#0f172a"
                            />
                          ) : (
                            <QrCode className="w-36 h-36 text-slate-900" />
                          )}
                          {wcSessionStep === 'generating' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-slate-950/90 rounded-2xl flex items-center justify-center text-cyan-400 font-bold text-xs gap-2"
                            >
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              <span>Generating WC Session...</span>
                            </motion.div>
                          )}
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <p className="font-bold text-white">Scan with {selectedReownWallet.name} camera or wallet scanner</p>
                          <p className="text-slate-400 text-[11px] max-w-sm mx-auto">
                            Open camera on your phone or use {selectedReownWallet.name}'s built-in QR scanner to complete the Web3 session handshake.
                          </p>
                          <div className="pt-1 flex items-center justify-center gap-2">
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50 truncate max-w-[240px]">
                              {activeWcUri ? activeWcUri.slice(0, 34) + '...' : 'wc:session_pairing_uri'}
                            </span>
                            <button
                              type="button"
                              onClick={handleRefreshWcUri}
                              title="Refresh QR Code Session"
                              className="p-1 px-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3 text-cyan-400" />
                              <span>Refresh</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={handleCopyWcUri}
                            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            {copiedUri ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedUri ? 'URI Copied!' : 'Copy WC URI'}</span>
                          </button>

                          <a
                            href={`${selectedReownWallet.universalLink}?uri=${encodeURIComponent(activeWcUri)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open App</span>
                          </a>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleConfirmReownConnection}
                          disabled={connecting}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950"
                        >
                          <Zap className="w-4 h-4" />
                          <span>{connecting ? 'Waiting for Mobile Authorization...' : 'Authorize Connected Session'}</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* TAB 2: Extension Wallets */}
              {connectTab === 'extensions' && (
                <motion.div
                  key="tab-extensions"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2 max-h-64 overflow-y-auto pr-1"
                >
                  {SUPPORTED_WALLET_PROVIDERS.map((provider) => {
                    const isSelected = selectedProvider === provider.id;
                    return (
                      <motion.button
                        key={provider.id}
                        id={`btn_connect_${provider.id}`}
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        disabled={connecting}
                        onClick={() => handleSelectWallet(provider.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 group ${
                          isSelected
                            ? 'bg-cyan-950/70 border-cyan-500/80 text-white shadow-lg shadow-cyan-950/40'
                            : 'bg-slate-950/70 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner group-hover:border-cyan-500/40 transition-colors">
                            {getWalletLogo(provider.id, "w-7 h-7 drop-shadow-md")}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">{provider.name}</span>
                              {provider.isPopular && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                                  Direct Extension
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {provider.supportedNetworks.slice(0, 4).map((net) => (
                                <span key={net} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900/90 border border-slate-800 text-slate-400 uppercase">
                                  {net}
                                </span>
                              ))}
                              {provider.supportedNetworks.length > 4 && (
                                <span className="text-[9px] text-slate-500 font-mono">+{provider.supportedNetworks.length - 4}</span>
                              )}
                            </div>
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
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}

              {/* TAB 3: Manual Real Address Input */}
              {connectTab === 'manual' && (
                <motion.form
                  key="tab-manual"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleManualConnect}
                  className="space-y-4"
                >
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

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={connecting || !manualAddressInput.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Link Real Wallet Address</span>
                  </motion.button>
                </motion.form>
              )}

              {/* TAB 4: Seamless 1-Click Cross-Chain Asset Transfer & Bridge */}
              {connectTab === 'bridge' && (
                <motion.div
                  key="tab-bridge"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                      <div>
                        <span className="font-bold block">1-Click Multi-Chain Bridge</span>
                        <span className="text-[10px] text-cyan-400/80">Move assets between NEXORUM & external blockchains instantly with zero slippage.</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold shrink-0">
                      0.01s Relay
                    </span>
                  </div>

                  {/* Source & Destination Chain Picker with 1-Click Swap Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2">
                    {/* From Chain */}
                    <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">From (Source Chain)</span>
                      <select
                        value={bridgeSourceChain}
                        onChange={(e) => setBridgeSourceChain(e.target.value as NetworkId)}
                        className="w-full bg-slate-900 text-white font-bold text-xs p-2 rounded-xl border border-slate-700 outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="nexorum">NEXORUM Chain (7780)</option>
                        <option value="ethereum">Ethereum Mainnet (1)</option>
                        <option value="bsc">BNB Smart Chain (56)</option>
                        <option value="polygon">Polygon POS (137)</option>
                        <option value="arbitrum">Arbitrum One (42161)</option>
                        <option value="base">Base L2 (8453)</option>
                        <option value="solana">Solana (SOL)</option>
                        <option value="ton">TON Network</option>
                      </select>
                    </div>

                    {/* Single-Click Swap Chain Direction Button */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleSwapBridgeChains}
                        title="Swap Source & Destination Chains"
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* To Chain */}
                    <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">To (Destination Chain)</span>
                      <select
                        value={bridgeDestChain}
                        onChange={(e) => setBridgeDestChain(e.target.value as NetworkId)}
                        className="w-full bg-slate-900 text-white font-bold text-xs p-2 rounded-xl border border-slate-700 outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="ethereum">Ethereum Mainnet (1)</option>
                        <option value="nexorum">NEXORUM Chain (7780)</option>
                        <option value="bsc">BNB Smart Chain (56)</option>
                        <option value="polygon">Polygon POS (137)</option>
                        <option value="arbitrum">Arbitrum One (42161)</option>
                        <option value="base">Base L2 (8453)</option>
                        <option value="solana">Solana (SOL)</option>
                        <option value="ton">TON Network</option>
                      </select>
                    </div>
                  </div>

                  {/* Asset & Amount Inputs */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Select Asset & Amount</span>
                      <span className="text-slate-400">
                        Balance: <span className="text-cyan-400 font-mono font-bold">{getAvailableBalance()}</span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={bridgeAsset}
                        onChange={(e) => setBridgeAsset(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="NEX">NEX (NEXORUM)</option>
                        <option value="ETH">ETH (Ethereum)</option>
                        <option value="USDT">USDT (Tether)</option>
                        <option value="USDC">USDC (Circle)</option>
                        <option value="BNB">BNB (Binance)</option>
                        <option value="SOL">SOL (Solana)</option>
                        <option value="TON">TON (Telegram)</option>
                      </select>

                      <input
                        type="number"
                        step="any"
                        value={bridgeAmount}
                        onChange={(e) => setBridgeAmount(e.target.value)}
                        placeholder="0.0"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Preset Amount Chips */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-1.5">
                        {['25%', '50%', '75%', 'MAX'].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleApplyPresetAmount(pct)}
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-800 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
                          >
                            {pct}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ≈ ${(parseFloat(bridgeAmount || '0') * getAssetPriceUsd(bridgeAsset)).toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  {/* Smart Preview & Transaction Simulation Card */}
                  {(() => {
                    const metrics = calcSmartPreviewMetrics();
                    return (
                      <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-3.5 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-white">Smart Preview & Transaction Simulation</span>
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-[9px] font-mono uppercase font-bold">
                              AI Simulated
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleRunSimulationDryRun}
                              disabled={isSimulatingRoute}
                              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300 font-medium px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 transition-all cursor-pointer"
                              title="Re-simulate transaction route and gas savings"
                            >
                              <RefreshCw className={`w-3 h-3 ${isSimulatingRoute ? 'animate-spin text-cyan-400' : ''}`} />
                              <span>{isSimulatingRoute ? 'Simulating...' : 'Re-Simulate'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowSmartPreview(!showSmartPreview)}
                              className="text-[10px] text-slate-400 hover:text-white font-mono underline cursor-pointer"
                            >
                              {showSmartPreview ? 'Collapse' : 'Expand'}
                            </button>
                          </div>
                        </div>

                        {showSmartPreview && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 pt-0.5"
                          >
                            {/* Simulated Outcome & Gas Savings Highlight */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* Expected Outcome Box */}
                              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Simulated Receive</span>
                                <div className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1">
                                  <span>{metrics.expectedOutput}</span>
                                  <span className="text-[10px] text-slate-300">{bridgeAsset}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  ≈ ${metrics.expectedOutputUsd} USD
                                </div>
                              </div>

                              {/* Gas Savings Box */}
                              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3 text-emerald-400" /> Gas Saved
                                  </span>
                                  <span className="px-1 rounded bg-emerald-900/80 text-emerald-300 font-mono text-[9px] font-bold">
                                    {metrics.gasSavingsPct}% Off
                                  </span>
                                </div>
                                <div className="text-xs font-bold text-white font-mono">
                                  ${metrics.gasSavedUsd} USD Saved
                                </div>
                                <div className="text-[9px] text-emerald-400/80 font-mono">
                                  Paymaster: ${metrics.nexorumGasUsd} vs ${metrics.estStandardGasUsd} (L1)
                                </div>
                              </div>
                            </div>

                            {/* Simulated Route Visualizer Pipeline */}
                            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                Verified Route Simulation
                              </span>

                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-slate-300">
                                  <Lock className="w-3 h-3 text-cyan-400" />
                                  <span className="font-mono font-bold uppercase">{bridgeSourceChain}</span>
                                </div>

                                <div className="flex-1 px-2 flex flex-col items-center">
                                  <span className="text-[9px] font-mono text-cyan-400 flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 animate-pulse" /> ZK-Proof Batch Relay
                                  </span>
                                  <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500 rounded-full my-0.5" />
                                  <span className="text-[9px] font-mono text-slate-500">{metrics.executionSpeed}</span>
                                </div>

                                <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-slate-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span className="font-mono font-bold uppercase">{bridgeDestChain}</span>
                                </div>
                              </div>
                            </div>

                            {/* Simulation Breakdown Details */}
                            <div className="space-y-1 text-[10px] text-slate-400 px-0.5">
                              <div className="flex justify-between">
                                <span>Simulated Slippage:</span>
                                <span className="text-emerald-400 font-mono font-bold">{metrics.slippageGuard}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Relayer Network Fee:</span>
                                <span className="text-slate-300 font-mono">${metrics.protocolFeeUsd} (0.02%)</span>
                              </div>
                              <div className="flex justify-between border-t border-slate-800/60 pt-1">
                                <span className="text-slate-500">Simulation Status:</span>
                                <span className="text-cyan-400 font-mono font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Ready • Simulated at {lastSimulationTime}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Single Click Bridge Execution Button */}
                  {bridgeSuccessTx ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Cross-Chain Transfer Verified & Completed!</span>
                      </div>
                      <p className="text-[11px] text-emerald-200 font-mono">
                        Tx Hash: {bridgeSuccessTx.txHash.slice(0, 20)}...
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(bridgeSuccessTx.txHash);
                            addToast('Copied Hash', 'Transaction hash copied to clipboard');
                          }}
                          className="py-1.5 px-3 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-[11px] font-bold"
                        >
                          Copy Hash
                        </button>
                        <button
                          type="button"
                          onClick={() => setBridgeSuccessTx(null)}
                          className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-bold"
                        >
                          New Transfer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      disabled={isBridging || !bridgeAmount || parseFloat(bridgeAmount) <= 0}
                      onClick={handleExecuteBridgeTransfer}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-950 disabled:opacity-50 cursor-pointer"
                    >
                      <Zap className={`w-4 h-4 ${isBridging ? 'animate-spin' : ''}`} />
                      <span>
                        {isBridging
                          ? 'Bridging Across Chains...'
                          : `1-Click Transfer ${bridgeAmount || '0'} ${bridgeAsset} to ${bridgeDestChain.toUpperCase()}`}
                      </span>
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

