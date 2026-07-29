/**
 * NEXORUM Kernel Plugin Engine Client
 * Handles automatic plugin registration, menu, routes, API, permissions, widgets & event bus.
 */

export interface KernelPluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  menu: { id: string; label: string; icon: string; path: string; badge?: string }[];
  routes: { path: string; component: string }[];
  permissions: string[];
  widgets: { id: string; title: string; category: string }[];
  events: string[];
}

export const NEXORUM_PLUGIN_MANIFEST: KernelPluginManifest = {
  id: 'nexorum-web3-app',
  name: 'Web3 Application',
  version: '1.0.0',
  author: 'NEXORUM OS Foundation',
  description: 'Official NEXORUM OS Web3 Engine Module connecting Wallets, Token Creator, Marketplace & AI Assistant.',
  menu: [
    { id: 'home', label: 'Home Dashboard', icon: 'LayoutDashboard', path: '/' },
    { id: 'discover', label: 'Discover & Tokens', icon: 'Compass', path: '/discover', badge: 'HOT' },
    { id: 'creator', label: 'Token Creator', icon: 'PlusCircle', path: '/token-creator', badge: 'NEW' },
    { id: 'marketplace', label: 'Marketplace', icon: 'ShoppingBag', path: '/marketplace' },
    { id: 'sentinel', label: 'AI Quantum Sentinel', icon: 'Cpu', path: '/sentinel', badge: 'AI 3.6' },
    { id: 'ai', label: 'AI Assistant', icon: 'Bot', path: '/ai-assistant' },
    { id: 'search', label: 'Global Search', icon: 'Search', path: '/search' },
    { id: 'profile', label: 'User Profile', icon: 'User', path: '/profile' },
    { id: 'admin', label: 'Admin Panel', icon: 'ShieldAlert', path: '/admin' },
  ],
  routes: [
    { path: '/', component: 'HomeView' },
    { path: '/discover', component: 'DiscoverView' },
    { path: '/token-creator', component: 'TokenCreatorView' },
    { path: '/marketplace', component: 'MarketplaceView' },
    { path: '/ai-assistant', component: 'AiAssistantView' },
    { path: '/search', component: 'SearchView' },
    { path: '/profile', component: 'ProfileView' },
    { path: '/admin', component: 'AdminPanelView' },
  ],
  permissions: [
    'WALLET_CONNECT',
    'TOKEN_DEPLOY',
    'MARKETPLACE_BUY',
    'AI_ASSISTANT_QUERY',
    'ADMIN_WRITE_SETTINGS',
    'TELEGRAM_AUTH',
  ],
  widgets: [
    { id: 'portfolio-widget', title: 'Portfolio Summary', category: 'FINANCE' },
    { id: 'hot-tokens-widget', title: 'Hot Tokens Scanner', category: 'CRYPTO' },
    { id: 'ai-quick-query', title: 'NEXORUM AI Assistant', category: 'AI' },
  ],
  events: [
    'WALLET_CONNECTED',
    'TOKEN_CREATED',
    'TOKEN_PURCHASED',
    'TRANSACTION_CONFIRMED',
    'MARKET_ALERT',
    'AI_SUGGESTION',
  ],
};

type EventCallback = (data: any) => void;

class NexorumEventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(
      event,
      list.filter((cb) => cb !== callback)
    );
  }

  emit(event: string, data?: any) {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach((cb) => cb(data));
    }
  }
}

export const nexorumBus = new NexorumEventBus();
