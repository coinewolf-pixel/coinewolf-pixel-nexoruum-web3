import React, { createContext, useContext, useState, useEffect } from 'react';
import { NetworkInfo, ConnectedWallet, WalletProviderId, NetworkId } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { nexorumBus } from '../lib/nexorumKernel';
import {
  fetchOnChainBalances,
  connectBrowserWalletWithEthers,
  signMessageWithEthers,
} from '../services/chainProviderService';

export interface WalletProviderOption {
  id: WalletProviderId;
  name: string;
  icon: string;
  supportedNetworks: NetworkId[];
  isPopular?: boolean;
}

export const SUPPORTED_WALLET_PROVIDERS: WalletProviderOption[] = [
  { id: 'nexorum_vault', name: 'NEXO Native Vault (Non-Custodial)', icon: 'Cpu', supportedNetworks: ['nexorum', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'base', 'solana', 'ton'], isPopular: true },
  { id: 'metamask', name: 'MetaMask', icon: 'ShieldCheck', supportedNetworks: ['nexorum', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'base'], isPopular: true },
  { id: 'phantom', name: 'Phantom', icon: 'Ghost', supportedNetworks: ['solana', 'nexorum', 'ethereum', 'polygon'], isPopular: true },
  { id: 'walletconnect', name: 'Reown / WalletConnect', icon: 'QrCode', supportedNetworks: ['nexorum', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'base', 'solana'], isPopular: true },
  { id: 'tonkeeper', name: 'Tonkeeper', icon: 'Diamond', supportedNetworks: ['ton'], isPopular: true },
  { id: 'telegram_wallet', name: 'Telegram Wallet', icon: 'Send', supportedNetworks: ['ton', 'nexorum', 'ethereum'], isPopular: true },
  { id: 'trust', name: 'Trust Wallet', icon: 'Shield', supportedNetworks: ['nexorum', 'ethereum', 'bsc', 'polygon', 'solana', 'ton'] },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: 'Wallet', supportedNetworks: ['nexorum', 'ethereum', 'base', 'polygon', 'arbitrum'] },
  { id: 'okx', name: 'OKX Wallet', icon: 'Layers', supportedNetworks: ['nexorum', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'base', 'solana', 'ton'] },
  { id: 'rabby', name: 'Rabby', icon: 'Key', supportedNetworks: ['nexorum', 'ethereum', 'arbitrum', 'base', 'polygon'] },
  { id: 'ton_wallet', name: 'TON Wallet', icon: 'Zap', supportedNetworks: ['ton'] },
];

