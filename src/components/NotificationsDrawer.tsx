import React from 'react';
import { X, Bell, Check, Wallet, Zap, ShoppingBag, Bot, ExternalLink } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { timeAgo } from '../lib/utils';
import { SwipeableContainer } from './SwipeableContainer';

export const NotificationsDrawer: React.FC = () => {
  const { isDrawerOpen, closeDrawer, notifications, markAsRead } = useNotifications();

  if (!isDrawerOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'WALLET':
        return <Wallet className="w-4 h-4 text-cyan-400" />;
      case 'TOKEN':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'MARKET':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'AI':
        return <Bot className="w-4 h-4 text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <SwipeableContainer
      onClose={closeDrawer}
      direction="right"
      backdropClassName="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm"
      className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl"
      showHandle={true}
      handleClassName="sm:hidden border-b border-slate-800/40"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base">NEXORUM Notifications</h3>
        </div>
        <button
          id="btn_close_notifications_drawer"
          onClick={closeDrawer}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No new notifications</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                notif.isRead
                  ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                  : 'bg-slate-950 border-cyan-500/30 text-slate-200 shadow-md shadow-cyan-950/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </SwipeableContainer>
  );
};

