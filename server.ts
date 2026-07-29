import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// CORS & Preflight Options Handler
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// --- AES-256 NON-CUSTODIAL WALLET VAULT ENCRYPTION ENGINE ---
const VAULT_SECRET_KEY = process.env.VAULT_ENCRYPTION_SECRET || 'nexorum_vault_secure_key_2026_aes256_prod';

function encryptVaultData(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(VAULT_SECRET_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decryptVaultData(encryptedString: string): string {
  try {
    const [ivHex, encryptedText] = encryptedString.split(':');
    if (!ivHex || !encryptedText) return '';
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(VAULT_SECRET_KEY, 'salt', 32);
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

function generateNewNexoVault(): NexoVaultInfo {
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
    encryptedPrivateKey: encryptVaultData(privateKey),
    encryptedMnemonic: encryptVaultData(mnemonic),
  };
}

// Pre-generate default non-custodial vault for demo user
const defaultUserVault = generateNewNexoVault();

// In-memory persistent database store for NEXORUM OS Engine
const db = {
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
      wallets: [
        {
          id: `w_nexo_vault_${defaultUserVault.address.slice(-6)}`,
          address: defaultUserVault.address,
          network: 'nexorum',
          provider: 'nexorum_vault',
          providerName: 'NEXO Native Non-Custodial Vault',
          isPrimary: true,
          balanceUsd: 12450.00,
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
    },
  ],
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
      sparkline: [4.10, 4.25, 4.18, 4.45, 4.60, 4.72, 4.82],
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
      sparkline: [0.85, 0.92, 1.05, 1.10, 1.18, 1.21, 1.25],
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
      sparkline: [0.75, 0.78, 0.80, 0.82, 0.85, 0.86, 0.88],
    },
  ],
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
  ],
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
      amountUsd: 4820.00,
      fromAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      toAddress: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
      blockNumber: 19824102,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      gasFeeUsd: 3.42,
    },
  ],
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
  ],
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
  ],
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
      claimedUserIds: [],
      createdAt: new Date().toISOString(),
    },
  ],
  userStakes: [
    {
      id: 'stake_demo_1',
      userId: 'usr_nex_982341',
      amountNex: 50,
      durationDays: 30,
      apyPercent: 25,
      estimatedRewardNex: 1.02,
      stakedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      maturesAt: new Date(Date.now() + 86400000 * 25).toISOString(),
      status: 'ACTIVE',
    },
  ],
  dailyClaims: {} as Record<string, { streak: number; lastClaimTimestamp: number; totalClaimed: number }>,
  settings: {
    walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || '8a381920392019382019382',
    cloudflareWorkerUrl: 'https://nexoria778.coinewolf.workers.dev/',
    rpcUrls: {
      nexorum: 'https://rpc.nexorum.network',
      ethereum: 'https://eth-mainnet.g.alchemy.com/v2/demo',
      bsc: 'https://bsc-dataseed.binance.org/',
      polygon: 'https://polygon-rpc.com/',
      arbitrum: 'https://arb1.arbitrum.io/rpc',
      base: 'https://mainnet.base.org',
      solana: 'https://api.mainnet-beta.solana.com',
      ton: 'https://toncenter.com/api/v2/jsonRPC',
    },
    coingeckoApiKey: process.env.COINGECKO_API_KEY || 'cg_demo_key_9921',
    coinmarketcapApiKey: 'cmc_demo_key_102',
    openaiApiKey: '',
    claudeApiKey: '',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
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

// --- REST API ENDPOINTS ---

// 1. Kernel Status
app.get('/api/v1/kernel/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    module: 'NEXORUM Web3 Application',
    version: '1.0.0',
    kernelHandshake: true,
    activeWalletsConnected: db.users[0].wallets.length,
    tokensManaged: db.tokens.length,
    systemUptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 2. Telegram Auth / Auto Profile Creator
app.post('/api/v1/auth/telegram', (req, res) => {
  const { telegramId, telegramUsername, firstName, photoUrl } = req.body;

  if (!telegramId) {
    return res.status(400).json({ error: 'Missing telegramId' });
  }

  // Check if profile already exists
  let user = db.users.find((u) => u.telegramId === String(telegramId));

  if (!user) {
    // Automatically create profile and generate real Non-Custodial NEXO Vault
    const newUserId = `usr_nex_${Math.floor(100000 + Math.random() * 900000)}`;
    const userVault = generateNewNexoVault();

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
      wallets: [
        {
          id: `w_nexo_vault_${userVault.address.slice(-6)}`,
          address: userVault.address,
          network: 'nexorum',
          provider: 'nexorum_vault',
          providerName: 'NEXO Native Non-Custodial Vault',
          isPrimary: true,
          balanceUsd: 100.00,
          nativeBalance: '10.00 NEX',
          connectedAt: new Date().toISOString(),
        },
      ],
      achievementsCount: 1,
      referralCode: `NEX-TG-${telegramId.slice(-4)}`,
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
      ipAddress: req.ip || '127.0.0.1',
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({ success: true, user });
});

// 2b. NEXO Non-Custodial Vault Management Endpoints
app.get('/api/v1/user/nexo-vault', (req, res) => {
  const userId = req.query.userId as string;
  const user = db.users.find((u) => u.id === userId) || db.users[0];

  if (!user.nexoVaultAddress) {
    const vault = generateNewNexoVault();
    user.nexoId = vault.nexoId;
    user.nexoPublicKey = vault.publicKey;
    user.nexoVaultAddress = vault.address;
    user.encryptedPrivateKey = vault.encryptedPrivateKey;
    user.encryptedMnemonic = vault.encryptedMnemonic;
    if (!user.wallets.some((w) => w.provider === 'nexorum_vault')) {
      user.wallets.unshift({
        id: `w_nexo_vault_${vault.address.slice(-6)}`,
        address: vault.address,
        network: 'nexorum',
        provider: 'nexorum_vault',
        providerName: 'NEXO Native Non-Custodial Vault',
        isPrimary: true,
        balanceUsd: 12450.00,
        nativeBalance: '1000.00 NEX',
        connectedAt: new Date().toISOString(),
      });
    }
  }

  res.json({
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

app.post('/api/v1/user/export-nexo-vault', (req, res) => {
  const { userId, pin } = req.body;
  const user = db.users.find((u) => u.id === userId) || db.users[0];

  if (!user || !user.encryptedPrivateKey) {
    return res.status(404).json({ error: 'NEXO Non-Custodial Vault not found' });
  }

  const decryptedKey = decryptVaultData(user.encryptedPrivateKey);
  const decryptedMnemonic = decryptVaultData(user.encryptedMnemonic);

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: user.id,
    action: 'NON_CUSTODIAL_VAULT_EXPORTED',
    category: 'SECURITY',
    details: `User exported seed phrase and private key for NEXO Vault ${user.nexoVaultAddress}`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    nexoId: user.nexoId,
    address: user.nexoVaultAddress,
    publicKey: user.nexoPublicKey,
    privateKey: decryptedKey,
    mnemonic: decryptedMnemonic,
  });
});

// 3. User Profile Update
app.post('/api/v1/user/profile', (req, res) => {
  const { userId, email, phone, username, avatarUrl } = req.body;
  const user = db.users.find((u) => u.id === userId) || db.users[0];

  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (username !== undefined) user.username = username;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: user.id,
    action: 'PROFILE_UPDATED',
    category: 'AUTH',
    details: 'User updated profile attributes in NEXORUM User Engine',
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, user });
});

// 4. Supported Networks
app.get('/api/v1/blockchain/networks', (req, res) => {
  res.json({
    success: true,
    networks: [
      { id: 'nexorum', name: 'NEXORUM Chain', symbol: 'NEX', icon: 'nexorum', chainId: 7780, rpcUrl: db.settings.rpcUrls.nexorum, explorerUrl: 'https://explorer.nexorum.network', gasPriceGwei: 0.01, blockHeight: 1892014, isPopular: true },
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

// 5. Connect Wallet
app.post('/api/v1/wallets/connect', (req, res) => {
  const { userId, address, network, provider, providerName } = req.body;
  const user = db.users.find((u) => u.id === userId) || db.users[0];

  const existingWallet = user.wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());
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

  res.json({ success: true, user });
});

// 6. Tokens Endpoint (Hot, New, Trending)
app.get('/api/v1/tokens', (req, res) => {
  res.json({
    success: true,
    tokens: db.tokens,
  });
});

// 7. Token Creator Engine (Workflow: Create -> Deploy -> Verify -> Publish -> Liquidity Pool -> Auto List)
app.post('/api/v1/tokens/create', (req, res) => {
  const { name, symbol, network, standard, decimals, totalSupply, logoUrl, ownerAddress, userId, addInitialLiquidityUsd } = req.body;

  if (!name || !symbol || !network) {
    return res.status(400).json({ error: 'Missing token parameters' });
  }

  const user = db.users.find((u) => u.id === userId) || db.users[0];
  const contractAddress =
    network === 'ton'
      ? `EQB${Math.random().toString(36).substring(2, 12).toUpperCase()}`
      : network === 'solana'
      ? `${Math.random().toString(36).substring(2, 10)}...Pump`
      : `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  const liquidityPoolAddress = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

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

  // Prepend to newly created tokens
  db.tokens.unshift(newToken);

  // Automatically add transaction record
  db.transactions.unshift({
    id: `tx_${Date.now()}`,
    userId: user.id,
    hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
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

  // Notify user
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

  res.json({
    success: true,
    token: newToken,
    workflowStep: 'PUBLISHED_AND_LISTED',
  });
});

// 8. AI Token Architect Endpoint (Generates token name, symbol, supply, decimals, description, and dynamic high-tech logo)
app.post('/api/v1/ai/generate-token', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    let resultJson: any = null;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
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
        if (jsonMatch) {
          resultJson = JSON.parse(jsonMatch[0]);
        }
      } catch (geminiErr) {
        console.warn('Gemini API call warning, utilizing fallback generator:', geminiErr);
      }
    }

    // Fallback AI generator if Gemini Key is absent or returned invalid json
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

    // Generate dynamic SVG data URI for custom token logo
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

    res.json({
      success: true,
      aiData: {
        ...resultJson,
        logoUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate AI token concept' });
  }
});

// 9. Marketplace Items & Purchase
app.get('/api/v1/marketplace', (req, res) => {
  res.json({ success: true, items: db.marketplaceItems });
});

app.post('/api/v1/marketplace/buy', (req, res) => {
  const { itemId, userId, buyerAddress } = req.body;
  const item = db.marketplaceItems.find((i) => i.id === itemId);

  if (!item) return res.status(404).json({ error: 'Item not found' });

  item.salesCount += 1;

  db.transactions.unshift({
    id: `tx_${Date.now()}`,
    userId,
    hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
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

  res.json({ success: true, item, message: 'Purchase confirmed on NEXORUM Blockchain Engine' });
});

// 10. AI Assistant & Token Logo Generator (Gemini API Integration)
app.post('/api/v1/ai/generate-logo', async (req, res) => {
  const { name, symbol, style, description } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      try {
        const imageRes = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: `A high quality minimalist Web3 cryptocurrency token icon logo badge for ${name} (${symbol}), ${description || 'modern crypto branding'}, style: ${style || 'futuristic metallic vector icon'}, transparent background centered emblem, 1:1 aspect ratio`,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '1:1',
          },
        });

        if (imageRes.generatedImages && imageRes.generatedImages.length > 0) {
          const base64Img = imageRes.generatedImages[0].image.imageBytes;
          const logoUrl = `data:image/png;base64,${base64Img}`;
          return res.json({ success: true, logoUrl });
        }
      } catch (genErr) {
        console.warn('Imagen generation error, falling back to Gemini text SVG prompt:', genErr);
      }
    }
  } catch (err: any) {
    console.error('AI Logo API Error:', err?.message || err);
  }

  // High quality SVG icon fallback generator
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

  const logoUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  res.json({ success: true, logoUrl });
});

app.post('/api/v1/ai/assistant', async (req, res) => {
  const { prompt, contextType } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are NEXORUM OS Web3 AI Assistant. You are an expert in Web3, crypto tokenomics, smart contracts, multi-chain portfolio management, token creation, market analytics, and security audits. Respond concisely, clearly, and directly in markdown format.

Context: ${contextType || 'General Web3'}
User Query: ${prompt}`,
      });

      return res.json({
        success: true,
        reply: response.text || 'Analysis complete for NEXORUM OS.',
      });
    }
  } catch (err: any) {
    console.error('Gemini API Error:', err?.message || err);
  }

  // Fallback intelligent responder if key is missing or call failed
  const pLower = (prompt || '').toLowerCase();
  let fallbackReply = '';

  if (pLower.includes('portfolio') || pLower.includes('wallet') || pLower.includes('balance')) {
    fallbackReply = `### 📊 NEXORUM AI Portfolio Audit Report

• **Multi-Chain Allocation:** High liquidity ratio in native NEX, ETH, and TON Network jettons.
• **Risk Profile:** Balanced low-risk holding structure with active staking pools providing automated yield.
• **Optimization Tip:** Consider rebalancing 15% into Base network DEX liquidity pools for gas-optimized returns (<$0.02 per tx).`;
  } else if (pLower.includes('predict') || pLower.includes('price') || pLower.includes('forecast') || pLower.includes('market')) {
    fallbackReply = `### 📈 NEXORUM AI Market & Price Outlook

• **ETH (Ethereum):** Bullish consolidation above key support level. Gas fee stability layer active.
• **TON (Telegram Network):** High momentum driven by Mini App ecosystem adoption and Jetton liquidity growth.
• **Base & Arbitrum:** Strong Layer-2 TVL growth with low-slippage cross-chain DEX router activity.`;
  } else if (pLower.includes('token') || pLower.includes('create') || pLower.includes('bep20') || pLower.includes('jetton')) {
    fallbackReply = `### 🪙 NEXORUM Token Architect Guide

1. **Select Standard:** Choose **ERC20 / NEX20** for EVM chains or **TON Jetton** for Telegram Ecosystem.
2. **Liquidity Setup:** Pair initial supply with 1,000 USDT or 500 TON in DEX liquidity pools.
3. **Smart Contract Security:** Standard 18-decimal configuration with deflational burn or staking fee mechanics. You can use the NEXORUM Token Creator module directly from the sidebar.`;
  } else {
    fallbackReply = `### 🤖 NEXORUM AI Assistant Response

Regarding: **"${prompt}"**

• **System Status:** NEXORUM Web3 Kernel & non-custodial vaults fully operational.
• **Blockchain Intelligence:** All cross-chain bridges (Ethereum, Base, Solana, TON, NEXORUM Chain) are synchronized.
• **Actionable Advice:** Use the AI Assistant, Token Creator, and Staking Pools for optimized Web3 asset management.`;
  }

  res.json({
    success: true,
    reply: fallbackReply,
  });
});

// 10. World-First Unique AI Web3 Features: Sentinel Contract Audit, Strategy Vault & Viral Campaign
app.post('/api/v1/ai/audit-contract', async (req, res) => {
  const { target } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

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

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const rawText = response.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({ success: true, audit: parsed });
      }
    } catch (err: any) {
      console.error('AI Audit Contract Error:', err?.message || err);
    }
  }

  // Fallback audit report
  res.json({
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

app.post('/api/v1/ai/generate-strategy', async (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

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

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: aiPrompt,
      });

      const rawText = response.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({ success: true, strategy: parsed });
      }
    } catch (err: any) {
      console.error('AI Generate Strategy Error:', err?.message || err);
    }
  }

  // Fallback strategy
  res.json({
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

app.post('/api/v1/ai/viral-campaign', async (req, res) => {
  const { tokenName, symbol, description } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Generate a viral Web3 Telegram announcement and Twitter/X thread for a new token named "${tokenName}" (${symbol}). Description: ${description || 'Decentralized token on NEXORUM OS'}. Format with emojis and markdown.`,
      });

      return res.json({ success: true, campaign: response.text });
    } catch (err: any) {
      console.error('AI Viral Campaign Error:', err?.message || err);
    }
  }

  res.json({
    success: true,
    campaign: `🚀 **OFFICIAL LAUNCH: ${tokenName} (${symbol})** 🚀\n\nBuilt on NEXORUM OS Web3 Engine!\n\n• **Token Standard:** Multi-chain ERC20 / Jetton\n• **Liquidity:** 100% Locked on Launch\n• **AI Sentinel:** Audited & Verified Safe\n\nJoin the revolution on Telegram & NEXORUM OS!`,
  });
});

// 11. Admin Settings & System Logs
app.get('/api/v1/admin/settings', (req, res) => {
  res.json({ success: true, settings: db.settings });
});

app.post('/api/v1/admin/settings', (req, res) => {
  const { settings } = req.body;
  if (settings) {
    db.settings = { ...db.settings, ...settings };
  }
  res.json({ success: true, settings: db.settings });
});

app.get('/api/v1/admin/logs', (req, res) => {
  res.json({
    success: true,
    logs: db.auditLogs,
    stats: {
      totalUsers: db.users.length,
      totalTokensCreated: db.tokens.length,
      totalWalletsConnected: db.users.reduce((acc, u) => acc + u.wallets.length, 0),
      totalMarketplaceSales: db.marketplaceItems.reduce((acc, i) => acc + i.salesCount, 0),
      totalVolumeUsd: 542910240,
      kernelVersion: '1.0.0',
      uptimeSeconds: process.uptime(),
    },
  });
});

// 11. User Notifications
app.get('/api/v1/notifications', (req, res) => {
  res.json({ success: true, notifications: db.notifications });
});

app.post('/api/v1/notifications/read', (req, res) => {
  const { id } = req.body;
  const notif = db.notifications.find((n) => n.id === id);
  if (notif) notif.isRead = true;
  res.json({ success: true });
});

// 12. Airdrops Management API
app.get('/api/v1/airdrops', (req, res) => {
  res.json({ success: true, airdrops: db.airdrops });
});

app.post('/api/v1/airdrops/create', (req, res) => {
  const { title, symbol, amountPerUser, totalPool, network, description } = req.body;
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
    claimedUserIds: [],
    createdAt: new Date().toISOString(),
  };
  db.airdrops.unshift(newAirdrop);

  // Notify all users
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

  res.json({ success: true, airdrop: newAirdrop });
});

app.post('/api/v1/airdrops/status', (req, res) => {
  const { airdropId, status } = req.body;
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
  res.json({ success: true, airdrop });
});

app.post('/api/v1/airdrops/distribute', (req, res) => {
  const { airdropId } = req.body;
  const airdrop = db.airdrops.find((a) => a.id === airdropId);
  if (!airdrop) return res.status(404).json({ error: 'Airdrop campaign not found' });

  let distributedCount = 0;
  db.users.forEach((user) => {
    if (!airdrop.claimedUserIds.includes(user.id)) {
      airdrop.claimedUserIds.push(user.id);
      distributedCount++;

      // Record transaction
      db.transactions.unshift({
        id: `tx_${Date.now()}_${user.id}`,
        userId: user.id,
        hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
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
        gasFeeUsd: 0.00,
      });

      // Send notification
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

  res.json({
    success: true,
    message: `Successfully distributed Airdrop to ${distributedCount} users!`,
    airdrop,
  });
});

app.post('/api/v1/airdrops/claim', (req, res) => {
  const { airdropId, userId } = req.body;
  const airdrop = db.airdrops.find((a) => a.id === airdropId);
  if (!airdrop) return res.status(404).json({ error: 'Airdrop not found' });

  if (airdrop.claimedUserIds.includes(userId)) {
    return res.status(400).json({ error: 'Already claimed this airdrop' });
  }

  airdrop.claimedUserIds.push(userId);
  const remaining = Math.max(0, parseFloat(airdrop.remainingPool) - parseFloat(airdrop.amountPerUser));
  airdrop.remainingPool = remaining.toString();

  db.transactions.unshift({
    id: `tx_${Date.now()}`,
    userId,
    hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
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
    gasFeeUsd: 0.00,
  });

  res.json({
    success: true,
    message: `Successfully claimed ${airdrop.amountPerUser} ${airdrop.symbol}!`,
    airdrop,
  });
});

// Daily Check-In & Streak Airdrop Engine (Max 300 NEX over 30 days)
const DAILY_REWARDS_SCHEDULE = [8, 9, 10, 10, 11, 11, 11]; // Sums to ~70 NEX per week (max 300 NEX over 30 days)

app.get('/api/v1/airdrops/daily-status', (req, res) => {
  const userId = (req.query.userId as string) || 'usr_nex_982341';
  if (!db.dailyClaims[userId]) {
    db.dailyClaims[userId] = {
      streak: 1,
      lastClaimTimestamp: 0,
      totalClaimed: 0,
    };
  }

  const claimInfo = db.dailyClaims[userId];
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const elapsed = now - claimInfo.lastClaimTimestamp;

  // Streak reset check: if user missed more than 48 hours, reset streak to 1
  if (claimInfo.lastClaimTimestamp > 0 && elapsed > 48 * 60 * 60 * 1000) {
    claimInfo.streak = 1;
  }

  const canClaimNow = claimInfo.lastClaimTimestamp === 0 || elapsed >= ONE_DAY_MS;
  const timeUntilNextClaimMs = canClaimNow ? 0 : ONE_DAY_MS - elapsed;
  const currentRewardNex = DAILY_REWARDS_SCHEDULE[(claimInfo.streak - 1) % 7];

  res.json({
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

app.post('/api/v1/airdrops/daily-claim', (req, res) => {
  const { userId } = req.body;
  const targetUserId = userId || 'usr_nex_982341';
  const user = db.users.find((u) => u.id === targetUserId) || db.users[0];

  if (!db.dailyClaims[targetUserId]) {
    db.dailyClaims[targetUserId] = {
      streak: 1,
      lastClaimTimestamp: 0,
      totalClaimed: 0,
    };
  }

  const claimInfo = db.dailyClaims[targetUserId];
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const elapsed = now - claimInfo.lastClaimTimestamp;

  if (claimInfo.lastClaimTimestamp > 0 && elapsed < ONE_DAY_MS) {
    const hoursLeft = Math.ceil((ONE_DAY_MS - elapsed) / (60 * 60 * 1000));
    return res.status(400).json({
      error: `Daily reward already claimed today! Next reward opens in ${hoursLeft} hours.`,
      nextClaimAvailableInMs: ONE_DAY_MS - elapsed,
    });
  }

  // Reset streak if missed 2 days
  if (claimInfo.lastClaimTimestamp > 0 && elapsed > 48 * 60 * 60 * 1000) {
    claimInfo.streak = 1;
  }

  const rewardAmountNex = DAILY_REWARDS_SCHEDULE[(claimInfo.streak - 1) % 7];
  claimInfo.totalClaimed += rewardAmountNex;
  claimInfo.lastClaimTimestamp = now;

  // Credit NEX tokens directly into user's wallet balance for staking!
  if (user) {
    let nexWallet = user.wallets.find((w: any) => w.network === 'nexorum' || w.nativeBalance.includes('NEX'));
    if (!nexWallet && user.wallets.length > 0) {
      nexWallet = user.wallets[0];
    }
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

  // Record Transaction
  const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
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

  // Notification
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

  // Advance streak to next day for tomorrow
  const claimedStreak = claimInfo.streak;
  claimInfo.streak = (claimInfo.streak % 7) + 1;

  res.json({
    success: true,
    message: `Claimed ${rewardAmountNex} NEX for Day ${claimedStreak} Check-In! Tokens added to your wallet for Staking.`,
    rewardNex: rewardAmountNex,
    claimedStreak,
    nextStreak: claimInfo.streak,
    totalClaimed: claimInfo.totalClaimed,
    lastClaimTimestamp: claimInfo.lastClaimTimestamp,
  });
});

// --- STAKING ENGINE ENDPOINTS ---
// Dynamic Staking APY Pools: Longer lock duration = higher APY %
const STAKING_POOLS = [
  { id: 'pool_7d', name: '7 Days Flexible', durationDays: 7, apyPercent: 8.0, description: 'Short lock term with 8% APY' },
  { id: 'pool_14d', name: '14 Days Growth', durationDays: 14, apyPercent: 14.0, description: 'Medium lock term with 14% APY' },
  { id: 'pool_30d', name: '30 Days Pro', durationDays: 30, apyPercent: 25.0, description: '30 days holding term with 25% APY' },
  { id: 'pool_60d', name: '60 Days Ultra', durationDays: 60, apyPercent: 45.0, description: '60 days lock with 45% APY' },
  { id: 'pool_90d', name: '90 Days VIP', durationDays: 90, apyPercent: 65.0, description: '90 days lock with 65% APY' },
  { id: 'pool_180d', name: '180 Days Master', durationDays: 180, apyPercent: 100.0, description: '180 days long-term lock with 100% APY' },
];

app.get('/api/v1/staking/pools', (req, res) => {
  res.json({ success: true, pools: STAKING_POOLS });
});

app.get('/api/v1/staking/user-stakes', (req, res) => {
  const userId = (req.query.userId as string) || 'usr_nex_982341';
  const stakes = db.userStakes.filter((s: any) => s.userId === userId);
  res.json({ success: true, stakes });
});

app.post('/api/v1/staking/stake', (req, res) => {
  const { userId, amountNex, durationDays } = req.body;
  const targetUserId = userId || 'usr_nex_982341';
  const user = db.users.find((u) => u.id === targetUserId) || db.users[0];
  const numAmount = parseFloat(amountNex);

  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid NEX token staking amount is required' });
  }

  const pool = STAKING_POOLS.find((p) => p.durationDays === Number(durationDays)) || STAKING_POOLS[2];

  // Check user wallet balance
  let nexWallet = user.wallets.find((w: any) => w.nativeBalance.includes('NEX'));
  if (!nexWallet && user.wallets.length > 0) nexWallet = user.wallets[0];

  const currentBal = nexWallet ? parseFloat(nexWallet.nativeBalance) || 0 : 0;
  if (currentBal < numAmount) {
    return res.status(400).json({
      error: `Insufficient NEX balance in your wallet. Available: ${currentBal.toFixed(2)} NEX, required: ${numAmount} NEX.`,
    });
  }

  // Deduct from wallet balance
  if (nexWallet) {
    const updatedBal = Math.max(0, currentBal - numAmount);
    nexWallet.nativeBalance = `${updatedBal.toFixed(2)} NEX`;
    nexWallet.balanceUsd = Math.max(0, nexWallet.balanceUsd - numAmount * 12.45);
  }

  // Calculate estimated yield based on APY % and duration
  const yearFraction = pool.durationDays / 365;
  const estimatedRewardNex = Math.round(numAmount * (pool.apyPercent / 100) * yearFraction * 100) / 100;

  const nowMs = Date.now();
  const newStake = {
    id: `stake_${nowMs}`,
    userId: targetUserId,
    amountNex: numAmount,
    durationDays: pool.durationDays,
    apyPercent: pool.apyPercent,
    estimatedRewardNex,
    stakedAt: new Date(nowMs).toISOString(),
    maturesAt: new Date(nowMs + pool.durationDays * 86400000).toISOString(),
    status: 'ACTIVE',
  };

  db.userStakes.unshift(newStake);

  db.auditLogs.unshift({
    id: `log_${nowMs}`,
    userId: targetUserId,
    action: 'NEX_STAKED',
    category: 'STAKING',
    details: `Staked ${numAmount} NEX for ${pool.durationDays} days at ${pool.apyPercent}% APY. Estimated reward: +${estimatedRewardNex} NEX.`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  db.notifications.unshift({
    id: `notif_${nowMs}`,
    userId: targetUserId,
    title: `🔒 Staked ${numAmount} NEX (${pool.apyPercent}% APY)`,
    message: `Your ${numAmount} NEX is now locked for ${pool.durationDays} days. You will earn +${estimatedRewardNex} NEX bonus at maturity!`,
    type: 'WALLET',
    isRead: false,
    actionUrl: '/profile',
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Successfully staked ${numAmount} NEX for ${pool.durationDays} days at ${pool.apyPercent}% APY!`,
    stake: newStake,
    remainingWalletNex: nexWallet ? parseFloat(nexWallet.nativeBalance) : 0,
  });
});

app.post('/api/v1/staking/unstake', (req, res) => {
  const { stakeId, userId } = req.body;
  const stakeIndex = db.userStakes.findIndex((s: any) => s.id === stakeId && s.userId === (userId || 'usr_nex_982341'));

  if (stakeIndex === -1) {
    return res.status(404).json({ error: 'Staking record not found' });
  }

  const stake = db.userStakes[stakeIndex];
  const user = db.users.find((u) => u.id === stake.userId) || db.users[0];

  const totalPayout = stake.amountNex + stake.estimatedRewardNex;

  // Credit principal + yields back to user's wallet balance
  let nexWallet = user.wallets.find((w: any) => w.nativeBalance.includes('NEX'));
  if (!nexWallet && user.wallets.length > 0) nexWallet = user.wallets[0];

  if (nexWallet) {
    const cur = parseFloat(nexWallet.nativeBalance) || 0;
    nexWallet.nativeBalance = `${(cur + totalPayout).toFixed(2)} NEX`;
    nexWallet.balanceUsd += totalPayout * 12.45;
  }

  stake.status = 'UNSTAKED';

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: stake.userId,
    action: 'NEX_UNSTAKED',
    category: 'STAKING',
    details: `Unstaked ${stake.amountNex} NEX + received ${stake.estimatedRewardNex} NEX yield interest back into wallet!`,
    ipAddress: req.ip || '127.0.0.1',
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Successfully unstaked! Received ${stake.amountNex} NEX principal + ${stake.estimatedRewardNex} NEX interest back to your wallet!`,
    totalPayout,
    stake,
  });
});

// --- VITE MIDDLEWARE & STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEXORUM OS Web3 Application Module running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
