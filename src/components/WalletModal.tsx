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
} from 'lucide-react';
import { useWallet, SUPPORTED_WALLET_PROVIDERS } from '../context/WalletContext';
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
  const [selectedProvider, setSelectedProvider] = useState<WalletProviderId | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>(activeNetwork?.id || 'ethereum');

  if (!isModalOpen) return null;

  const handleSelectWallet = async (id: WalletProviderId) => {
    setSelectedProvider(id);
    setConnecting(true);

    // Simulate instant secure handshake & signature request
    setTimeout(async () => {
      await connectWalletProvider(id, selectedNetwork);
      setConnecting(false);
      setSelectedProvider(null);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-6">
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
            <span>NEXORUM Wallet Engine</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Connect Web3 Wallet</h2>
          <p className="text-slate-400 text-xs mt-1">
            Select your preferred Web3 or TON wallet to authenticate with NEXORUM Kernel.
          </p>
        </div>

        {/* Target Network Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Target Blockchain Network</label>
          <div className="grid grid-cols-4 gap-2">
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

        {/* Wallet List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {SUPPORTED_WALLET_PROVIDERS.map((provider) => {
            const isSelected = selectedProvider === provider.id;
            return (
              <button
                key={provider.id}
                id={`btn_connect_${provider.id}`}
                disabled={connecting}
                onClick={() => handleSelectWallet(provider.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 group ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500/80 text-white'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    {WALLET_ICONS[provider.id]}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{provider.name}</span>
                      {provider.isPopular && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                          Popular
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Supports {provider.supportedNetworks.slice(0, 3).join(', ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  {isSelected && connecting ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 animate-pulse">
                      <Zap className="w-4 h-4 animate-spin" />
                      <span>Signing...</span>
                    </div>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            NEXORUM OS cryptography validates signatures on-chain via Web Standard SubtleCrypto APIs.
          </p>
        </div>
      </div>
    </div>
  );
};
