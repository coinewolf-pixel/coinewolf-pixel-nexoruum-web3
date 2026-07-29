import React, { useState } from 'react';
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
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { formatAddress } from '../lib/utils';
import { NetworkId } from '../types';
import { getWalletLogo } from './WalletLogos';

interface TopNavProps {
  setActiveTab: (tab: string) => void;
  openTelegramModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ setActiveTab, openTelegramModal }) => {
  const { activeWallet, activeNetwork, networks, switchNetwork, openWalletModal } = useWallet();
  const { user, isAdminUnlocked, toggleUserRole } = useAuth();
  const { unreadCount, openDrawer } = useNotifications();
  const { theme, toggleTheme, isDark } = useTheme();

  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);

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

        {/* Dynamic Network Switcher */}
        <div className="relative">
          <button
            id="btn_network_switcher"
            onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{activeNetwork?.name || 'Ethereum'}</span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>{activeNetwork?.gasPriceGwei || 14} Gwei</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isNetworkDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 backdrop-blur-2xl">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                NEXORUM Blockchain Engine
              </div>
              {networks.map((net) => (
                <button
                  key={net.id}
                  onClick={() => {
                    switchNetwork(net.id as NetworkId);
                    setIsNetworkDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeNetwork?.id === net.id
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{net.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{net.gasPriceGwei} Gwei</span>
                </button>
              ))}
            </div>
          )}
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
            className="flex items-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Telegram Login</span>
          </button>
        )}

        {/* Wallet Connect Button */}
        <button
          id="btn_connect_wallet_main"
          onClick={openWalletModal}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
            activeWallet
              ? 'bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-slate-800'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25'
          }`}
        >
          {activeWallet ? getWalletLogo(activeWallet.providerId, "w-4 h-4") : <Wallet className="w-4 h-4" />}
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
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors hidden md:flex items-center justify-center"
          title="Create Token"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Notifications Drawer Bell */}
        <button
          id="btn_notifications_bell"
          onClick={openDrawer}
          className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
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
          className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700/80 hover:border-cyan-400 transition-colors p-[1px] bg-slate-800"
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
