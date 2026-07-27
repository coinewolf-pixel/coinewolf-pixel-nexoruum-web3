import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ConnectedWallet } from '../types';
import { api } from '../services/api';
import { nexorumBus } from '../lib/nexorumKernel';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAdminUnlocked: boolean;
  unlockAdminMode: (pin: string) => boolean;
  lockAdminMode: () => void;
  toggleUserRole: (role: UserProfile['role']) => void;
  loginWithTelegram: (telegramData: { telegramId: string; telegramUsername?: string; firstName?: string; photoUrl?: string }) => Promise<void>;
  updateProfile: (data: { email?: string; phone?: string; username?: string; avatarUrl?: string }) => Promise<void>;
  logout: () => void;
  addWalletToProfile: (wallet: ConnectedWallet) => void;
  removeWalletFromProfile: (walletId: string) => void;
  clearDemoWallets: () => void;
  primaryWallet: ConnectedWallet | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>({
    id: 'usr_nex_982341',
    telegramId: '772183941',
    telegramUsername: 'cyber_trader',
    email: 'alex.cyber@nexorum.os',
    phone: '+1 (555) 019-2834',
    username: 'Alex Cyber',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    role: 'USER',
    primaryWallet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    wallets: [
      {
        id: 'w_1',
        address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        network: 'ethereum',
        provider: 'metamask',
        providerName: 'MetaMask',
        isPrimary: true,
        balanceUsd: 14850.50,
        nativeBalance: '4.25 ETH',
        connectedAt: new Date().toISOString(),
      },
      {
        id: 'w_2',
        address: 'EQA0xNEXORUM_TON_WALLET_ADDR_99218',
        network: 'ton',
        provider: 'tonkeeper',
        providerName: 'Tonkeeper',
        isPrimary: false,
        balanceUsd: 3200.00,
        nativeBalance: '500 TON',
        connectedAt: new Date().toISOString(),
      },
    ],
    achievementsCount: 7,
    referralCode: 'NEX-CYBER-99',
    referralsCount: 24,
    referralEarningsUsd: 1240.50,
    createdAt: new Date().toISOString(),
  });

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const unlockAdminMode = (pin: string) => {
    // Standard PINs or passphrases allowed for admin entrance: 0000, 7788, admin, nexorum
    if (['0000', '7788', 'admin', 'nexorum', '1234'].includes(pin.trim().toLowerCase()) || user?.role === 'ADMIN' || user?.role === 'KERNEL_SUPERVISOR') {
      setIsAdminUnlocked(true);
      if (user) {
        setUser({ ...user, role: 'ADMIN' });
      }
      return true;
    }
    return false;
  };

  const lockAdminMode = () => {
    setIsAdminUnlocked(false);
  };

  const toggleUserRole = (newRole: UserProfile['role']) => {
    if (!user) return;
    setUser({ ...user, role: newRole });
    if (newRole === 'ADMIN' || newRole === 'KERNEL_SUPERVISOR') {
      setIsAdminUnlocked(true);
    } else {
      setIsAdminUnlocked(false);
    }
  };

  const loginWithTelegram = async (telegramData: { telegramId: string; telegramUsername?: string; firstName?: string; photoUrl?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.loginTelegram(telegramData);
      if (res.success && res.user) {
        setUser(res.user);
        nexorumBus.emit('TELEGRAM_AUTH_SUCCESS', res.user);
      }
    } catch (err) {
      console.error('Telegram login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { email?: string; phone?: string; username?: string; avatarUrl?: string }) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.updateProfile({ userId: user.id, ...data });
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Profile update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addWalletToProfile = (wallet: ConnectedWallet) => {
    if (!user) return;
    setUser((prev) => {
      if (!prev) return null;
      const exists = prev.wallets.some((w) => w.address.toLowerCase() === wallet.address.toLowerCase());
      if (exists) return prev;
      return {
        ...prev,
        primaryWallet: wallet.address,
        wallets: [...prev.wallets, wallet],
      };
    });
  };

  const removeWalletFromProfile = (walletId: string) => {
    if (!user) return;
    setUser((prev) => {
      if (!prev) return null;
      const updated = prev.wallets.filter((w) => w.id !== walletId);
      return {
        ...prev,
        primaryWallet: updated[0]?.address || '',
        wallets: updated,
      };
    });
  };

  const clearDemoWallets = () => {
    if (!user) return;
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        primaryWallet: '',
        wallets: [],
      };
    });
  };

  const logout = () => {
    setUser(null);
  };

  const primaryWallet = user?.wallets.find((w) => w.isPrimary) || user?.wallets[0];

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdminUnlocked,
        unlockAdminMode,
        lockAdminMode,
        toggleUserRole,
        loginWithTelegram,
        updateProfile,
        logout,
        addWalletToProfile,
        removeWalletFromProfile,
        clearDemoWallets,
        primaryWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
