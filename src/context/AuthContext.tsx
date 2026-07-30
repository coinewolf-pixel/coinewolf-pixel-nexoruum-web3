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
  const [user, setUser] = useState<UserProfile | null>(() => {
    let savedWallets: ConnectedWallet[] = [];
    let savedProfile: UserProfile | null = null;
    if (typeof window !== 'undefined') {
      try {
        const itemW = localStorage.getItem('nexorum_user_wallets');
        if (itemW) savedWallets = JSON.parse(itemW);
        const itemP = localStorage.getItem('nexorum_user_profile');
        if (itemP) savedProfile = JSON.parse(itemP);
      } catch (e) {
        console.warn('Failed to parse saved auth items:', e);
      }
    }

    if (savedProfile) {
      return {
        ...savedProfile,
        wallets: savedProfile.wallets?.length ? savedProfile.wallets : savedWallets,
      };
    }

    return {
      id: 'usr_nex_982341',
      nexoId: 'NEXO-982341',
      telegramId: '',
      telegramUsername: '',
      email: 'alex.cyber@nexorum.os',
      phone: '+1 (555) 019-2834',
      username: 'Alex Cyber',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80',
      bio: 'Web3 Architect & On-Chain Quantitative Trader. Building decentralized autonomous modules on NEXORUM OS.',
      role: 'USER',
      primaryWallet: savedWallets[0]?.address || '',
      wallets: savedWallets,
      achievementsCount: 7,
      referralCode: 'NEX-CYBER-99',
      referralsCount: 24,
      referralEarningsUsd: 1240.50,
      createdAt: new Date().toISOString(),
    };
  });

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const unlockAdminMode = (pin: string) => {
    // Standard PINs or passphrases allowed for admin entrance: 0000, 7788, admin, nexorum
    if (['0000', '7788', 'admin', 'nexorum', '1234'].includes(pin.trim().toLowerCase()) || user?.role === 'ADMIN' || user?.role === 'KERNEL_SUPERVISOR') {
      setIsAdminUnlocked(true);
      if (user) {
        const updated = { ...user, role: 'ADMIN' as const };
        setUser(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexorum_user_profile', JSON.stringify(updated));
        }
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
    const updated = { ...user, role: newRole };
    setUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexorum_user_profile', JSON.stringify(updated));
    }
    if (newRole === 'ADMIN' || newRole === 'KERNEL_SUPERVISOR') {
      setIsAdminUnlocked(true);
    } else {
      setIsAdminUnlocked(false);
    }
  };

  const loginWithTelegram = async (telegramData: { telegramId: string; telegramUsername?: string; firstName?: string; photoUrl?: string }) => {
    setIsLoading(true);
    try {
      const cleanTgId = telegramData.telegramId || String(Math.floor(100000000 + Math.random() * 900000000));
      const individualUserId = `usr_nex_tg_${cleanTgId}`;
      const individualNexoId = `NEXO-${cleanTgId.slice(0, 6).toUpperCase()}`;
      const tgUsername = telegramData.firstName || (telegramData.telegramUsername ? `@${telegramData.telegramUsername}` : `Telegram User ${cleanTgId.slice(-4)}`);
      const tgAvatar = telegramData.photoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80';

      const newUser: UserProfile = {
        id: individualUserId,
        nexoId: individualNexoId,
        telegramId: cleanTgId,
        telegramUsername: telegramData.telegramUsername || '',
        email: telegramData.telegramUsername ? `${telegramData.telegramUsername}@telegram.me` : '',
        phone: '',
        username: tgUsername,
        avatarUrl: tgAvatar,
        role: 'USER',
        primaryWallet: user?.primaryWallet || '',
        wallets: user?.wallets || [],
        achievementsCount: 5,
        referralCode: `NEX-TG-${cleanTgId.slice(-4)}`,
        referralsCount: 0,
        referralEarningsUsd: 0,
        createdAt: new Date().toISOString(),
      };

      setUser(newUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexorum_user_profile', JSON.stringify(newUser));
      }
      nexorumBus.emit('TELEGRAM_AUTH_SUCCESS', newUser);

      // Optionally sync to backend API if live
      await api.loginTelegram(telegramData);
    } catch (err) {
      console.error('Telegram login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { email?: string; phone?: string; username?: string; avatarUrl?: string; bio?: string }) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedUser: UserProfile = {
        ...user,
        username: data.username !== undefined ? data.username : user.username,
        email: data.email !== undefined ? data.email : user.email,
        phone: data.phone !== undefined ? data.phone : user.phone,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : user.avatarUrl,
        bio: data.bio !== undefined ? data.bio : user.bio,
      };

      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexorum_user_profile', JSON.stringify(updatedUser));
      }

      await api.updateProfile({ userId: user.id, ...data });
    } catch (err) {
      console.error('Profile update notice:', err);
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
      const newWallets = [...prev.wallets, wallet];
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexorum_user_wallets', JSON.stringify(newWallets));
      }
      return {
        ...prev,
        primaryWallet: wallet.address,
        wallets: newWallets,
      };
    });
  };

  const removeWalletFromProfile = (walletId: string) => {
    if (!user) return;
    setUser((prev) => {
      if (!prev) return null;
      const updated = prev.wallets.filter((w) => w.id !== walletId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexorum_user_wallets', JSON.stringify(updated));
      }
      return {
        ...prev,
        primaryWallet: updated[0]?.address || '',
        wallets: updated,
      };
    });
  };

  const clearDemoWallets = () => {
    if (!user) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexorum_user_wallets', JSON.stringify([]));
    }
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
