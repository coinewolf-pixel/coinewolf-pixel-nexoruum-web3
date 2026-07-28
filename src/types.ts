export type NetworkId = 'nexorum' | 'ethereum' | 'bsc' | 'polygon' | 'arbitrum' | 'base' | 'solana' | 'ton';

export interface NetworkInfo {
  id: NetworkId;
  name: string;
  symbol: string;
  icon: string;
  chainId: number | string;
  rpcUrl: string;
  explorerUrl: string;
  gasPriceGwei: number;
  blockHeight: number;
  isPopular?: boolean;
}

export type WalletProviderId =
  | 'nexorum_vault'
  | 'walletconnect'
  | 'metamask'
  | 'phantom'
  | 'trust'
  | 'coinbase'
  | 'okx'
  | 'rabby'
  | 'tonkeeper'
  | 'ton_wallet'
  | 'telegram_wallet';

export interface ConnectedWallet {
  id: string;
  address: string;
  network: NetworkId;
  provider: WalletProviderId;
  providerName: string;
  isPrimary: boolean;
  balanceUsd: number;
  nativeBalance: string;
  connectedAt: string;
}

export interface UserProfile {
  id: string; // Unique User ID assigned by NEXORUM
  nexoId?: string; // Unique NEXO Protocol ID (e.g. NEXO-84B7F2A1)
  nexoPublicKey?: string; // On-Chain Public Key
  nexoVaultAddress?: string; // Native Non-Custodial NEXO Wallet Address
  hasBackupKey?: boolean;
  telegramId?: string;
  telegramUsername?: string;
  email?: string;
  phone?: string;
  username: string;
  avatarUrl: string;
  role: 'USER' | 'CREATOR' | 'ADMIN' | 'KERNEL_SUPERVISOR';
  primaryWallet?: string;
  wallets: ConnectedWallet[];
  achievementsCount: number;
  referralCode: string;
  referralsCount: number;
  referralEarningsUsd: number;
  createdAt: string;
}

export type TokenStandard = 'NEX20' | 'ERC20' | 'BEP20' | 'SPL' | 'TON_JETTON';

export interface TokenItem {
  id: string;
  name: string;
  symbol: string;
  network: NetworkId;
  standard: TokenStandard;
  decimals: number;
  totalSupply: string;
  contractAddress: string;
  ownerAddress: string;
  ownerUserId?: string;
  logoUrl: string;
  priceUsd: number;
  priceChange24h: number;
  marketCapUsd: number;
  volume24hUsd: number;
  createdAt: string;
  isHot?: boolean;
  isNew?: boolean;
  isVerified?: boolean;
  liquidityPoolAddress?: string;
  sparkline: number[];
}

export type MarketplaceCategory = 'Tokens' | 'NFT' | 'AI Agents' | 'Plugins' | 'Digital Products' | 'Templates';

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  category: MarketplaceCategory;
  price: number;
  priceSymbol: string;
  network: NetworkId;
  sellerId: string;
  sellerAddress: string;
  sellerName: string;
  imageUrl: string;
  rating: number;
  salesCount: number;
  verified: boolean;
  createdAt: string;
  details?: Record<string, any>;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  hash: string;
  network: NetworkId;
  type: 'TRANSFER' | 'DEPLOY_TOKEN' | 'BUY_MARKETPLACE' | 'ADD_LIQUIDITY' | 'STAKE' | 'CLAIM';
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  amount: string;
  symbol: string;
  amountUsd: number;
  fromAddress: string;
  toAddress: string;
  blockNumber: number;
  createdAt: string;
  gasFeeUsd: number;
}

export interface SystemAuditLog {
  id: string;
  userId?: string;
  action: string;
  category: 'AUTH' | 'TOKEN_ENGINE' | 'MARKETPLACE' | 'WALLET' | 'ADMIN' | 'SECURITY';
  details: string;
  ipAddress: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'WALLET' | 'TOKEN' | 'MARKET' | 'SYSTEM' | 'AI';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface AdminSettings {
  walletConnectProjectId: string;
  cloudflareWorkerUrl: string;
  rpcUrls: Record<NetworkId, string>;
  coingeckoApiKey: string;
  coinmarketcapApiKey: string;
  openaiApiKey: string;
  claudeApiKey: string;
  telegramBotToken: string;
  smtpHost: string;
  featureFlags: {
    enableTokenCreator: boolean;
    enableAiAssistant: boolean;
    enableMarketplace: boolean;
    enableTonWallet: boolean;
    maintenanceMode: boolean;
    strictSignatureVerification: boolean;
  };
}

export interface SystemStats {
  totalUsers: number;
  totalTokensCreated: number;
  totalWalletsConnected: number;
  totalMarketplaceSales: number;
  totalVolumeUsd: number;
  kernelVersion: string;
  uptimeSeconds: number;
}

export interface AirdropCampaign {
  id: string;
  title: string;
  symbol: string;
  amountPerUser: string;
  totalPool: string;
  remainingPool: string;
  network: NetworkId;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  description: string;
  claimedUserIds: string[];
  createdAt: string;
}