interface WalletContextType {
  activeWallet: ConnectedWallet | null;
  activeNetwork: NetworkInfo | null;
  networks: NetworkInfo[];
  isModalOpen: boolean;
  isSyncingBalances: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  connectWalletProvider: (providerId: WalletProviderId, networkId?: NetworkId, customAddress?: string) => Promise<void>;
  switchNetwork: (networkId: NetworkId) => void;
  disconnectWallet: (walletId: string) => void;
  signMessage: (message: string) => Promise<string>;
  syncOnChainBalances: () => Promise<{ updatedCount: number; message: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, addWalletToProfile, removeWalletFromProfile } = useAuth();
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [activeNetwork, setActiveNetwork] = useState<NetworkInfo | null>(null);
  const [activeWallet, setActiveWallet] = useState<ConnectedWallet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncingBalances, setIsSyncingBalances] = useState(false);

  const syncOnChainBalances = async (): Promise<{ updatedCount: number; message: string }> => {
    setIsSyncingBalances(true);
    let updatedCount = 0;
    try {
      const currentWallets = user?.wallets || (activeWallet ? [activeWallet] : []);
      if (currentWallets.length === 0) {
        setIsSyncingBalances(false);
        return { updatedCount: 0, message: 'No connected wallets to sync. Connect a wallet first.' };
      }

      for (const w of currentWallets) {
        // Sync across Ethereum, BSC, and NEXORUM networks
        const targetNet: NetworkId = (['ethereum', 'bsc', 'nexorum'].includes(w.network) ? w.network : 'ethereum') as NetworkId;
        const res = await fetchOnChainBalances(w.address, targetNet);
        if (res) {
          w.nativeBalance = res.nativeBalanceFormatted;
          w.balanceUsd = res.totalBalanceUsd;
          updatedCount++;
        }
      }

      // Update active wallet if present
      if (activeWallet) {
        const matching = currentWallets.find((w) => w.id === activeWallet.id || w.address === activeWallet.address);
        if (matching) {
          setActiveWallet({ ...matching });
        }
      }

      // Update localStorage
      if (typeof window !== 'undefined' && user?.wallets) {
        localStorage.setItem('nexorum_user_wallets', JSON.stringify(user.wallets));
      }

      setIsSyncingBalances(false);
      return {
        updatedCount,
        message: `Successfully synchronized live on-chain balances for ${updatedCount} wallet(s) across Ethereum, BNB Chain & NEXORUM RPCs!`,
      };
    } catch (err: any) {
      setIsSyncingBalances(false);
      return { updatedCount: 0, message: err.message || 'On-chain balance sync completed with warnings.' };
    }
  };

  useEffect(() => {
    api.getNetworks().then((res) => {
      if (res.success && res.networks) {
        setNetworks(res.networks);
        setActiveNetwork(res.networks[0]); // Default Ethereum
      }
    });
  }, []);

  useEffect(() => {
    if (user && user.wallets.length > 0) {
      const primary = user.wallets.find((w) => w.isPrimary) || user.wallets[0];
      setActiveWallet(primary);
    } else {
      setActiveWallet(null);
    }
  }, [user]);

  const openWalletModal = () => setIsModalOpen(true);
  const closeWalletModal = () => setIsModalOpen(false);

  const connectWalletProvider = async (providerId: WalletProviderId, networkId?: NetworkId, customAddress?: string) => {
    let targetNetwork = networkId || activeNetwork?.id || 'ethereum';
    const providerOpt = SUPPORTED_WALLET_PROVIDERS.find((p) => p.id === providerId);

    let address = '';
    let nativeBalance = `0.0000 ${targetNetwork === 'bsc' ? 'BNB' : targetNetwork === 'solana' ? 'SOL' : targetNetwork === 'ton' ? 'TON' : 'ETH'}`;
    let balanceUsd = 0.00;

    // 1. NEXO Native Non-Custodial Vault Option
    if (providerId === 'nexorum_vault') {
      try {
        const vaultRes = await api.getNexoVault(user?.id || 'usr_nex_982341');
        if (vaultRes?.success && vaultRes.vault?.nexoVaultAddress) {
          address = vaultRes.vault.nexoVaultAddress;
          targetNetwork = 'nexorum';
          nativeBalance = '1000.00 NEX';
          balanceUsd = 12450.00;
        }
      } catch (vaultErr: any) {
        throw new Error(vaultErr?.message || 'Failed to initialize NEXO Non-Custodial Vault.');
      }
    }
    // 2. If user entered a custom wallet address
    else if (customAddress && customAddress.trim().length > 5) {
      address = customAddress.trim();
    } else {
      // 3. Try real Browser Wallet Extension using ethers.js and native injection
      try {
        const browserWalletRes = await connectBrowserWalletWithEthers(providerId);
        if (browserWalletRes) {
          address = browserWalletRes.address;
          targetNetwork = browserWalletRes.networkId || targetNetwork;
          nativeBalance = browserWalletRes.nativeBalance;
          balanceUsd = browserWalletRes.balanceUsd;
        }
      } catch (err: any) {
        console.warn('[ethers.js] Browser wallet extension error:', err);
        throw new Error(err?.message || `Wallet extension for ${providerOpt?.name || providerId} not detected or request rejected.`);
      }

      if (!address) {
        throw new Error(`Web3 Wallet Extension for ${providerOpt?.name || providerId} not detected in browser. Please install the extension or enter your address in 'Real Address Input'.`);
      }
    }

    // 3. Query real on-chain EVM balances (ETH, BNB, USDT, etc.) via ethers.js JsonRpcProviders
    if (address && address.startsWith('0x') && address.length === 42) {
      try {
        const onChainRes = await fetchOnChainBalances(address, targetNetwork);
        if (onChainRes) {
          nativeBalance = onChainRes.nativeBalanceFormatted;
          balanceUsd = onChainRes.totalBalanceUsd;
        }
      } catch (e) {
        console.warn('[ethers.js] On-chain balance query warning:', e);
      }
    }

    try {
      const res = await api.connectWallet({
        userId: user?.id || 'usr_nex_982341',
        address,
        network: targetNetwork,
        provider: providerId,
        providerName: providerOpt?.name || providerId,
      });

      if (res.success) {
        const connectedWalletObj: ConnectedWallet = {
          id: `w_${Date.now()}`,
          address,
          network: targetNetwork,
          provider: providerId,
          providerName: providerOpt?.name || providerId,
          isPrimary: true,
          balanceUsd,
          nativeBalance,
          connectedAt: new Date().toISOString(),
        };

        addWalletToProfile(connectedWalletObj);
        setActiveWallet(connectedWalletObj);

        nexorumBus.emit('WALLET_CONNECTED', connectedWalletObj);
        closeWalletModal();
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
    }
  };

  const switchNetwork = (networkId: NetworkId) => {
    const net = networks.find((n) => n.id === networkId);
    if (net) {
      setActiveNetwork(net);
      nexorumBus.emit('NETWORK_SWITCHED', net);
    }
  };

  const disconnectWallet = (walletId: string) => {
    if (activeWallet?.id === walletId) {
      setActiveWallet(null);
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    return await signMessageWithEthers(message);
  };

  return (
    <WalletContext.Provider
      value={{
        activeWallet,
        activeNetwork,
        networks,
        isModalOpen,
        isSyncingBalances,
        openWalletModal,
        closeWalletModal,
        connectWalletProvider,
        switchNetwork,
        disconnectWallet,
        signMessage,
        syncOnChainBalances,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};
