import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Wallet,
  Bell,
  ChevronDown,
  Flame,
  Send,
  UserCheck,
  Globe,
  Plus,
  Zap,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Sun,
  Moon,
  Check,
  Cpu,
  Server,
  Radio,
  Layers,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { formatAddress } from '../lib/utils';
import { NetworkId, NetworkInfo } from '../types';
import { getWalletLogo } from './WalletLogos';

interface TopNavProps {
  setActiveTab: (tab: string) => void;
  openTelegramModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ setActiveTab, openTelegramModal }) => {
  const { activeWallet, activeNetwork, networks, switchNetwork, openWalletModal } = useWallet();
  const { user, isAdminUnlocked } = useAuth();
  const { unreadCount, openDrawer, addToast } = useNotifications();
  const { theme, toggleTheme, isDark } = useTheme();

  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close network dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNetworkDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectNetwork = (net: NetworkInfo) => {
    switchNetwork(net.id);
    setIsNetworkDropdownOpen(false);
    addToast(
      'Network Context Updated',
      `Switched provider to ${net.name} (Chain ID: ${net.chainId})`,
      'info'
    );
  };

  const isNexoMainnet = activeNetwork?.id === 'nexorum';
  const isNexoTestnet = activeNetwork?.id === 'nexorum_testnet';

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          id="btn_global_search_trigger"
          onClick={() => setActiveTab('search')}
          className="w-full flex items-center gap-3 bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700 px-3.5 py-2 rounded-xl text-sm transition-all duration-200 group"
        >
          <Search className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          <span className="text-slate-400 truncate">Search tokens, wallets, NFTs...</span>
          <kbd className="ml-auto hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-slate-800 rounded border border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Admin Badge - Only shown when admin mode is explicitly unlocked */}
        {isAdminUnlocked && (
          <button
            id="btn_top_admin_mode_badge"
            onClick={() => setActiveTab('admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Admin Unlocked</span>
          </button>
        )}

        {/* Dedicated Network Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="btn_network_switcher"
            onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${
              isNexoMainnet
                ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-200 hover:bg-emerald-900/80 shadow-lg shadow-emerald-950/40'
                : isNexoTestnet
                ? 'bg-amber-950/70 border-amber-600/60 text-amber-200 hover:bg-amber-900/80 shadow-lg shadow-amber-950/40'
                : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-800'
            }`}
            title="Switch Blockchain Network & Environment Provider"
          >
            <div
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                isNexoMainnet
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : isNexoTestnet
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'bg-cyan-400'
              }`}
            />
            <span className="font-bold truncate max-w-[130px]">
              {activeNetwork?.name || 'NEXORUM Mainnet'}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-300 bg-slate-950/90 px-1.5 py-0.5 rounded-lg border border-slate-800">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>{activeNetwork?.gasPriceGwei || 0.01} Gwei</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isNetworkDropdownOpen ? 'rotate-180 text-cyan-400' : ''
              }`}
            />
          </button>

          {/* Network Switcher Dropdown Modal */}
          <AnimatePresence>
            {isNetworkDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute right-0 mt-2.5 w-80 sm:w-88 bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-2xl space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-2 pt-1 border-b border-slate-900 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                      Network & RPC Provider
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-md font-bold">
                    Chain ID: {activeNetwork?.chainId || 7780}
                  </span>
                </div>

                {/* Dedicated NEXORUM Environment Switcher Toggle */}
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      NEXORUM Core Environment
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Instant Context Switch</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* NEXORUM Mainnet Card */}
                    {(() => {
                      const mainnetObj = networks.find((n) => n.id === 'nexorum') || {
                        id: 'nexorum' as NetworkId,
                        name: 'NEXORUM Mainnet',
                        chainId: 7780,
                        symbol: 'NEX',
                        gasPriceGwei: 0.01,
                      };
                      const isSelected = activeNetwork?.id === 'nexorum';
                      return (
                        <button
                          key="nexorum_mainnet_btn"
                          type="button"
                          onClick={() => handleSelectNetwork(mainnetObj as NetworkInfo)}
                          className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/50'
                              : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              🟢 Mainnet
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <span className="text-xs font-bold text-white block mt-1">NEXORUM Mainnet</span>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            ID: 7780 • 0.01 Gwei
                          </span>
                        </button>
                      );
                    })()}

                    {/* NEXORUM Testnet Card */}
                    {(() => {
                      const testnetObj = networks.find((n) => n.id === 'nexorum_testnet') || {
                        id: 'nexorum_testnet' as NetworkId,
                        name: 'NEXORUM Testnet',
                        chainId: 7781,
                        symbol: 'tNEX',
                        gasPriceGwei: 0.001,
                      };
                      const isSelected = activeNetwork?.id === 'nexorum_testnet';
                      return (
                        <button
                          key="nexorum_testnet_btn"
                          type="button"
                          onClick={() => handleSelectNetwork(testnetObj as NetworkInfo)}
                          className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-amber-950/80 border-amber-500 text-amber-100 ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/50'
                              : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              🟡 Testnet
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <span className="text-xs font-bold text-white block mt-1">NEXORUM Testnet</span>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            ID: 7781 • Sepolia RPC
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Multi-Chain Cross Bridges List */}
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-cyan-500" />
                    Cross-Chain EVM & L1 Networks
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {networks
                      .filter((net) => net.id !== 'nexorum' && net.id !== 'nexorum_testnet')
                      .map((net) => {
                        const isSelected = activeNetwork?.id === net.id;
                        return (
                          <button
                            key={net.id}
                            type="button"
                            onClick={() => handleSelectNetwork(net)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-bold'
                                : 'text-slate-300 hover:bg-slate-900/90 border border-transparent hover:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="truncate">{net.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {net.gasPriceGwei} Gwei
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Active Provider Info Footer */}
                <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>RPC Status:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Operational (0ms)
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Theme Toggle Button */}
        <button
          id="btn_theme_toggle"
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${
            isDark
              ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 text-slate-200 hover:border-cyan-500/40'
              : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
          }`}
          title={`Switch to ${isDark ? 'Minimalist Light' : 'Cybernetic Dark'} Mode`}
        >
          {isDark ? (
            <>
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-mono text-[11px] text-cyan-300">Cybernetic Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline font-mono text-[11px] text-amber-700">Minimalist Light</span>
            </>
          )}
        </button>

        {/* Telegram Auth Button */}
        {user?.telegramId ? (
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300">
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 font-mono">@{user.telegramUsername}</span>
          </div>
        ) : (
          <button
            id="btn_telegram_auth_trigger"
            onClick={openTelegramModal}
            className="flex items-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Telegram Login</span>
          </button>
        )}

        {/* Wallet Connect Button */}
        <button
          id="btn_connect_wallet_main"
          onClick={openWalletModal}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
            activeWallet
              ? 'bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-slate-800'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25'
          }`}
        >
          {activeWallet ? getWalletLogo(activeWallet.provider, "w-4 h-4") : <Wallet className="w-4 h-4" />}
          <span>
            {activeWallet
              ? `${activeWallet.providerName} (${formatAddress(activeWallet.address)})`
              : 'Connect Wallet'}
          </span>
        </button>

        {/* Quick Token Creator Trigger */}
        <button
          id="btn_quick_token_creator"
          onClick={() => setActiveTab('creator')}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors hidden md:flex items-center justify-center cursor-pointer"
          title="Create Token"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Notifications Drawer Bell */}
        <button
          id="btn_notifications_bell"
          onClick={openDrawer}
          className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-md shadow-rose-950">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Avatar */}
        <button
          id="btn_top_profile_avatar"
          onClick={() => setActiveTab('profile')}
          className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700/80 hover:border-cyan-400 transition-colors p-[1px] bg-slate-800 cursor-pointer"
        >
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80'}
            alt="Profile Avatar"
            className="w-full h-full object-cover rounded-[10px]"
          />
        </button>
      </div>
    </header>
  );
};
