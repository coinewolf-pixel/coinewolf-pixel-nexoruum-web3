import React from 'react';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  ShoppingBag,
  Bot,
  Search,
  User,
  ShieldAlert,
  Zap,
  Layers,
  ChevronRight,
  Sparkles,
  Lock,
  Unlock,
  ExternalLink,
  ShieldCheck,
  Cpu,
  X,
  Smartphone,
  Monitor,
  CheckCircle2,
} from 'lucide-react';
import { NEXORUM_PLUGIN_MANIFEST } from '../lib/nexorumKernel';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useDeviceDetect } from '../hooks/useDeviceDetect';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  Compass: <Compass className="w-5 h-5" />,
  PlusCircle: <PlusCircle className="w-5 h-5" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5" />,
  Cpu: <Cpu className="w-5 h-5" />,
  Bot: <Bot className="w-5 h-5" />,
  Search: <Search className="w-5 h-5" />,
  User: <User className="w-5 h-5" />,
  ShieldAlert: <ShieldAlert className="w-5 h-5" />,
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
}) => {
  const { user, isAdminUnlocked } = useAuth();
  const deviceInfo = useDeviceDetect();

  const userMenuItems = NEXORUM_PLUGIN_MANIFEST.menu.filter((item) => item.id !== 'admin');
  const adminMenuItem = NEXORUM_PLUGIN_MANIFEST.menu.find((item) => item.id === 'admin');

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950/95 backdrop-blur-2xl text-slate-100 select-none overflow-hidden">
      {/* OS Kernel Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white tracking-wider text-base">NEXORUM</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                OS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Web3 Platform v1.0</p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobileDrawer && (
          <button
            onClick={onCloseMobileDrawer}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            aria-label="Close Mobile Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Web3 Network Sync Badge */}
      <div className="mx-3 my-2 p-2 rounded-xl bg-slate-900/60 border border-emerald-500/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <div className="truncate">
            <span className="text-white font-bold block text-[11px]">NEXORUM Chain Engine</span>
            <span className="text-[9px] text-emerald-400 font-mono truncate block">
              Web3 Mainnet Sync Active
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {/* Regular User Workspace */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase flex items-center justify-between">
            <span>Workspace Modules</span>
            <span className="text-[9px] text-cyan-400 font-mono">ACTIVE</span>
          </div>
          {userMenuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav_btn_${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-3 md:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative cursor-pointer min-h-[44px]',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-600/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent active:bg-slate-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'transition-colors duration-200',
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    )}
                  >
                    {ICON_MAP[item.icon] || <Layers className="w-5 h-5" />}
                  </span>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider',
                        item.badge === 'HOT'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isActive ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Separated Administration Gate - Hidden from regular clients */}
        {adminMenuItem && (isAdminUnlocked || activeTab === 'admin') && (
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-rose-400 uppercase flex items-center justify-between">
              <span>Admin Control Gate</span>
              {isAdminUnlocked ? (
                <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> UNLOCKED
                </span>
              ) : (
                <span className="text-[9px] text-rose-400 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" /> LOCKED
                </span>
              )}
            </div>

            <button
              id={`nav_btn_${adminMenuItem.id}`}
              onClick={() => handleNavClick('admin')}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative cursor-pointer min-h-[44px]',
                activeTab === 'admin'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-md shadow-rose-950/40'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900/60 border border-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'transition-colors duration-200',
                    activeTab === 'admin' ? 'text-rose-400' : 'text-rose-500/80 group-hover:text-rose-300'
                  )}
                >
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <span>System Admin Panel</span>
              </div>

              <div className="flex items-center gap-1.5">
                {isAdminUnlocked ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
            </button>
          </div>
        )}
      </nav>

      {/* AI Engine Status Banner */}
      <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-200">Gemini AI Engine</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          Realtime market & portfolio predictions active.
        </p>
        <button
          id="btn_ai_quick_prompt"
          onClick={() => handleNavClick('ai')}
          className="mt-2.5 w-full py-2 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
        >
          <span>Ask AI Assistant</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/60 text-[11px] text-slate-500 flex items-center justify-between">
        <span>NEXORUM Web3 v1.0</span>
        <span className="font-mono text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Mainnet Sync</span>
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-800/80 flex-col h-screen sticky top-0 z-40 select-none shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Navigation Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobileDrawer}
          />
          {/* Slide-in drawer container */}
          <div className="relative w-4/5 max-w-xs h-full bg-slate-950 border-r border-slate-800 shadow-2xl animate-in slide-in-from-left duration-250 z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

