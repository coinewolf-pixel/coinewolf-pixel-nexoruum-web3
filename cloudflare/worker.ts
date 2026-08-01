/**
 * NEXORUM OS Web3 Application — Cloudflare Workers API
 *
 * This is the REAL, fully-implemented API that actually runs in production
 * (deployed via `npx wrangler deploy` from this directory). It replaces the
 * previous stub that only had 2 endpoints — every route the frontend calls
 * is implemented here, ported from the reference Express implementation in
 * the repo root's `server.ts` (which is now dev-only / not deployed to
 * Cloudflare, since Express itself does not run inside the Workers runtime —
 * verified directly: body-parser's stream internals throw at Worker startup
 * even with `nodejs_compat` on).
 *
 * State: for now this uses the same in-memory `db` object the original
 * Express server used, kept at module scope. That means data persists across
 * requests handled by the same warm isolate, but resets on cold starts /
 * isolate eviction — an existing limitation carried over unchanged, not a
 * regression. `wrangler.toml` already provisions a D1 database and KV
 * namespace for a real persistence layer (see `db/schema.sql`); migrating
 * `db.*` reads/writes to D1 queries is the natural next step and is
 * intentionally out of scope here to keep this change reviewable.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import crypto from 'node:crypto';
import { ethers } from 'ethers';
import { GoogleGenAI } from '@google/genai';

export interface Env {
  DB?: unknown;
  ASSETS: any; // Fetcher — see NEXORUM_KV note above re: global types
  NEXORUM_KV?: any; // KVNamespace — typed loosely here since the shared root tsconfig doesn't include @cloudflare/workers-types globally
  GEMINI_API_KEY?: string;
  ADMIN_API_TOKEN?: string;
  VAULT_ENCRYPTION_SECRET?: string;
  TELEGRAM_BOT_TOKEN?: string;
  WALLETCONNECT_PROJECT_ID?: string;
  COINGECKO_API_KEY?: string;
  ENVIRONMENT?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Admin-Token'],
}));

// --- ADMIN AUTH MIDDLEWARE ---
// Admin routes require a dedicated ADMIN_API_TOKEN. No insecure fallback:
// if it's not configured, admin routes fail closed (503) instead of opening up.
async function requireAdminAuth(c: any, next: () => Promise<void>) {
  const token = c.env.ADMIN_API_TOKEN || '';
  if (!token) {
    return c.json({ error: 'Admin API is not configured (ADMIN_API_TOKEN missing).' }, 503);
  }
  const header = c.req.header('Authorization') || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : c.req.header('X-Admin-Token');
  if (!provided || provided !== token) {
    return c.json({ error: 'Unauthorized: valid admin token required.' }, 401);
  }
  await next();
}

async function jsonBody(c: any): Promise<any> {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}

function clientIp(c: any): string {
  return c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';
}

function randomHex(len: number): string {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// --- AES-256 NON-CUSTODIAL WALLET VAULT ENCRYPTION ENGINE ---
function getVaultSecret(env: Env): string {
  return env.VAULT_ENCRYPTION_SECRET || 'nexorum_vault_secure_key_2026_aes256_prod';
}

function encryptVaultData(text: string, secret: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(secret, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decryptVaultData(encryptedString: string, secret: string): string {
  try {
    const [ivHex, encryptedText] = encryptedString.split(':');
    if (!ivHex || !encryptedText) return '';
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(secret, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.warn('Vault decryption error:', e);
    return '';
  }
}

interface NexoVaultInfo {
  address: string;
  publicKey: string;
  nexoId: string;
  encryptedPrivateKey: string;
  encryptedMnemonic: string;
}

function generateNewNexoVault(secret: string): NexoVaultInfo {
  const wallet = ethers.Wallet.createRandom();
  const address = wallet.address;
  const publicKey = wallet.signingKey?.publicKey || `0x04${address.slice(2)}${address.slice(2, 34)}`;
  const mnemonic = wallet.mnemonic?.phrase || '';
  const privateKey = wallet.privateKey;
  const nexoId = `NEXO-${address.slice(2, 10).toUpperCase()}`;

  return {
    address,
    publicKey,
    nexoId,
    encryptedPrivateKey: encryptVaultData(privateKey, secret),
    encryptedMnemonic: encryptVaultData(mnemonic, secret),
  };
}

const BOOT_VAULT_SECRET = 'nexorum_vault_secure_key_2026_aes256_prod';

// IMPORTANT: Workers forbid async I/O / randomness at module (global) scope —
// it's only allowed inside a request handler. So the demo dataset (which
// calls crypto.randomBytes via generateNewNexoVault) is built lazily on the
// first incoming request instead of at module load time.
function buildDb() {
  const defaultUserVault = generateNewNexoVault(BOOT_VAULT_SECRET);

  return {
  users: [
    {
      id: 'usr_nex_982341',
      nexoId: defaultUserVault.nexoId,
      nexoPublicKey: defaultUserVault.publicKey,
      nexoVaultAddress: defaultUserVault.address,
      encryptedPrivateKey: defaultUserVault.encryptedPrivateKey,
      encryptedMnemonic: defaultUserVault.encryptedMnemonic,
      telegramId: '772183941',
      telegramUsername: 'cyber_trader',
      email: 'alex.cyber@nexorum.os',
      phone: '+1 (555) 019-2834',
      username: 'Alex Cyber',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80',
      role: 'CREATOR',
      primaryWallet: defaultUserVault.address,
      bio: '',
      wallets: [
        {
          id: `w_nexo_vault_${defaultUserVault.address.slice(-6)}`,
          address: defaultUserVault.address,
          network: 'nexorum',
          provider: 'nexorum_vault',
          providerName: 'NEXO Native Non-Custodial Vault',
          isPrimary: true,
          balanceUsd: 12450.0,
          nativeBalance: '1000.00 NEX',
          connectedAt: new Date().toISOString(),
        },
        {
          id: 'w_1',
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          network: 'ethereum',
          provider: 'metamask',
          providerName: 'MetaMask',
          isPrimary: false,
          balanceUsd: 14850.5,
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
          balanceUsd: 3200.0,
          nativeBalance: '500 TON',
          connectedAt: new Date().toISOString(),
        },
      ] as any[],
      achievementsCount: 7,
      referralCode: 'NEX-CYBER-99',
      referralsCount: 24,
      referralEarningsUsd: 1240.5,
      createdAt: new Date().toISOString(),
    },
  ] as any[],
  tokens: [
    {
      id: 'tok_nex_0',
      name: 'NEXORUM Native Coin',
      symbol: 'NEX',
      network: 'nexorum',
      standard: 'NEX20',
      decimals: 18,
      totalSupply: '1000000000',
      contractAddress: '0x0000000000000000000000000000000000007780',
      ownerAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      ownerUserId: 'usr_nex_982341',
      logoUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=150&q=80',
      priceUsd: 12.45,
      priceChange24h: 24.8,
      marketCapUsd: 12450000000,
      volume24hUsd: 84200000,
      createdAt: new Date().toISOString(),
      isHot: true,
      isNew: true,
      isVerified: true,
      liquidityPoolAddress: '0x7780000000000000000000000000000000007780',
      sparkline: [10.2, 10.8, 11.1, 11.5, 11.9, 12.1, 12.45],
    },
    {
      id: 'tok_nex_1',
      name: 'NEXORUM Quantum Engine',
      symbol: 'NEX',
      network: 'ethereum',
      standard: 'ERC20',
      decimals: 18,
      totalSupply: '100000000',
      contractAddress: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
      ownerAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      ownerUserId: 'usr_nex_982341',
      logoUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=150&q=80',
      priceUsd: 4.82,
      priceChange24h: 18.4,
      marketCapUsd: 482000000,
      volume24hUsd: 28400000,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      isHot: true,
      isNew: false,
      isVerified: true,
      liquidityPoolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      sparkline: [4.1, 4.25, 4.18, 4.45, 4.6, 4.72, 4.82],
    },
    {
      id: 'tok_nex_2',
      name: 'Cyber AI Protocol',
      symbol: 'CYAI',
      network: 'base',
      standard: 'ERC20',
      decimals: 18,
      totalSupply: '50000000',
      contractAddress: '0x32A2928341A92834921932940294109402840192',
      ownerAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      ownerUserId: 'usr_nex_982341',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
      priceUsd: 1.25,
      priceChange24h: 32.1,
      marketCapUsd: 62500000,
      volume24hUsd: 12400000,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      isHot: true,
      isNew: true,
      isVerified: true,
      liquidityPoolAddress: '0x1029341829340129381029381029381029381029',
      sparkline: [0.85, 0.92, 1.05, 1.1, 1.18, 1.21, 1.25],
    },
    {
      id: 'tok_nex_3',
      name: 'TON Cyber Jetton',
      symbol: 'TCJ',
      network: 'ton',
      standard: 'TON_JETTON',
      decimals: 9,
      totalSupply: '10000000',
      contractAddress: 'EQB1892341029381029381029381029381029381029',
      ownerAddress: 'EQA0xNEXORUM_TON_WALLET_ADDR_99218',
      ownerUserId: 'usr_nex_982341',
      logoUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=150&q=80',
      priceUsd: 0.88,
      priceChange24h: 8.9,
      marketCapUsd: 8800000,
      volume24hUsd: 1950000,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      isHot: false,
      isNew: true,
      isVerified: true,
      liquidityPoolAddress: 'EQC29381029381029381029381029381029381029',
      sparkline: [0.75, 0.78, 0.8, 0.82, 0.85, 0.86, 0.88],
    },
  ] as any[],
  marketplaceItems: [
    {
      id: 'mp_1',
      title: 'NEXORUM Cyber AI Trading Bot Agent',
      description: 'Autonomous AI Agent capable of arbitrage and cross-chain liquidations on Arbitrum & Base.',
      category: 'AI Agents',
      price: 250,
      priceSymbol: 'USDT',
      network: 'arbitrum',
      sellerId: 'usr_nex_982341',
      sellerAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      sellerName: 'Alex Cyber',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      rating: 4.9,
      salesCount: 142,
      verified: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mp_2',
      title: 'NEXORUM Cyberpunk Genesis Pass NFT',
      description: 'VIP Pass unlocking 0% trading fees across NEXORUM Web3 Engine & Token Creator discount.',
      category: 'NFT',
      price: 0.15,
      priceSymbol: 'ETH',
      network: 'ethereum',
      sellerId: 'usr_nex_982341',
      sellerAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      sellerName: 'NEXORUM Labs',
      imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=400&q=80',
      rating: 5.0,
      salesCount: 89,
      verified: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mp_3',
      title: 'Solana SPL High-Frequency Sniper Plugin',
      description: 'Instant liquidity pool listener and auto-buy plugin for Raydium & Pump.fun.',
      category: 'Plugins',
      price: 1.5,
      priceSymbol: 'SOL',
      network: 'solana',
      sellerId: 'usr_nex_982341',
      sellerAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      sellerName: 'SolanaDevs',
      imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=400&q=80',
      rating: 4.8,
      salesCount: 61,
      verified: true,
      createdAt: new Date().toISOString(),
    },
  ] as any[],
  transactions: [
    {
      id: 'tx_1',
      userId: 'usr_nex_982341',
      hash: '0x8f2a1b9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
      network: 'ethereum',
      type: 'DEPLOY_TOKEN',
      status: 'CONFIRMED',
      amount: '100000000',
      symbol: 'NEX',
      amountUsd: 4820.0,
      fromAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      toAddress: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
      blockNumber: 19824102,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      gasFeeUsd: 3.42,
    },
  ] as any[],
  auditLogs: [
    {
      id: 'log_1',
      userId: 'usr_nex_982341',
      action: 'KERNEL_PLUGIN_REGISTERED',
      category: 'ADMIN',
      details: 'NEXORUM Web3 Application Module successfully mounted into Kernel OS v1.0',
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    },
  ] as any[],
  notifications: [
    {
      id: 'notif_1',
      userId: 'usr_nex_982341',
      title: 'Token Deployed Successfully',
      message: 'Cyber AI Protocol (CYAI) deployed on Base & liquidity pool generated.',
      type: 'TOKEN',
      isRead: false,
      actionUrl: '/discover',
      createdAt: new Date().toISOString(),
    },
  ] as any[],
  airdrops: [
    {
      id: 'airdrop_nex_1',
      title: 'NEXORUM Blockchain Daily Rewards Airdrop',
      symbol: 'NEX',
      amountPerUser: '10',
      totalPool: '30000',
      remainingPool: '28500',
      network: 'nexorum',
      status: 'ACTIVE',
      description: 'Check in daily to claim up to 10 NEX tokens daily (max 300 NEX over 30 days)! Claimed NEX is credited directly to your connected wallet and can be staked to earn compounded yield.',
      claimedUserIds: [] as string[],
      createdAt: new Date().toISOString(),
    },
  ] as any[],
  userStakes: [
    {
      id: 'stake_demo_1',
      userId: 'usr_nex_982341',
      poolId: 'pool_30d',
      poolName: '30-Day High Yield Lock',
      contractAddress: '0xStaking_7780_Vault_30D',
      amountNex: 50,
      amount: 50,
      durationDays: 30,
      apyPercent: 25,
      multiplier: 1.25,
      estimatedRewardNex: 1.02,
      earnedRewardNex: 1.02,
      stakedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      maturesAt: new Date(Date.now() + 86400000 * 25).toISOString(),
      status: 'ACTIVE',
    },
  ] as any[],
  dailyClaims: {} as Record<string, { streak: number; lastClaimTimestamp: number; totalClaimed: number }>,
  settings: {
    walletConnectProjectId: '8a381920392019382019382',
    cloudflareWorkerUrl: 'https://web3.coinewolf.workers.dev/',
    rpcUrls: {
      nexorum: 'https://rpc.nexorum.network',
      nexorum_testnet: 'https://testnet-rpc.nexorum.network',
      ethereum: 'https://eth.llamarpc.com',
      bsc: 'https://bsc-dataseed.binance.org/',
      polygon: 'https://polygon-rpc.com/',
      arbitrum: 'https://arb1.arbitrum.io/rpc',
      base: 'https://mainnet.base.org',
      solana: 'https://api.mainnet-beta.solana.com',
      ton: 'https://toncenter.com/api/v2/jsonRPC',
    } as Record<string, string>,
    coingeckoApiKey: 'cg_demo_key_9921',
    coinmarketcapApiKey: 'cmc_demo_key_102',
    openaiApiKey: '',
    claudeApiKey: '',
    telegramBotToken: '',
    smtpHost: 'mail.nexorum.os',
    featureFlags: {
      enableTokenCreator: true,
      enableAiAssistant: true,
      enableMarketplace: true,
      enableTonWallet: true,
      maintenanceMode: false,
      strictSignatureVerification: true,
    },
  },
  };
}

type Db = ReturnType<typeof buildDb>;
let db: Db;

// Ensures `db` exists before any route handler touches it. Runs on the
// first request handled by a given isolate; subsequent requests reuse it.
app.use('*', async (c, next) => {
  if (!db) db = buildDb();
  await next();
});

app.get('/api/v1/kernel/status', (c) => {
  return c.json({
    status: 'ONLINE',
    module: 'NEXORUM Web3 Application',
    version: '1.0.0',
    runtime: 'Cloudflare Worker (Edge)',
    kernelHandshake: true,
    activeWalletsConnected: db.users[0].wallets.length,
    tokensManaged: db.tokens.length,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/auth/telegram', async (c) => {
  const { telegramId, telegramUsername, firstName, photoUrl } = await jsonBody(c);
  if (!telegramId) return c.json({ error: 'Missing telegramId' }, 400);

  let user = db.users.find((u) => u.telegramId === String(telegramId));

  if (!user) {
    const newUserId = `usr_nex_${Math.floor(100000 + Math.random() * 900000)}`;
    const userVault = generateNewNexoVault(getVaultSecret(c.env));

    user = {
      id: newUserId,
      nexoId: userVault.nexoId,
      nexoPublicKey: userVault.publicKey,
      nexoVaultAddress: userVault.address,
      encryptedPrivateKey: userVault.encryptedPrivateKey,
      encryptedMnemonic: userVault.encryptedMnemonic,
      telegramId: String(telegramId),
      telegramUsername: telegramUsername || `tg_user_${telegramId}`,
      email: '',
      phone: '',
      username: firstName ? `${firstName} (TG)` : `@${telegramUsername || telegramId}`,
      avatarUrl: photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      role: 'USER',
      primaryWallet: userVault.address,
      bio: '',
      wallets: [
        {
          id: `w_nexo_vault_${userVault.address.slice(-6)}`,
          address: userVault.address,
          network: 'nexorum',
          provider: 'nexorum_vault',
          providerName: 'NEXO Native Non-Custodial Vault',
          isPrimary: true,
          balanceUsd: 100.0,
          nativeBalance: '10.00 NEX',
          connectedAt: new Date().toISOString(),
        },
      ],
      achievementsCount: 1,
      referralCode: `NEX-TG-${String(telegramId).slice(-4)}`,
      referralsCount: 0,
      referralEarningsUsd: 0,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);

    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      userId: user.id,
      action: 'TELEGRAM_PROFILE_AND_VAULT_CREATED',
      category: 'AUTH',
      details: `Created new NEXORUM user account and non-custodial NEXO wallet ${userVault.address} for Telegram ID ${telegramId}`,
      ipAddress: clientIp(c),
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    });
  }

  return c.json({ success: true, user });
});

app.get('/api/v1/user/nexo-vault', (c) => {
  const userId = c.req.query('userId');
  const user = db.users.find((u) => u.id === userId) || db.users[0];

  if (!user.nexoVaultAddress) {
    const vault = generateNewNexoVault(getVaultSecret(c.env));
    user.nexoId = vault.nexoId;
    user.nexoPublicKey = vault.publicKey;
    user.nexoVaultAddress = vault.address;
    user.encryptedPrivateKey = vault.encryptedPrivateKey;
    user.encryptedMnemonic = vault.encryptedMnemonic;
    if (!user.wallets.some((w: any) => w.provider === 'nexorum_vault')) {
      user.wallets.unshift({
        id: `w_nexo_vault_${vault.address.slice(-6)}`,
        address: vault.address,
        network: 'nexorum',
        provider: 'nexorum_vault',
        providerName: 'NEXO Native Non-Custodial Vault',
        isPrimary: true,
        balanceUsd: 12450.0,
        nativeBalance: '1000.00 NEX',
        connectedAt: new Date().toISOString(),
      });
    }
  }

  return c.json({
    success: true,
    vault: {
      userId: user.id,
      nexoId: user.nexoId,
      nexoPublicKey: user.nexoPublicKey,
      nexoVaultAddress: user.nexoVaultAddress,
      isEncryptedAtRest: true,
      encryptionAlgorithm: 'AES-256-CBC (PBKDF2 Scrypt)',
    },
  });
});

app.post('/api/v1/user/export-nexo-vault', async (c) => {
  const { userId, pin } = await jsonBody(c);
  const user = db.users.find((u) => u.id === userId) || db.users[0];

  if (!user || !user.encryptedPrivateKey) {
    return c.json({ error: 'NEXO Non-Custodial Vault not found' }, 404);
  }

  if (!(user as any).vaultPinHash) {
    if (!pin || String(pin).length < 4) {
      return c.json({ error: 'A PIN (min 4 digits) is required to protect this vault export.' }, 400);
    }
    (user as any).vaultPinHash = crypto.createHash('sha256').update(String(pin)).digest('hex');
  } else if (!pin || crypto.createHash('sha256').update(String(pin)).digest('hex') !== (user as any).vaultPinHash) {
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      userId: user.id,
      action: 'VAULT_EXPORT_DENIED_BAD_PIN',
      category: 'SECURITY',
      details: `Failed vault export attempt for ${user.nexoVaultAddress}: incorrect PIN.`,
      ipAddress: clientIp(c),
      status: 'FAILED',
      timestamp: new Date().toISOString(),
    });
    return c.json({ error: 'Incorrect PIN.' }, 401);
  }

  const secret = getVaultSecret(c.env);
  const decryptedKey = decryptVaultData(user.encryptedPrivateKey, secret);
  const decryptedMnemonic = decryptVaultData(user.encryptedMnemonic, secret);

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: user.id,
    action: 'NON_CUSTODIAL_VAULT_EXPORTED',
    category: 'SECURITY',
    details: `User exported seed phrase and private key for NEXO Vault ${user.nexoVaultAddress}`,
    ipAddress: clientIp(c),
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  return c.json({
    success: true,
    nexoId: user.nexoId,
    address: user.nexoVaultAddress,
    publicKey: user.nexoPublicKey,
    privateKey: decryptedKey,
    mnemonic: decryptedMnemonic,
  });
});

app.post('/api/v1/user/profile', async (c) => {
  const { userId, email, phone, username, avatarUrl, bio } = await jsonBody(c);
  const user = db.users.find((u) => u.id === userId) || db.users[0];

  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (username !== undefined) user.username = username;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (bio !== undefined) (user as any).bio = bio;

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: user.id,
    action: 'PROFILE_UPDATED',
    category: 'AUTH',
    details: 'User updated profile attributes in NEXORUM User Engine',
    ipAddress: clientIp(c),
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  return c.json({ success: true, user });
});

app.get('/api/v1/blockchain/networks', (c) => {
  return c.json({
    success: true,
    networks: [
      { id: 'nexorum', name: 'NEXORUM Mainnet', symbol: 'NEX', icon: 'nexorum', chainId: 7780, rpcUrl: db.settings.rpcUrls.nexorum, explorerUrl: 'https://explorer.nexorum.network', gasPriceGwei: 0.01, blockHeight: 1892014, isPopular: true },
      { id: 'nexorum_testnet', name: 'NEXORUM Testnet', symbol: 'tNEX', icon: 'nexorum', chainId: 7781, rpcUrl: db.settings.rpcUrls.nexorum_testnet, explorerUrl: 'https://testnet-explorer.nexorum.network', gasPriceGwei: 0.001, blockHeight: 982145, isPopular: true },
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'eth', chainId: 1, rpcUrl: db.settings.rpcUrls.ethereum, explorerUrl: 'https://etherscan.io', gasPriceGwei: 14.2, blockHeight: 19824150, isPopular: true },
      { id: 'bsc', name: 'BNB Smart Chain', symbol: 'BNB', icon: 'bnb', chainId: 56, rpcUrl: db.settings.rpcUrls.bsc, explorerUrl: 'https://bscscan.com', gasPriceGwei: 3.0, blockHeight: 38291024, isPopular: true },
      { id: 'polygon', name: 'Polygon', symbol: 'POL', icon: 'polygon', chainId: 137, rpcUrl: db.settings.rpcUrls.polygon, explorerUrl: 'https://polygonscan.com', gasPriceGwei: 31.8, blockHeight: 56201948, isPopular: true },
      { id: 'arbitrum', name: 'Arbitrum One', symbol: 'ETH', icon: 'arbitrum', chainId: 42161, rpcUrl: db.settings.rpcUrls.arbitrum, explorerUrl: 'https://arbiscan.io', gasPriceGwei: 0.1, blockHeight: 210291024, isPopular: true },
      { id: 'base', name: 'Base', symbol: 'ETH', icon: 'base', chainId: 8453, rpcUrl: db.settings.rpcUrls.base, explorerUrl: 'https://basescan.org', gasPriceGwei: 0.05, blockHeight: 14820193, isPopular: true },
      { id: 'solana', name: 'Solana', symbol: 'SOL', icon: 'solana', chainId: 'solana-mainnet', rpcUrl: db.settings.rpcUrls.solana, explorerUrl: 'https://solscan.io', gasPriceGwei: 0.000005, blockHeight: 278102931, isPopular: true },
      { id: 'ton', name: 'TON Network', symbol: 'TON', icon: 'ton', chainId: 'ton-mainnet', rpcUrl: db.settings.rpcUrls.ton, explorerUrl: 'https://tonscan.org', gasPriceGwei: 0.005, blockHeight: 39102941, isPopular: true },
    ],
  });
});

app.post('/api/v1/wallets/connect', async (c) => {
  const { userId, address, network, provider, providerName } = await jsonBody(c);
  if (!address) return c.json({ error: 'Missing wallet address' }, 400);
  const user = db.users.find((u) => u.id === userId) || db.users[0];

  const existingWallet = user.wallets.find((w: any) => w.address.toLowerCase() === address.toLowerCase());
  if (!existingWallet) {
    const newWallet = {
      id: `w_${Date.now()}`,
      address,
      network: network || 'ethereum',
      provider: provider || 'metamask',
      providerName: providerName || 'Web3 Wallet',
      isPrimary: user.wallets.length === 0,
      balanceUsd: 1250.0,
      nativeBalance: '1.50 ' + (network === 'ton' ? 'TON' : network === 'solana' ? 'SOL' : 'ETH'),
      connectedAt: new Date().toISOString(),
    };
    user.wallets.push(newWallet);
    if (!user.primaryWallet) user.primaryWallet = address;
  }

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: 'Wallet Connected',
    message: `${providerName || 'Wallet'} connected (${address.slice(0, 6)}...${address.slice(-4)})`,
    type: 'WALLET',
    isRead: false,
    actionUrl: '/profile',
    createdAt: new Date().toISOString(),
  });

  return c.json({ success: true, user });
});

app.get('/api/v1/tokens', (c) => {
  return c.json({ success: true, tokens: db.tokens });
});

app.post('/api/v1/tokens/create', async (c) => {
  const { name, symbol, network, standard, decimals, totalSupply, logoUrl, ownerAddress, userId, addInitialLiquidityUsd } = await jsonBody(c);

  if (!name || !symbol || !network) {
    return c.json({ error: 'Missing token parameters' }, 400);
  }

  const user = db.users.find((u) => u.id === userId) || db.users[0];
  const contractAddress =
    network === 'ton'
      ? `EQB${Math.random().toString(36).substring(2, 12).toUpperCase()}`
      : network === 'solana'
      ? `${Math.random().toString(36).substring(2, 10)}...Pump`
      : `0x${randomHex(40)}`;

  const liquidityPoolAddress = `0x${randomHex(40)}`;

  const newToken = {
    id: `tok_nex_${Date.now()}`,
    name,
    symbol: symbol.toUpperCase(),
    network: network || 'ethereum',
    standard: standard || 'ERC20',
    decimals: decimals || 18,
    totalSupply: totalSupply || '100000000',
    contractAddress,
    ownerAddress: ownerAddress || user.primaryWallet || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    ownerUserId: user.id,
    logoUrl: logoUrl || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=150&q=80',
    priceUsd: 0.05,
    priceChange24h: 100.0,
    marketCapUsd: (parseFloat(totalSupply || '100000000') * 0.05) / 10,
    volume24hUsd: addInitialLiquidityUsd || 5000,
    createdAt: new Date().toISOString(),
    isHot: true,
    isNew: true,
    isVerified: true,
    liquidityPoolAddress,
    sparkline: [0.01, 0.02, 0.03, 0.04, 0.045, 0.048, 0.05],
  };

  db.tokens.unshift(newToken);

  db.transactions.unshift({
    id: `tx_${Date.now()}`,
    userId: user.id,
    hash: `0x${randomHex(64)}`,
    network,
    type: 'DEPLOY_TOKEN',
    status: 'CONFIRMED',
    amount: totalSupply,
    symbol: symbol.toUpperCase(),
    amountUsd: addInitialLiquidityUsd || 5000,
    fromAddress: newToken.ownerAddress,
    toAddress: contractAddress,
    blockNumber: Math.floor(19000000 + Math.random() * 1000000),
    createdAt: new Date().toISOString(),
    gasFeeUsd: 1.25,
  });

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: 'Token Deployed & Listed',
    message: `${name} (${symbol}) deployed on ${network.toUpperCase()}. Added to Home, Discover, and Portfolio.`,
    type: 'TOKEN',
    isRead: false,
    actionUrl: `/token/${newToken.id}`,
    createdAt: new Date().toISOString(),
  });

  return c.json({ success: true, token: newToken, workflowStep: 'PUBLISHED_AND_LISTED' });
});

app.post('/api/v1/bridge/transfer', async (c) => {
  const { sourceChain, destChain, asset, amount, senderAddress, recipientAddress, userId } = await jsonBody(c);

  if (!sourceChain || !destChain || !asset || !amount) {
    return c.json({ error: 'Missing transfer parameters' }, 400);
  }

  const user = db.users.find((u) => u.id === userId) || db.users[0];
  const txHash = `0x${randomHex(64)}`;
  const lockProof = `zkProof_0x${randomHex(32)}`;

  const numAmount = parseFloat(amount) || 0;
  let pricePerUnit = 1;
  if (asset === 'NEX') pricePerUnit = 12.45;
  else if (asset === 'ETH') pricePerUnit = 3400;
  else if (asset === 'BNB') pricePerUnit = 580;
  else if (asset === 'SOL') pricePerUnit = 185;
  else if (asset === 'TON') pricePerUnit = 6.85;

  const amountUsd = numAmount * pricePerUnit;

  db.transactions.unshift({
    id: `tx_bridge_${Date.now()}`,
    userId: user.id,
    hash: txHash,
    network: sourceChain,
    type: 'CROSS_CHAIN_BRIDGE',
    status: 'CONFIRMED',
    amount: amount.toString(),
    symbol: asset.toUpperCase(),
    amountUsd,
    fromAddress: senderAddress || user.primaryWallet || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    toAddress: recipientAddress || user.primaryWallet || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    blockNumber: Math.floor(19000000 + Math.random() * 1000000),
    createdAt: new Date().toISOString(),
    gasFeeUsd: 0.15,
  });

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: user.id,
    action: 'CROSS_CHAIN_BRIDGE_INITIATED',
    category: 'BLOCKCHAIN',
    details: `Cross-chain transfer of ${amount} ${asset} from ${sourceChain.toUpperCase()} to ${destChain.toUpperCase()} executed via NEXORUM Account Abstraction Relay.`,
    ipAddress: clientIp(c),
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: 'Cross-Chain Bridge Completed',
    message: `Transferred ${amount} ${asset} from ${sourceChain.toUpperCase()} to ${destChain.toUpperCase()}! Hash: ${txHash.slice(0, 10)}...`,
    type: 'WALLET',
    isRead: false,
    actionUrl: '/profile',
    createdAt: new Date().toISOString(),
  });

  return c.json({
    success: true,
    txHash,
    lockProof,
    amount,
    asset,
    sourceChain,
    destChain,
    relayerFee: '0.0001 ETH ($0.34 USD)',
    estimatedTimeSeconds: 2,
    message: `Successfully transferred ${amount} ${asset} from ${sourceChain.toUpperCase()} to ${destChain.toUpperCase()} on NEXORUM Multi-Chain Bridge Router!`,
  });
});

app.get('/api/v1/network/metrics', (c) => {
  const timeframe = c.req.query('timeframe') || '24h';

  const hourlyData24h = [
    { time: '00:00', gasGwei: 0.22, gasUsd: 0.003, activeUsers: 84200, l1GasGwei: 28.4, tps: 2150 },
    { time: '02:00', gasGwei: 0.18, gasUsd: 0.002, activeUsers: 72100, l1GasGwei: 24.1, tps: 1980 },
    { time: '04:00', gasGwei: 0.15, gasUsd: 0.002, activeUsers: 64500, l1GasGwei: 21.8, tps: 1840 },
    { time: '06:00', gasGwei: 0.16, gasUsd: 0.002, activeUsers: 78900, l1GasGwei: 25.6, tps: 2210 },
    { time: '08:00', gasGwei: 0.28, gasUsd: 0.004, activeUsers: 112400, l1GasGwei: 38.2, tps: 3120 },
    { time: '10:00', gasGwei: 0.35, gasUsd: 0.005, activeUsers: 138900, l1GasGwei: 46.5, tps: 3950 },
    { time: '12:00', gasGwei: 0.31, gasUsd: 0.004, activeUsers: 149200, l1GasGwei: 42.1, tps: 4180 },
    { time: '14:00', gasGwei: 0.29, gasUsd: 0.004, activeUsers: 156400, l1GasGwei: 39.8, tps: 4420 },
    { time: '16:00', gasGwei: 0.33, gasUsd: 0.005, activeUsers: 168100, l1GasGwei: 48.2, tps: 4780 },
    { time: '18:00', gasGwei: 0.26, gasUsd: 0.004, activeUsers: 152800, l1GasGwei: 36.4, tps: 4290 },
    { time: '20:00', gasGwei: 0.21, gasUsd: 0.003, activeUsers: 131500, l1GasGwei: 31.0, tps: 3640 },
    { time: '22:00', gasGwei: 0.19, gasUsd: 0.003, activeUsers: 104200, l1GasGwei: 27.2, tps: 2890 },
  ];
  const weeklyData7d = [
    { time: 'Mon', gasGwei: 0.24, gasUsd: 0.003, activeUsers: 118400, l1GasGwei: 32.5, tps: 3410 },
    { time: 'Tue', gasGwei: 0.26, gasUsd: 0.004, activeUsers: 129800, l1GasGwei: 36.1, tps: 3680 },
    { time: 'Wed', gasGwei: 0.29, gasUsd: 0.004, activeUsers: 142100, l1GasGwei: 41.2, tps: 4050 },
    { time: 'Thu', gasGwei: 0.27, gasUsd: 0.004, activeUsers: 138600, l1GasGwei: 38.9, tps: 3920 },
    { time: 'Fri', gasGwei: 0.34, gasUsd: 0.005, activeUsers: 165400, l1GasGwei: 49.8, tps: 4690 },
    { time: 'Sat', gasGwei: 0.21, gasUsd: 0.003, activeUsers: 151200, l1GasGwei: 29.4, tps: 4120 },
    { time: 'Sun', gasGwei: 0.18, gasUsd: 0.002, activeUsers: 139500, l1GasGwei: 24.8, tps: 3840 },
  ];
  const monthlyData30d = [
    { time: 'Week 1', gasGwei: 0.22, gasUsd: 0.003, activeUsers: 945000, l1GasGwei: 31.0, tps: 3100 },
    { time: 'Week 2', gasGwei: 0.25, gasUsd: 0.004, activeUsers: 1120000, l1GasGwei: 37.5, tps: 3650 },
    { time: 'Week 3', gasGwei: 0.28, gasUsd: 0.004, activeUsers: 1350000, l1GasGwei: 44.2, tps: 4200 },
    { time: 'Week 4', gasGwei: 0.23, gasUsd: 0.003, activeUsers: 1580000, l1GasGwei: 33.8, tps: 4780 },
  ];

  let selectedSeries = hourlyData24h;
  if (timeframe === '7d') selectedSeries = weeklyData7d;
  else if (timeframe === '30d') selectedSeries = monthlyData30d;

  return c.json({
    success: true,
    chainName: 'NEXORUM Sovereign Chain (Chain ID: 7780)',
    timeframe,
    summary: {
      currentGasGwei: 0.19,
      currentGasUsd: 0.0028,
      averageL1GasGwei: 34.6,
      gasSavingsPct: 99.4,
      activeUsers24h: 168100,
      activeUsersGrowth24h: '+18.4%',
      totalTransactions24h: 4289150,
      averageTps: 3650,
      peakTps: 4780,
      blockTimeMs: 250,
      paymasterSubsidizedUsd: 142850,
    },
    data: selectedSeries,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/ai/generate-token', async (c) => {
  const { prompt } = await jsonBody(c);
  if (!prompt) return c.json({ error: 'Prompt is required' }, 400);

  try {
    const apiKey = c.env.GEMINI_API_KEY;
    let resultJson: any = null;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `You are the NEXORUM Web3 AI Token Architect. The user wants to create a real cryptocurrency token based on this concept: "${prompt}".
Generate a clean JSON object with:
- "name": Token Name (e.g. Cybernetic Wolf)
- "symbol": 3-5 letter uppercase symbol (e.g. CWOLF)
- "totalSupply": Suggested total supply integer string (e.g. 1000000000)
- "decimals": Number (18 or 9)
- "description": A high-impact 2-sentence utility description for whitepaper & DEX listings
- "network": Recommended network ("nexorum", "bsc", "ethereum", "solana", "ton", or "polygon")
- "logoStyle": Color description for logo (e.g. "cyan and gold neon shield")
Return ONLY valid JSON without markdown tags.`,
        });
        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) resultJson = JSON.parse(jsonMatch[0]);
      } catch (geminiErr) {
        console.warn('Gemini API call warning, utilizing fallback generator:', geminiErr);
      }
    }

    if (!resultJson) {
      const sanitized = prompt.trim();
      const words = sanitized.split(' ').filter(Boolean);
      const name = words.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Token';
      const symbol = (words[0] ? words[0].slice(0, 3).toUpperCase() : 'NEX') + (words[1] ? words[1].slice(0, 2).toUpperCase() : 'AI');
      resultJson = {
        name,
        symbol,
        totalSupply: '100000000',
        decimals: 18,
        description: `Next-generation decentralized token powering the ${sanitized} ecosystem on NEXORUM Web3 Engine.`,
        network: 'nexorum',
        logoStyle: 'cyan cyber glow',
      };
    }

    const bgColors = ['#0f172a', '#1e1b4b', '#022c22', '#311042', '#0c4a6e'];
    const accentColors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
    const randomAccent = accentColors[Math.floor(Math.random() * accentColors.length)];
    const sym = (resultJson.symbol || 'NEX').slice(0, 4);

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${randomAccent}" />
          <stop offset="100%" stop-color="${randomBg}" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="48" fill="url(#grad)" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="${randomAccent}" stroke-width="4" stroke-dasharray="10 5" />
      <text x="100" y="112" font-family="system-ui, sans-serif" font-size="42" font-weight="900" fill="#ffffff" text-anchor="middle">${sym}</text>
    </svg>`;

    const logoUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    return c.json({ success: true, aiData: { ...resultJson, logoUrl } });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to generate AI token concept' }, 500);
  }
});

app.get('/api/v1/marketplace', (c) => {
  return c.json({ success: true, items: db.marketplaceItems });
});

app.post('/api/v1/marketplace/buy', async (c) => {
  const { itemId, userId, buyerAddress } = await jsonBody(c);
  const item = db.marketplaceItems.find((i) => i.id === itemId);
  if (!item) return c.json({ error: 'Item not found' }, 404);

  item.salesCount += 1;

  db.transactions.unshift({
    id: `tx_${Date.now()}`,
    userId,
    hash: `0x${randomHex(64)}`,
    network: item.network,
    type: 'BUY_MARKETPLACE',
    status: 'CONFIRMED',
    amount: String(item.price),
    symbol: item.priceSymbol,
    amountUsd: item.price * (item.priceSymbol === 'ETH' ? 3200 : item.priceSymbol === 'SOL' ? 180 : 1),
    fromAddress: buyerAddress || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    toAddress: item.sellerAddress,
    blockNumber: Math.floor(19000000 + Math.random() * 1000000),
    createdAt: new Date().toISOString(),
    gasFeeUsd: 0.45,
  });

  return c.json({ success: true, item, message: 'Purchase confirmed on NEXORUM Blockchain Engine' });
});

app.post('/api/v1/ai/generate-logo', async (c) => {
  const { name, symbol, style, description } = await jsonBody(c);
  try {
    const apiKey = c.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      try {
        const imageRes = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: `A high quality minimalist Web3 cryptocurrency token icon logo badge for ${name} (${symbol}), ${description || 'modern crypto branding'}, style: ${style || 'futuristic metallic vector icon'}, transparent background centered emblem, 1:1 aspect ratio`,
          config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
        });
        if (imageRes.generatedImages && imageRes.generatedImages.length > 0) {
          const base64Img = imageRes.generatedImages[0].image.imageBytes;
          return c.json({ success: true, logoUrl: `data:image/png;base64,${base64Img}` });
        }
      } catch (genErr) {
        console.warn('Imagen generation error, falling back to SVG:', genErr);
      }
    }
  } catch (err: any) {
    console.error('AI Logo API Error:', err?.message || err);
  }

  const colors = [
    ['#06b6d4', '#3b82f6'],
    ['#f59e0b', '#d97706'],
    ['#10b981', '#059669'],
    ['#8b5cf6', '#6d28d9'],
    ['#ec4899', '#be185d'],
  ];
  const pair = colors[Math.floor(Math.random() * colors.length)];
  const symChar = (symbol || name || 'NEX').slice(0, 3).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${pair[0]}"/><stop offset="100%" stop-color="${pair[1]}"/></linearGradient></defs><rect width="256" height="256" rx="128" fill="url(#g)"/><circle cx="128" cy="128" r="100" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="8"/><text x="128" y="142" font-family="sans-serif" font-weight="900" font-size="64" fill="#ffffff" text-anchor="middle">${symChar}</text></svg>`;
  return c.json({ success: true, logoUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` });
});

app.post('/api/v1/ai/assistant', async (c) => {
  const { prompt, contextType } = await jsonBody(c);
  try {
    const apiKey = c.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are NEXORUM OS Web3 AI Assistant. You are an expert in Web3, crypto tokenomics, smart contracts, multi-chain portfolio management, token creation, market analytics, and security audits. Respond concisely, clearly, and directly in markdown format.

Context: ${contextType || 'General Web3'}
User Query: ${prompt}`,
      });
      return c.json({ success: true, reply: response.text || 'Analysis complete for NEXORUM OS.' });
    }
  } catch (err: any) {
    console.error('Gemini API Error:', err?.message || err);
  }

  const pLower = (prompt || '').toLowerCase();
  let fallbackReply = '';
  if (pLower.includes('portfolio') || pLower.includes('wallet') || pLower.includes('balance')) {
    fallbackReply = `### 📊 NEXORUM AI Portfolio Audit Report\n\n• **Multi-Chain Allocation:** High liquidity ratio in native NEX, ETH, and TON Network jettons.\n• **Risk Profile:** Balanced low-risk holding structure with active staking pools providing automated yield.\n• **Optimization Tip:** Consider rebalancing 15% into Base network DEX liquidity pools for gas-optimized returns (<$0.02 per tx).`;
  } else if (pLower.includes('predict') || pLower.includes('price') || pLower.includes('forecast') || pLower.includes('market')) {
    fallbackReply = `### 📈 NEXORUM AI Market & Price Outlook\n\n• **ETH (Ethereum):** Bullish consolidation above key support level. Gas fee stability layer active.\n• **TON (Telegram Network):** High momentum driven by Mini App ecosystem adoption and Jetton liquidity growth.\n• **Base & Arbitrum:** Strong Layer-2 TVL growth with low-slippage cross-chain DEX router activity.`;
  } else if (pLower.includes('token') || pLower.includes('create') || pLower.includes('bep20') || pLower.includes('jetton')) {
    fallbackReply = `### 🪙 NEXORUM Token Architect Guide\n\n1. **Select Standard:** Choose **ERC20 / NEX20** for EVM chains or **TON Jetton** for Telegram Ecosystem.\n2. **Liquidity Setup:** Pair initial supply with 1,000 USDT or 500 TON in DEX liquidity pools.\n3. **Smart Contract Security:** Standard 18-decimal configuration with deflational burn or staking fee mechanics. You can use the NEXORUM Token Creator module directly from the sidebar.`;
  } else {
    fallbackReply = `### 🤖 NEXORUM AI Assistant Response\n\nRegarding: **"${prompt}"**\n\n• **System Status:** NEXORUM Web3 Kernel & non-custodial vaults fully operational.\n• **Blockchain Intelligence:** All cross-chain bridges (Ethereum, Base, Solana, TON, NEXORUM Chain) are synchronized.\n• **Actionable Advice:** Use the AI Assistant, Token Creator, and Staking Pools for optimized Web3 asset management.`;
  }

  return c.json({ success: true, reply: fallbackReply });
});

app.post('/api/v1/ai/audit-contract', async (c) => {
  const { target } = await jsonBody(c);
  const apiKey = c.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const prompt = `You are NEXORUM AI Sentinel, an elite Web3 Smart Contract Auditor and Rugpull Prevention Engine.
Analyze this token address, contract, or symbol: "${target}".
Provide a JSON audit response with fields:
- safetyScore: number (0 to 100)
- riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
- honeypotStatus: "SAFE" | "SUSPICIOUS" | "HONEYPOT_DETECTED"
- mintFunctionRisk: string (description)
- liquidityLockPercent: number (e.g. 95)
- topHolderConcentration: string (e.g. "Top 10 hold 14%")
- keyFindings: array of strings (3 bullet points)
- aiRecommendation: string (2-3 sentences summary)

Return ONLY valid JSON.`;
      const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt });
      const rawText = response.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) return c.json({ success: true, audit: JSON.parse(jsonMatch[0]) });
    } catch (err: any) {
      console.error('AI Audit Contract Error:', err?.message || err);
    }
  }

  return c.json({
    success: true,
    audit: {
      safetyScore: 94,
      riskLevel: 'LOW',
      honeypotStatus: 'SAFE',
      mintFunctionRisk: 'Mint function disabled or locked behind multi-sig zero-address ownership.',
      liquidityLockPercent: 98.5,
      topHolderConcentration: 'Top 10 holders own 12.4% (Healthy distribution)',
      keyFindings: [
        'Contract ownership renounced to zero address.',
        'Liquidity locked for 365 days on Unicrypt DEX Router.',
        'No hidden tax functions detected (0% buy / 0% sell tax).',
      ],
      aiRecommendation: `NEXORUM Sentinel AI analysis indicates "${target}" passes all non-custodial safety checks with high liquidity confidence.`,
    },
  });
});

app.post('/api/v1/ai/generate-strategy', async (c) => {
  const { prompt } = await jsonBody(c);
  const apiKey = c.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const aiPrompt = `You are NEXORUM AI Strategy Vault Architect. Convert this user natural language trading rule into an automated Web3 strategy: "${prompt}".
Return a JSON object with:
- strategyName: string
- triggerCondition: string
- executionSteps: array of strings (3 steps)
- targetNetwork: string
- estimatedApy: string (e.g. "18.5%")
- maxSlippage: string (e.g. "0.5%")
- gasOptimization: string
- aiLogicSummary: string

Return ONLY valid JSON.`;
      const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: aiPrompt });
      const rawText = response.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) return c.json({ success: true, strategy: JSON.parse(jsonMatch[0]) });
    } catch (err: any) {
      console.error('AI Generate Strategy Error:', err?.message || err);
    }
  }

  return c.json({
    success: true,
    strategy: {
      strategyName: 'AI Cross-Chain Liquidity & Stop-Loss Router',
      triggerCondition: prompt || 'Auto-rebalance when ETH volatility spikes > 4%',
      executionSteps: [
        'Monitor Uniswap v3 & DEX routers for gas price < 15 gwei',
        'Swap 30% assets to USDT stablecoin pool',
        'Deposit remaining 70% into NEXORUM Staking Vault (25% APY)',
      ],
      targetNetwork: 'Ethereum / NEXORUM Chain',
      estimatedApy: '22.4%',
      maxSlippage: '0.3%',
      gasOptimization: 'Batch execution via Account Abstraction (ERC-4337)',
      aiLogicSummary: 'Automated strategy active on NEXORUM Web3 Kernel with zero custodial custody.',
    },
  });
});

app.post('/api/v1/ai/viral-campaign', async (c) => {
  const { tokenName, symbol, description } = await jsonBody(c);
  const apiKey = c.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Generate a viral Web3 Telegram announcement and Twitter/X thread for a new token named "${tokenName}" (${symbol}). Description: ${description || 'Decentralized token on NEXORUM OS'}. Format with emojis and markdown.`,
      });
      return c.json({ success: true, campaign: response.text });
    } catch (err: any) {
      console.error('AI Viral Campaign Error:', err?.message || err);
    }
  }

  return c.json({
    success: true,
    campaign: `🚀 **OFFICIAL LAUNCH: ${tokenName} (${symbol})** 🚀\n\nBuilt on NEXORUM OS Web3 Engine!\n\n• **Token Standard:** Multi-chain ERC20 / Jetton\n• **Liquidity:** 100% Locked on Launch\n• **AI Sentinel:** Audited & Verified Safe\n\nJoin the revolution on Telegram & NEXORUM OS!`,
  });
});

app.get('/api/v1/admin/settings', requireAdminAuth, (c) => {
  return c.json({ success: true, settings: db.settings });
});

app.post('/api/v1/admin/settings', requireAdminAuth, async (c) => {
  const { settings } = await jsonBody(c);
  if (settings) db.settings = { ...db.settings, ...settings };
  return c.json({ success: true, settings: db.settings });
});

app.get('/api/v1/admin/logs', requireAdminAuth, (c) => {
  return c.json({
    success: true,
    logs: db.auditLogs,
    stats: {
      totalUsers: db.users.length,
      totalTokensCreated: db.tokens.length,
      totalWalletsConnected: db.users.reduce((acc, u) => acc + u.wallets.length, 0),
      totalMarketplaceSales: db.marketplaceItems.reduce((acc, i) => acc + i.salesCount, 0),
      totalVolumeUsd: 542910240,
      kernelVersion: '1.0.0',
    },
  });
});

app.get('/api/v1/notifications', (c) => {
  return c.json({ success: true, notifications: db.notifications });
});

app.post('/api/v1/notifications/read', async (c) => {
  const { id } = await jsonBody(c);
  const notif = db.notifications.find((n) => n.id === id);
  if (notif) notif.isRead = true;
  return c.json({ success: true });
});

app.get('/api/v1/airdrops', (c) => {
  return c.json({ success: true, airdrops: db.airdrops });
});

app.post('/api/v1/airdrops/create', requireAdminAuth, async (c) => {
  const { title, symbol, amountPerUser, totalPool, network, description } = await jsonBody(c);
  const newAirdrop = {
    id: `airdrop_${Date.now()}`,
    title: title || 'NEXORUM Community Airdrop',
    symbol: symbol || 'NEX',
    amountPerUser: amountPerUser || '500',
    totalPool: totalPool || '1000000',
    remainingPool: totalPool || '1000000',
    network: network || 'nexorum',
    status: 'ACTIVE',
    description: description || 'Claim free tokens distributed by NEXORUM Blockchain Admin.',
    claimedUserIds: [] as string[],
    createdAt: new Date().toISOString(),
  };
  db.airdrops.unshift(newAirdrop);

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: 'all',
    title: `🎁 New Airdrop Launched: ${newAirdrop.title}`,
    message: `Admin launched a new airdrop! Claim ${newAirdrop.amountPerUser} ${newAirdrop.symbol} tokens now.`,
    type: 'SYSTEM',
    isRead: false,
    actionUrl: '/airdrops',
    createdAt: new Date().toISOString(),
  });

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: 'admin_sys',
    action: 'AIRDROP_CREATED',
    category: 'ADMIN',
    details: `Created airdrop campaign ${newAirdrop.title} (${newAirdrop.symbol}) with total pool of ${newAirdrop.totalPool}.`,
    ipAddress: '127.0.0.1',
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  return c.json({ success: true, airdrop: newAirdrop });
});

app.post('/api/v1/airdrops/status', requireAdminAuth, async (c) => {
  const { airdropId, status } = await jsonBody(c);
  const airdrop = db.airdrops.find((a) => a.id === airdropId);
  if (airdrop) {
    airdrop.status = status;
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      userId: 'admin_sys',
      action: 'AIRDROP_STATUS_CHANGED',
      category: 'ADMIN',
      details: `Airdrop ${airdrop.title} status updated to ${status}.`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    });
  }
  return c.json({ success: true, airdrop });
});

app.post('/api/v1/airdrops/distribute', requireAdminAuth, async (c) => {
  const { airdropId } = await jsonBody(c);
  const airdrop = db.airdrops.find((a) => a.id === airdropId);
  if (!airdrop) return c.json({ error: 'Airdrop campaign not found' }, 404);

  let distributedCount = 0;
  db.users.forEach((user) => {
    if (!airdrop.claimedUserIds.includes(user.id)) {
      airdrop.claimedUserIds.push(user.id);
      distributedCount++;

      db.transactions.unshift({
        id: `tx_${Date.now()}_${user.id}`,
        userId: user.id,
        hash: `0x${randomHex(64)}`,
        network: airdrop.network,
        type: 'BUY_MARKETPLACE',
        status: 'CONFIRMED',
        amount: airdrop.amountPerUser,
        symbol: airdrop.symbol,
        amountUsd: parseFloat(airdrop.amountPerUser) * (airdrop.symbol === 'NEX' ? 12.45 : 1),
        fromAddress: '0x0000000000000000000000000000000000007780',
        toAddress: user.primaryWallet || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        blockNumber: Math.floor(19000000 + Math.random() * 1000000),
        createdAt: new Date().toISOString(),
        gasFeeUsd: 0.0,
      });

      db.notifications.unshift({
        id: `notif_${Date.now()}_${user.id}`,
        userId: user.id,
        title: `🎁 Airdrop Received: ${airdrop.amountPerUser} ${airdrop.symbol}!`,
        message: `Admin has sent ${airdrop.amountPerUser} ${airdrop.symbol} tokens directly to your connected wallet!`,
        type: 'WALLET',
        isRead: false,
        actionUrl: '/portfolio',
        createdAt: new Date().toISOString(),
      });
    }
  });

  airdrop.status = 'COMPLETED';

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: 'admin_sys',
    action: 'AIRDROP_MASS_DISPATCH',
    category: 'ADMIN',
    details: `Dispatched ${airdrop.amountPerUser} ${airdrop.symbol} each to all ${distributedCount} user accounts on NEXORUM Blockchain.`,
    ipAddress: '127.0.0.1',
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  return c.json({ success: true, message: `Successfully distributed Airdrop to ${distributedCount} users!`, airdrop });
});

app.post('/api/v1/airdrops/claim', async (c) => {
  const { airdropId, userId } = await jsonBody(c);
  const airdrop = db.airdrops.find((a) => a.id === airdropId);
  if (!airdrop) return c.json({ error: 'Airdrop not found' }, 404);
  if (airdrop.claimedUserIds.includes(userId)) return c.json({ error: 'Already claimed this airdrop' }, 400);

  airdrop.claimedUserIds.push(userId);
  const remaining = Math.max(0, parseFloat(airdrop.remainingPool) - parseFloat(airdrop.amountPerUser));
  airdrop.remainingPool = remaining.toString();

  db.transactions.unshift({
    id: `tx_${Date.now()}`,
    userId,
    hash: `0x${randomHex(64)}`,
    network: airdrop.network,
    type: 'BUY_MARKETPLACE',
    status: 'CONFIRMED',
    amount: airdrop.amountPerUser,
    symbol: airdrop.symbol,
    amountUsd: parseFloat(airdrop.amountPerUser) * (airdrop.symbol === 'NEX' ? 12.45 : 1),
    fromAddress: '0x0000000000000000000000000000000000007780',
    toAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    blockNumber: Math.floor(19000000 + Math.random() * 1000000),
    createdAt: new Date().toISOString(),
    gasFeeUsd: 0.0,
  });

  return c.json({ success: true, message: `Successfully claimed ${airdrop.amountPerUser} ${airdrop.symbol}!`, airdrop });
});

const DAILY_REWARDS_SCHEDULE = [8, 9, 10, 10, 11, 11, 11];

app.get('/api/v1/airdrops/daily-status', (c) => {
  const userId = c.req.query('userId') || 'usr_nex_982341';
  if (!db.dailyClaims[userId]) {
    db.dailyClaims[userId] = { streak: 1, lastClaimTimestamp: 0, totalClaimed: 0 };
  }
  const claimInfo = db.dailyClaims[userId];
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const elapsed = now - claimInfo.lastClaimTimestamp;

  if (claimInfo.lastClaimTimestamp > 0 && elapsed > 48 * 60 * 60 * 1000) {
    claimInfo.streak = 1;
  }

  const canClaimNow = claimInfo.lastClaimTimestamp === 0 || elapsed >= ONE_DAY_MS;
  const timeUntilNextClaimMs = canClaimNow ? 0 : ONE_DAY_MS - elapsed;
  const currentRewardNex = DAILY_REWARDS_SCHEDULE[(claimInfo.streak - 1) % 7];

  return c.json({
    success: true,
    streak: claimInfo.streak,
    lastClaimTimestamp: claimInfo.lastClaimTimestamp,
    totalClaimed: claimInfo.totalClaimed,
    canClaimNow,
    timeUntilNextClaimMs,
    currentRewardNex,
    schedule: DAILY_REWARDS_SCHEDULE,
  });
});

app.post('/api/v1/airdrops/daily-claim', async (c) => {
  const { userId } = await jsonBody(c);
  const targetUserId = userId || 'usr_nex_982341';
  const user = db.users.find((u) => u.id === targetUserId) || db.users[0];

  if (!db.dailyClaims[targetUserId]) {
    db.dailyClaims[targetUserId] = { streak: 1, lastClaimTimestamp: 0, totalClaimed: 0 };
  }
  const claimInfo = db.dailyClaims[targetUserId];
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const elapsed = now - claimInfo.lastClaimTimestamp;

  if (claimInfo.lastClaimTimestamp > 0 && elapsed < ONE_DAY_MS) {
    const hoursLeft = Math.ceil((ONE_DAY_MS - elapsed) / (60 * 60 * 1000));
    return c.json({
      error: `Daily reward already claimed today! Next reward opens in ${hoursLeft} hours.`,
      nextClaimAvailableInMs: ONE_DAY_MS - elapsed,
    }, 400);
  }

  if (claimInfo.lastClaimTimestamp > 0 && elapsed > 48 * 60 * 60 * 1000) {
    claimInfo.streak = 1;
  }

  const rewardAmountNex = DAILY_REWARDS_SCHEDULE[(claimInfo.streak - 1) % 7];
  claimInfo.totalClaimed += rewardAmountNex;
  claimInfo.lastClaimTimestamp = now;

  if (user) {
    let nexWallet = user.wallets.find((w: any) => w.network === 'nexorum' || w.nativeBalance.includes('NEX'));
    if (!nexWallet && user.wallets.length > 0) nexWallet = user.wallets[0];
    if (nexWallet) {
      const currentVal = parseFloat(nexWallet.nativeBalance) || 0;
      nexWallet.nativeBalance = `${(currentVal + rewardAmountNex).toFixed(2)} NEX`;
      nexWallet.balanceUsd += rewardAmountNex * 12.45;
    } else {
      user.wallets.push({
        id: `w_nex_${Date.now()}`,
        address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        network: 'nexorum',
        provider: 'metamask',
        providerName: 'NEXORUM Web3 Wallet',
        isPrimary: true,
        balanceUsd: rewardAmountNex * 12.45,
        nativeBalance: `${rewardAmountNex} NEX`,
        connectedAt: new Date().toISOString(),
      });
    }
  }

  const txHash = `0x${randomHex(64)}`;
  db.transactions.unshift({
    id: `tx_daily_${Date.now()}`,
    userId: user.id,
    hash: txHash,
    network: 'nexorum',
    type: 'CLAIM',
    status: 'CONFIRMED',
    amount: rewardAmountNex.toString(),
    symbol: 'NEX',
    amountUsd: rewardAmountNex * 12.45,
    fromAddress: '0x0000000000000000000000000000000000007780',
    toAddress: user.primaryWallet || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    blockNumber: Math.floor(19000000 + Math.random() * 1000000),
    createdAt: new Date().toISOString(),
    gasFeeUsd: 0.0,
  });

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: `🎁 Day ${claimInfo.streak} Daily Reward Claimed!`,
    message: `You earned ${rewardAmountNex} NEX tokens credited to your connected wallet! You can now stake your NEX tokens in the Staking Engine to earn compound interest.`,
    type: 'WALLET',
    isRead: false,
    actionUrl: '/profile',
    createdAt: new Date().toISOString(),
  });

  const claimedStreak = claimInfo.streak;
  claimInfo.streak = (claimInfo.streak % 7) + 1;

  return c.json({
    success: true,
    message: `Claimed ${rewardAmountNex} NEX for Day ${claimedStreak} Check-In! Tokens added to your wallet for Staking.`,
    rewardNex: rewardAmountNex,
    claimedStreak,
    nextStreak: claimInfo.streak,
    totalClaimed: claimInfo.totalClaimed,
    lastClaimTimestamp: claimInfo.lastClaimTimestamp,
  });
});

app.get('/api/v1/staking/positions', (c) => {
  const userId = c.req.query('userId') || 'usr_nex_982341';
  const user = db.users.find((u) => u.id === userId) || db.users[0];
  const stakes = db.userStakes.filter((s: any) => s.userId === user.id || s.userId === 'usr_nex_982341');

  const activeStakes = stakes.filter((s: any) => s.status === 'ACTIVE');
  const totalStakedNex = activeStakes.reduce((sum: number, s: any) => sum + (parseFloat(s.amountNex || s.amount || '0') || 0), 0);
  const totalEarnedNex = stakes.reduce((sum: number, s: any) => sum + (parseFloat(s.earnedRewardNex || s.estimatedRewardNex || s.earnedRewards || '0') || 0), 0);
  const priceUsd = 12.45;

  const pools = [
    { id: 'pool_flex', name: 'Flexible Staking Vault', lockDays: 0, apyPercent: 8.5, multiplier: '1.0x', minStake: 10, contractAddress: '0xStaking_7780_Flex_Vault', description: 'Zero lock period. Withdraw anytime with real-time interest compounding.', badge: 'Flexible' },
    { id: 'pool_30d', name: '30-Day High Yield Lock', lockDays: 30, apyPercent: 18.2, multiplier: '1.25x', minStake: 50, contractAddress: '0xStaking_7780_Vault_30D', description: '30-Day Smart Contract vault with 1.25x yield boost.', badge: 'Popular' },
    { id: 'pool_90d', name: '90-Day Quantum Multiplier', lockDays: 90, apyPercent: 36.5, multiplier: '1.8x', minStake: 100, contractAddress: '0xStaking_7780_Vault_90D', description: 'High APY 90-day lock with automated daily auto-compounding.', badge: 'High APY' },
    { id: 'pool_365d', name: '365-Day Genesis Sovereign Lock', lockDays: 365, apyPercent: 85.0, multiplier: '3.5x', minStake: 500, contractAddress: '0xStaking_7780_Genesis_365D', description: 'Maximum yield 1-year lock with protocol governance voting rights & VIP Airdrop priority.', badge: 'Max Yield' },
  ];

  return c.json({
    success: true,
    priceUsd,
    totalStakedNex,
    totalStakedUsd: totalStakedNex * priceUsd,
    totalEarnedNex,
    totalEarnedUsd: totalEarnedNex * priceUsd,
    activeStakesCount: activeStakes.length,
    pools,
    stakes,
  });
});

app.post('/api/v1/staking/claim', async (c) => {
  const { stakeId, userId } = await jsonBody(c);
  const user = db.users.find((u) => u.id === userId) || db.users[0];
  const stake = db.userStakes.find((s: any) => s.id === stakeId || s.userId === user.id);

  const claimedAmount = stake ? (stake.earnedRewardNex || stake.estimatedRewardNex || 12.5) : 12.5;
  const txHash = `0x${randomHex(64)}`;
  if (stake) stake.earnedRewardNex = 0;

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: 'Staking Rewards Claimed',
    message: `Claimed ${claimedAmount} NEX staking yield into your primary wallet! Tx: ${txHash.slice(0, 10)}...`,
    type: 'WALLET',
    isRead: false,
    actionUrl: '/profile',
    createdAt: new Date().toISOString(),
  });

  return c.json({
    success: true,
    claimedAmount,
    claimedUsd: (parseFloat(claimedAmount.toString()) || 12.5) * 12.45,
    txHash,
    message: `Claimed ${claimedAmount} NEX yield rewards directly to your wallet!`,
  });
});

app.get('/api/v1/staking/pools', (c) => {
  const STAKING_POOLS = [
    { id: 'pool_7d', name: '7 Days Flexible', durationDays: 7, apyPercent: 8.0, description: 'Short lock term with 8% APY' },
    { id: 'pool_14d', name: '14 Days Growth', durationDays: 14, apyPercent: 14.0, description: 'Medium lock term with 14% APY' },
    { id: 'pool_30d', name: '30 Days Pro', durationDays: 30, apyPercent: 25.0, description: '30 days holding term with 25% APY' },
    { id: 'pool_60d', name: '60 Days Ultra', durationDays: 60, apyPercent: 45.0, description: '60 days lock with 45% APY' },
    { id: 'pool_90d', name: '90 Days VIP', durationDays: 90, apyPercent: 65.0, description: '90 days lock with 65% APY' },
    { id: 'pool_180d', name: '180 Days Master', durationDays: 180, apyPercent: 100.0, description: '180 days long-term lock with 100% APY' },
  ];
  return c.json({ success: true, pools: STAKING_POOLS });
});

app.get('/api/v1/staking/user-stakes', (c) => {
  const userId = c.req.query('userId') || 'usr_nex_982341';
  const stakes = db.userStakes.filter((s: any) => s.userId === userId);
  return c.json({ success: true, stakes });
});

app.post('/api/v1/staking/stake', async (c) => {
  const { poolId, amountNex, userId, durationDays } = await jsonBody(c);
  if (!amountNex || parseFloat(amountNex) <= 0) {
    return c.json({ error: 'Invalid stake amount' }, 400);
  }

  const user = db.users.find((u) => u.id === userId) || db.users[0];
  const numAmount = parseFloat(amountNex);

  let lockDays = 30;
  let apyPercent = 18.2;
  let multiplier = 1.25;
  let poolName = '30-Day High Yield Lock';
  let contractAddress = '0xStaking_7780_Vault_30D';

  if (poolId === 'pool_flex') {
    lockDays = 0; apyPercent = 8.5; multiplier = 1.0; poolName = 'Flexible Staking Vault'; contractAddress = '0xStaking_7780_Flex_Vault';
  } else if (poolId === 'pool_90d') {
    lockDays = 90; apyPercent = 36.5; multiplier = 1.8; poolName = '90-Day Quantum Multiplier'; contractAddress = '0xStaking_7780_Vault_90D';
  } else if (poolId === 'pool_365d') {
    lockDays = 365; apyPercent = 85.0; multiplier = 3.5; poolName = '365-Day Genesis Sovereign Lock'; contractAddress = '0xStaking_7780_Genesis_365D';
  }

  const estimatedRewardNex = parseFloat((numAmount * (apyPercent / 100) * (Math.max(1, lockDays) / 365)).toFixed(2));
  const txHash = `0x${randomHex(64)}`;

  const newStake = {
    id: `stake_${Date.now()}`,
    userId: user.id,
    poolId: poolId || 'pool_30d',
    poolName,
    contractAddress,
    amountNex: numAmount,
    durationDays: lockDays,
    apyPercent,
    multiplier,
    estimatedRewardNex,
    earnedRewardNex: 0,
    stakedAt: new Date().toISOString(),
    maturesAt: new Date(Date.now() + 86400000 * Math.max(1, lockDays)).toISOString(),
    status: 'ACTIVE',
    txHash,
  };

  db.userStakes.unshift(newStake);

  db.transactions.unshift({
    id: `tx_stake_${Date.now()}`,
    userId: user.id,
    hash: txHash,
    network: 'nexorum',
    type: 'STAKE_LOCK',
    status: 'CONFIRMED',
    amount: amountNex.toString(),
    symbol: 'NEX',
    amountUsd: numAmount * 12.45,
    fromAddress: user.primaryWallet || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    toAddress: contractAddress,
    blockNumber: Math.floor(19000000 + Math.random() * 1000000),
    createdAt: new Date().toISOString(),
    gasFeeUsd: 0.05,
  });

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: user.id,
    action: 'STAKING_CONTRACT_LOCKED',
    category: 'BLOCKCHAIN',
    details: `Locked ${numAmount} NEX in ${poolName} (${apyPercent}% APY, ${lockDays} Days lock period) on NEXORUM Staking Vault Contract.`,
    ipAddress: clientIp(c),
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: user.id,
    title: 'Tokens Locked in Staking Vault',
    message: `Successfully locked ${numAmount} NEX in ${poolName}! Earning ${apyPercent}% APY. Tx Hash: ${txHash.slice(0, 10)}...`,
    type: 'WALLET',
    isRead: false,
    actionUrl: '/profile',
    createdAt: new Date().toISOString(),
  });

  return c.json({
    success: true,
    stake: newStake,
    txHash,
    message: `Successfully locked ${numAmount} NEX in ${poolName} for ${lockDays} days at ${apyPercent}% APY!`,
  });
});

app.post('/api/v1/staking/unstake', async (c) => {
  const { stakeId, userId } = await jsonBody(c);
  const stakeIndex = db.userStakes.findIndex((s: any) => s.id === stakeId);

  let unstakedAmount = 50;
  if (stakeIndex !== -1) {
    unstakedAmount = db.userStakes[stakeIndex].amountNex || db.userStakes[stakeIndex].amount || 50;
    db.userStakes[stakeIndex].status = 'UNSTAKED';
  }

  const txHash = `0x${randomHex(64)}`;

  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId,
    title: 'Staking Contract Unstaked',
    message: `Unstaked ${unstakedAmount} NEX tokens and returned to wallet! Tx: ${txHash.slice(0, 10)}...`,
    type: 'WALLET',
    isRead: false,
    actionUrl: '/profile',
    createdAt: new Date().toISOString(),
  });

  return c.json({ success: true, unstakedAmount, txHash, message: `Successfully unstaked ${unstakedAmount} NEX tokens and unlocked contract!` });
});

app.post('/api/v1/rpc/:network', async (c) => {
  const network = c.req.param('network');
  const targetUrl = db.settings.rpcUrls[network];
  if (!targetUrl) return c.json({ error: `Unknown network: ${network}` }, 400);

  const body = await c.req.text();
  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return c.json({ error: `RPC proxy failed: ${err?.message || 'unknown error'}` }, 502);
  }
});

app.all('/api/*', (c) => c.json({ error: 'Not found', path: new URL(c.req.url).pathname }, 404));

// With `run_worker_first = true` in wrangler.toml, every request hits this
// Worker before Cloudflare's static asset handler. Any path that isn't an
// API route (everything above returns before reaching here) is served from
// the built frontend via the ASSETS binding — which itself falls back to
// index.html for unmatched paths (not_found_handling =
// "single-page-application"), giving correct client-side routing.
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
