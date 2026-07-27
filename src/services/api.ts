import { NetworkInfo, TokenItem, MarketplaceItem, UserProfile, AdminSettings, SystemStats, AppNotification, SystemAuditLog } from '../types';

export const api = {
  async getKernelStatus() {
    const res = await fetch('/api/v1/kernel/status');
    return res.json();
  },

  async loginTelegram(data: { telegramId: string; telegramUsername?: string; firstName?: string; photoUrl?: string }) {
    const res = await fetch('/api/v1/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateProfile(data: { userId: string; email?: string; phone?: string; username?: string; avatarUrl?: string }) {
    const res = await fetch('/api/v1/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getNetworks(): Promise<{ success: boolean; networks: NetworkInfo[] }> {
    const res = await fetch('/api/v1/blockchain/networks');
    return res.json();
  },

  async connectWallet(data: { userId: string; address: string; network: string; provider: string; providerName: string }) {
    const res = await fetch('/api/v1/wallets/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getTokens(): Promise<{ success: boolean; tokens: TokenItem[] }> {
    const res = await fetch('/api/v1/tokens');
    return res.json();
  },

  async createToken(payload: {
    name: string;
    symbol: string;
    network: string;
    standard: string;
    decimals: number;
    totalSupply: string;
    logoUrl?: string;
    ownerAddress?: string;
    userId: string;
    addInitialLiquidityUsd?: number;
  }) {
    const res = await fetch('/api/v1/tokens/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getMarketplace(): Promise<{ success: boolean; items: MarketplaceItem[] }> {
    const res = await fetch('/api/v1/marketplace');
    return res.json();
  },

  async buyMarketplaceItem(itemId: string, userId: string, buyerAddress: string) {
    const res = await fetch('/api/v1/marketplace/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, userId, buyerAddress }),
    });
    return res.json();
  },

  async queryAiAssistant(prompt: string, contextType?: string) {
    const res = await fetch('/api/v1/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, contextType }),
    });
    return res.json();
  },

  async getAdminSettings(): Promise<{ success: boolean; settings: AdminSettings }> {
    const res = await fetch('/api/v1/admin/settings');
    return res.json();
  },

  async saveAdminSettings(settings: Partial<AdminSettings>) {
    const res = await fetch('/api/v1/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    return res.json();
  },

  async getAdminLogs(): Promise<{ success: boolean; logs: SystemAuditLog[]; stats: SystemStats }> {
    const res = await fetch('/api/v1/admin/logs');
    return res.json();
  },

  async getNotifications(): Promise<{ success: boolean; notifications: AppNotification[] }> {
    const res = await fetch('/api/v1/notifications');
    return res.json();
  },

  async markNotificationRead(id: string) {
    const res = await fetch('/api/v1/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    return res.json();
  },

  async getAirdrops() {
    const res = await fetch('/api/v1/airdrops');
    return res.json();
  },

  async createAirdrop(payload: {
    title: string;
    symbol: string;
    amountPerUser: string;
    totalPool: string;
    network: string;
    description: string;
  }) {
    const res = await fetch('/api/v1/airdrops/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async updateAirdropStatus(airdropId: string, status: 'ACTIVE' | 'PAUSED' | 'COMPLETED') {
    const res = await fetch('/api/v1/airdrops/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ airdropId, status }),
    });
    return res.json();
  },

  async distributeAirdrop(airdropId: string) {
    const res = await fetch('/api/v1/airdrops/distribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ airdropId }),
    });
    return res.json();
  },

  async claimAirdrop(airdropId: string, userId: string) {
    const res = await fetch('/api/v1/airdrops/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ airdropId, userId }),
    });
    return res.json();
  },
};
