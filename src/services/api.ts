import { NetworkInfo, TokenItem, MarketplaceItem, UserProfile, AdminSettings, SystemStats, AppNotification, SystemAuditLog } from '../types';

async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.warn(`[API] Non-JSON response from ${url}:`, text.slice(0, 100));
      return { success: false, error: `Invalid response format (${res.status})` } as T;
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`[API] Network or parsing error for ${url}:`, err?.message || err);
    return { success: false, error: err?.message || 'Network request failed' } as T;
  }
}

export const api = {
  async getKernelStatus() {
    return safeFetchJson('/api/v1/kernel/status');
  },

  async loginTelegram(data: { telegramId: string; telegramUsername?: string; firstName?: string; photoUrl?: string }) {
    return safeFetchJson('/api/v1/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateProfile(data: { userId: string; email?: string; phone?: string; username?: string; avatarUrl?: string }) {
    return safeFetchJson('/api/v1/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async getNetworks(): Promise<{ success: boolean; networks: NetworkInfo[] }> {
    return safeFetchJson('/api/v1/blockchain/networks');
  },

  async connectWallet(data: { userId: string; address: string; network: string; provider: string; providerName: string }) {
    return safeFetchJson('/api/v1/wallets/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async getTokens(): Promise<{ success: boolean; tokens: TokenItem[] }> {
    return safeFetchJson('/api/v1/tokens');
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
    return safeFetchJson('/api/v1/tokens/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async getMarketplace(): Promise<{ success: boolean; items: MarketplaceItem[] }> {
    return safeFetchJson('/api/v1/marketplace');
  },

  async buyMarketplaceItem(itemId: string, userId: string, buyerAddress: string) {
    return safeFetchJson('/api/v1/marketplace/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, userId, buyerAddress }),
    });
  },

  async queryAiAssistant(prompt: string, contextType?: string) {
    return safeFetchJson('/api/v1/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, contextType }),
    });
  },

  async getAdminSettings(): Promise<{ success: boolean; settings: AdminSettings }> {
    return safeFetchJson('/api/v1/admin/settings');
  },

  async saveAdminSettings(settings: Partial<AdminSettings>) {
    return safeFetchJson('/api/v1/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
  },

  async getAdminLogs(): Promise<{ success: boolean; logs: SystemAuditLog[]; stats: SystemStats }> {
    return safeFetchJson('/api/v1/admin/logs');
  },

  async getNotifications(): Promise<{ success: boolean; notifications: AppNotification[] }> {
    return safeFetchJson('/api/v1/notifications');
  },

  async markNotificationRead(id: string) {
    return safeFetchJson('/api/v1/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  },

  async getAirdrops() {
    return safeFetchJson('/api/v1/airdrops');
  },

  async createAirdrop(payload: {
    title: string;
    symbol: string;
    amountPerUser: string;
    totalPool: string;
    network: string;
    description: string;
  }) {
    return safeFetchJson('/api/v1/airdrops/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async updateAirdropStatus(airdropId: string, status: 'ACTIVE' | 'PAUSED' | 'COMPLETED') {
    return safeFetchJson('/api/v1/airdrops/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ airdropId, status }),
    });
  },

  async distributeAirdrop(airdropId: string) {
    return safeFetchJson('/api/v1/airdrops/distribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ airdropId }),
    });
  },

  async claimAirdrop(airdropId: string, userId: string) {
    return safeFetchJson('/api/v1/airdrops/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ airdropId, userId }),
    });
  },

  async getDailyAirdropStatus(userId: string) {
    return safeFetchJson(`/api/v1/airdrops/daily-status?userId=${encodeURIComponent(userId)}`);
  },

  async claimDailyAirdrop(userId: string) {
    return safeFetchJson('/api/v1/airdrops/daily-claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  },

  async generateAiToken(prompt: string) {
    return safeFetchJson('/api/v1/ai/generate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
  },

  async getStakingPools() {
    return safeFetchJson('/api/v1/staking/pools');
  },

  async getUserStakes(userId: string) {
    return safeFetchJson(`/api/v1/staking/user-stakes?userId=${encodeURIComponent(userId)}`);
  },

  async stakeNex(userId: string, amountNex: number, durationDays: number) {
    return safeFetchJson('/api/v1/staking/stake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amountNex, durationDays }),
    });
  },

  async unstakeNex(stakeId: string, userId: string) {
    return safeFetchJson('/api/v1/staking/unstake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stakeId, userId }),
    });
  },

  async getNexoVault(userId: string) {
    return safeFetchJson(`/api/v1/user/nexo-vault?userId=${encodeURIComponent(userId)}`);
  },

  async exportNexoVault(userId: string, pin?: string) {
    return safeFetchJson('/api/v1/user/export-nexo-vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pin }),
    });
  },

  async generateTokenLogo(name: string, symbol: string, style?: string, description?: string) {
    return safeFetchJson('/api/v1/ai/generate-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, symbol, style, description }),
    });
  },
};
