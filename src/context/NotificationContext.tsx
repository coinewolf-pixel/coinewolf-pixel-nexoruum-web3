import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppNotification } from '../types';
import { api } from '../services/api';
import { nexorumBus } from '../lib/nexorumKernel';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface PortfolioAlertSettings {
  isEnabled: boolean;
  thresholdPercent: number; // e.g., 1.5, 3.0, 5.0, 10.0
  soundEnabled: boolean;
  notifyOnSurge: boolean;
  notifyOnCrash: boolean;
  checkIntervalSeconds: number;
}

export interface PortfolioAlertRecord {
  id: string;
  symbol: string;
  name: string;
  oldPriceUsd: number;
  newPriceUsd: number;
  changePercent: number;
  direction: 'SURGE' | 'CRASH';
  portfolioImpactUsd: number;
  timestamp: string;
  isRead: boolean;
}

const DEFAULT_ALERT_SETTINGS: PortfolioAlertSettings = {
  isEnabled: true,
  thresholdPercent: 3.0,
  soundEnabled: true,
  notifyOnSurge: true,
  notifyOnCrash: true,
  checkIntervalSeconds: 30,
};

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

  // Portfolio Alert System
  portfolioAlertSettings: PortfolioAlertSettings;
  updatePortfolioAlertSettings: (newSettings: Partial<PortfolioAlertSettings>) => void;
  portfolioAlertsHistory: PortfolioAlertRecord[];
  checkPortfolioVolatility: (
    holdings: Array<{
      id?: string;
      symbol: string;
      name: string;
      amount?: number;
      fallbackPriceUsd?: number;
      currentPriceUsd?: number;
      change24hPercent?: number;
    }>
  ) => void;
  triggerVolatilitySimulation: (customSymbol?: string, customChangePct?: number) => void;
  clearAlertsHistory: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Portfolio Alert Settings state
  const [portfolioAlertSettings, setPortfolioAlertSettings] = useState<PortfolioAlertSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexorum_portfolio_alert_settings');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse portfolio alert settings:', e);
      }
    }
    return DEFAULT_ALERT_SETTINGS;
  });

  // Portfolio Alert History log
  const [portfolioAlertsHistory, setPortfolioAlertsHistory] = useState<PortfolioAlertRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexorum_portfolio_alert_history');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse portfolio alert history:', e);
      }
    }
    return [
      {
        id: 'alert_initial_1',
        symbol: 'ETH',
        name: 'Ethereum',
        oldPriceUsd: 3250.00,
        newPriceUsd: 3412.65,
        changePercent: 5.00,
        direction: 'SURGE',
        portfolioImpactUsd: 398.50,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: false,
      },
      {
        id: 'alert_initial_2',
        symbol: 'NEXO',
        name: 'NEXORUM Native',
        oldPriceUsd: 0.078,
        newPriceUsd: 0.085,
        changePercent: 8.97,
        direction: 'SURGE',
        portfolioImpactUsd: 875.00,
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        isRead: true,
      },
    ];
  });

  // Track last alert timestamp per token to avoid spam (cooldown 45s)
  const lastAlertTimes = useRef<Record<string, number>>({});

  // Save settings and history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexorum_portfolio_alert_settings', JSON.stringify(portfolioAlertSettings));
    }
  }, [portfolioAlertSettings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexorum_portfolio_alert_history', JSON.stringify(portfolioAlertsHistory));
    }
  }, [portfolioAlertsHistory]);

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

    const handleMarketAlert = (alert: any) => {
      console.log('[Kernel Event Bus] Market Alert Received:', alert);
    };

    nexorumBus.on('WALLET_CONNECTED', handleWalletConnected);
    nexorumBus.on('TOKEN_CREATED', handleTokenCreated);
    nexorumBus.on('MARKET_ALERT', handleMarketAlert);

    return () => {
      nexorumBus.off('WALLET_CONNECTED', handleWalletConnected);
      nexorumBus.off('TOKEN_CREATED', handleTokenCreated);
      nexorumBus.off('MARKET_ALERT', handleMarketAlert);
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

  const updatePortfolioAlertSettings = (newSettings: Partial<PortfolioAlertSettings>) => {
    setPortfolioAlertSettings((prev) => ({ ...prev, ...newSettings }));
    addToast('Alert Settings Updated ⚙️', 'Portfolio volatility alert thresholds saved.', 'info');
  };

  const clearAlertsHistory = () => {
    setPortfolioAlertsHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexorum_portfolio_alert_history');
    }
    addToast('Alert Log Cleared 🧹', 'Cleared portfolio volatility alert history.', 'info');
  };

  // Sound effect trigger for push notifications
  const playAlertSound = (direction: 'SURGE' | 'CRASH') => {
    if (!portfolioAlertSettings.soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (direction === 'SURGE') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2); // A5
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.25); // A3
      }

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (err) {
      console.warn('Audio playback notice:', err);
    }
  };

  // Monitor real-time price volatility in user holdings
  const checkPortfolioVolatility = (
    holdings: Array<{
      id?: string;
      symbol: string;
      name: string;
      amount?: number;
      fallbackPriceUsd?: number;
      currentPriceUsd?: number;
      change24hPercent?: number;
    }>
  ) => {
    if (!portfolioAlertSettings.isEnabled) return;

    const threshold = portfolioAlertSettings.thresholdPercent;
    const nowMs = Date.now();

    holdings.forEach((h) => {
      const changePct = h.change24hPercent ?? 0;
      const price = h.currentPriceUsd || h.fallbackPriceUsd || 1.0;
      const amount = h.amount || 1;
      const absChange = Math.abs(changePct);

      if (absChange >= threshold) {
        // Cooldown check: 45s per token
        const lastAlert = lastAlertTimes.current[h.symbol] || 0;
        if (nowMs - lastAlert < 45000) return;
        lastAlertTimes.current[h.symbol] = nowMs;

        const direction: 'SURGE' | 'CRASH' = changePct >= 0 ? 'SURGE' : 'CRASH';

        // Check user preferences for Surge / Crash
        if (direction === 'SURGE' && !portfolioAlertSettings.notifyOnSurge) return;
        if (direction === 'CRASH' && !portfolioAlertSettings.notifyOnCrash) return;

        const impactUsd = amount * price * (changePct / 100);

        const newRecord: PortfolioAlertRecord = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          symbol: h.symbol,
          name: h.name,
          oldPriceUsd: price / (1 + changePct / 100),
          newPriceUsd: price,
          changePercent: changePct,
          direction,
          portfolioImpactUsd: impactUsd,
          timestamp: new Date().toISOString(),
          isRead: false,
        };

        // Add to history log
        setPortfolioAlertsHistory((prev) => [newRecord, ...prev.slice(0, 49)]);

        // Dispatch real-time push notification toast
        addToast({
          title: `⚡ Volatility Alert: ${h.symbol} ${direction === 'SURGE' ? 'Surged +' : 'Dropped '}${absChange.toFixed(2)}%`,
          message: `${h.name} (${h.symbol}) price is now $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Portfolio value impact: ${impactUsd >= 0 ? '+' : ''}$${impactUsd.toFixed(2)} USD.`,
          type: direction === 'SURGE' ? 'success' : 'warning',
        });

        // Add persistent AppNotification into drawer
        setNotifications((prev) => [
          {
            id: `notif_vol_${Date.now()}`,
            title: `Portfolio Volatility: ${h.symbol} ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
            message: `${h.name} (${h.symbol}) crossed your volatility threshold (${threshold}%). Current price: $${price.toFixed(2)}`,
            type: 'MARKET',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);

        // Play alert audio chime
        playAlertSound(direction);

        // Emit to NEXORUM kernel event bus
        nexorumBus.emit('MARKET_ALERT', newRecord);
      }
    });
  };

  // Interactive Volatility Alert Simulation Trigger
  const triggerVolatilitySimulation = (customSymbol?: string, customChangePct?: number) => {
    const sampleAssets = [
      { symbol: 'ETH', name: 'Ethereum', price: 3412.65, amount: 2.45 },
      { symbol: 'BTC', name: 'Bitcoin', price: 67432.18, amount: 0.15 },
      { symbol: 'SOL', name: 'Solana', price: 145.32, amount: 28.5 },
      { symbol: 'NEXO', name: 'NEXORUM Native', price: 0.085, amount: 125000 },
      { symbol: 'TON', name: 'TON Coin', price: 6.85, amount: 420 },
    ];

    const selectedAsset = customSymbol
      ? sampleAssets.find((a) => a.symbol === customSymbol) || { symbol: customSymbol, name: customSymbol, price: 100, amount: 10 }
      : sampleAssets[Math.floor(Math.random() * sampleAssets.length)];

    const changePct = customChangePct !== undefined
      ? customChangePct
      : (Math.random() > 0.4 ? 1 : -1) * (3.5 + Math.random() * 6.5);

    const direction: 'SURGE' | 'CRASH' = changePct >= 0 ? 'SURGE' : 'CRASH';
    const oldPrice = selectedAsset.price;
    const newPrice = oldPrice * (1 + changePct / 100);
    const impactUsd = selectedAsset.amount * newPrice - selectedAsset.amount * oldPrice;

    const simulatedRecord: PortfolioAlertRecord = {
      id: `sim_alert_${Date.now()}`,
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      oldPriceUsd: oldPrice,
      newPriceUsd: newPrice,
      changePercent: changePct,
      direction,
      portfolioImpactUsd: impactUsd,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setPortfolioAlertsHistory((prev) => [simulatedRecord, ...prev.slice(0, 49)]);

    addToast({
      title: `⚡ Live Alert: ${selectedAsset.symbol} ${direction === 'SURGE' ? 'Surged +' : 'Dropped '}${Math.abs(changePct).toFixed(2)}%`,
      message: `${selectedAsset.name} price moved to $${newPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Estimated holding impact: ${impactUsd >= 0 ? '+' : ''}$${impactUsd.toFixed(2)} USD.`,
      type: direction === 'SURGE' ? 'success' : 'warning',
    });

    setNotifications((prev) => [
      {
        id: `notif_vol_${Date.now()}`,
        title: `Volatility Push: ${selectedAsset.symbol} ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
        message: `${selectedAsset.name} price swing detected by NEXORUM Volatility Alert Engine. Current market rate: $${newPrice.toFixed(2)}`,
        type: 'MARKET',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    playAlertSound(direction);
    nexorumBus.emit('MARKET_ALERT', simulatedRecord);
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
        portfolioAlertSettings,
        updatePortfolioAlertSettings,
        portfolioAlertsHistory,
        checkPortfolioVolatility,
        triggerVolatilitySimulation,
        clearAlertsHistory,
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

