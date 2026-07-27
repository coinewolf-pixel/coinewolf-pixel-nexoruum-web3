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
} from 'lucide-react';
import { useWallet, SUPPORTED_WALLET_PROVIDERS } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { WalletProviderId, NetworkId } from '../types';

const WALLET_ICONS: Record<WalletProviderId, React.ReactNode> = {
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

export const WalletModal: React.FC = () => {
  const { isModalOpen, closeWalletModal, connectWalletProvider, activeNetwork } = useWallet();
  const { clearDemoWallets } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<WalletProviderId | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>(activeNetwork?.id || 'ethereum');
  const [connectTab, setConnectTab] = useState<'extensions' | 'manual' | 'qr'>('extensions');
  const [manualAddressInput, setManualAddressInput] = useState('');

  if (!isModalOpen) return null;

  const handleSelectWallet = async (id: WalletProviderId) => {
    setSelectedProvider(id);
    setConnecting(true);

    try {
      await connectWalletProvider(id, selectedNetwork);
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
      setSelectedProvider(null);
    }
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAddressInput.trim()) return;
    setConnecting(true);
    try {
      await connectWalletProvider('walletconnect', selectedNetwork, manualAddressInput.trim());
      setManualAddressInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const handleResetDemoWallets = () => {
    clearDemoWallets();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          id="btn_close_wallet_modal"
          onClick={closeWalletModal}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-1">
            <Zap className="w-4 h-4" />
            <span>NEXORUM Web3 Connect Engine</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Connect Real Web3 Wallet</h2>
          <p className="text-slate-400 text-xs mt-1">
            Connect your Browser Extension (MetaMask, Phantom, Trust), paste your real wallet address, or scan with WalletConnect.
          </p>
        </div>

        {/* Connection Method Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setConnectTab('extensions')}
            className={`py-2 rounded-xl transition-all ${
              connectTab === 'extensions' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Browser Wallet
          </button>
          <button
            onClick={() => setConnectTab('manual')}
            className={`py-2 rounded-xl transition-all ${
              connectTab === 'manual' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Real Address Input
          </button>
          <button
            onClick={() => setConnectTab('qr')}
            className={`py-2 rounded-xl transition-all ${
              connectTab === 'qr' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            WalletConnect QR
          </button>
        </div>

        {/* Target Network Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Network</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['ethereum', 'bsc', 'polygon', 'arbitrum', 'base', 'solana', 'ton'] as NetworkId[]).map((net) => (
              <button
                key={net}
                onClick={() => setSelectedNetwork(net)}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium uppercase tracking-wider transition-all border ${
                  selectedNetwork === net
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-md shadow-cyan-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {net}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Extension Wallets */}
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
                            Detecting...
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
                        <span>Connecting...</span>
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

        {/* Tab 2: Manual Real Address Input */}
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

        {/* Tab 3: WalletConnect QR */}
        {connectTab === 'qr' && (
          <div className="space-y-4 text-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-44 h-44 mx-auto p-3 bg-white rounded-2xl flex items-center justify-center shadow-inner">
              <QrCode className="w-36 h-36 text-slate-900" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Scan with WalletConnect App</p>
              <p className="text-[11px] text-slate-400 mt-1">Open MetaMask, Trust Wallet, or Tonkeeper mobile app and scan to authorize.</p>
            </div>
            <button
              onClick={() => handleSelectWallet('walletconnect')}
              className="py-2 px-4 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/30 transition-all"
            >
              Simulate Mobile Session Handshake
            </button>
          </div>
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
          <span className="text-slate-500">NEXORUM Web3 Engine v2.4</span>
        </div>
      </div>
    </div>
  );
};
