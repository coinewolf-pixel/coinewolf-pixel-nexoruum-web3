import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { api } from '../services/api';
import { nexorumBus } from '../lib/nexorumKernel';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  toasts: Toast[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  markAsRead: (id: string) => void;
  addToast: (
    titleOrObj: string | { title: string; message: string; type?: Toast['type'] },
    message?: string,
    type?: Toast['type']
  ) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    api.getNotifications().then((res) => {
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    });

    // Listen to NEXORUM Kernel Event Bus
    const handleWalletConnected = (wallet: any) => {
      addToast('Wallet Connected', `Connected ${wallet.providerName} (${wallet.address.slice(0, 6)}...)`, 'success');
    };

    const handleTokenCreated = (token: any) => {
      addToast('Token Created', `${token.name} (${token.symbol}) published on NEXORUM Blockchain Engine`, 'success');
      setNotifications((prev) => [
        {
          id: `notif_${Date.now()}`,
          title: 'Token Created & Published',
          message: `${token.name} (${token.symbol}) is now live and listed across Home & Discover.`,
          type: 'TOKEN',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    };

    nexorumBus.on('WALLET_CONNECTED', handleWalletConnected);
    nexorumBus.on('TOKEN_CREATED', handleTokenCreated);

    return () => {
      nexorumBus.off('WALLET_CONNECTED', handleWalletConnected);
      nexorumBus.off('TOKEN_CREATED', handleTokenCreated);
    };
  }, []);

  const addToast = (
    titleOrObj: string | { title: string; message: string; type?: Toast['type'] },
    message?: string,
    type: Toast['type'] = 'info'
  ) => {
    let titleStr = '';
    let msgStr = '';
    let toastType = type;

    if (typeof titleOrObj === 'object' && titleOrObj !== null) {
      titleStr = titleOrObj.title;
      msgStr = titleOrObj.message;
      toastType = titleOrObj.type || 'info';
    } else {
      titleStr = String(titleOrObj || '');
      msgStr = String(message || '');
    }

    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, title: titleStr, message: msgStr, type: toastType }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const markAsRead = (id: string) => {
    api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        markAsRead,
        addToast,
        removeToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
