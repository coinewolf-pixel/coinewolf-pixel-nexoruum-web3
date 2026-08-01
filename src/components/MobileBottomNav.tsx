import React from 'react';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  Bot,
  Menu,
  ShieldAlert,
  ShoppingBag,
  User,
  Search,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotifications } from '../context/NotificationContext';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
}) => {
  const { unreadCount } = useNotifications();

  const primaryItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'creator', label: 'Create', icon: PlusCircle },
    { id: 'ai', label: 'AI Agent', icon: Bot },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileDrawerOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-2xl md:hidden select-none pb-safe">
      <div className="grid grid-cols-5 h-16 items-center px-1 max-w-lg mx-auto">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !isMobileDrawerOpen;

          return (
            <button
              key={item.id}
              id={`mobile_nav_btn_${item.id}`}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 min-h-[44px] relative',
                isActive
                  ? 'text-cyan-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5 transition-transform', isActive ? 'text-cyan-400' : 'text-slate-400')} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5 truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu Drawer Toggle Button */}
        <button
          id="mobile_nav_btn_menu"
          onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
          className={cn(
            'flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 min-h-[44px] relative',
            isMobileDrawerOpen
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200 active:scale-95'
          )}
        >
          <div className="relative">
            <Menu className={cn('w-5 h-5', isMobileDrawerOpen ? 'text-cyan-400 rotate-90 transition-transform' : 'text-slate-400')} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-950 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
};
