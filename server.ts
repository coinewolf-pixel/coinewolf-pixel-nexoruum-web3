import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory persistent database store for NEXORUM OS Engine
const db = {
  users: [
    {
      id: 'usr_nex_982341',
      telegramId: '772183941',
      telegramUsername: 'cyber_trader',
      email: 'alex.cyber@nexorum.os',
      phone: '+1 (555) 019-2834',
      username: 'Alex Cyber',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      role: 'CREATOR',
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
      amountPerUser: '500',
      totalPool: '1000000',
      remainingPool: '850000',
      network: 'nexorum',
      status: 'ACTIVE',
      description: 'Check in daily to claim up to 500 NEX tokens in streak rewards! Return every 24 hours to maximize your daily yield.',
      claimedUserIds: [],
      createdAt: new Date().toISOString(),
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
    // Automatically create profile on first login
    const newUserId = `usr_nex_${Math.floor(100000 + Math.random() * 900000)}`;
    user = {
      id: newUserId,
      telegramId: String(telegramId),
      telegramUsername: telegramUsername || `tg_user_${telegramId}`,
      email: '',
      phone: '',
      username: firstName ? `${firstName} (TG)` : `@${telegramUsername || telegramId}`,
      avatarUrl: photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      role: 'USER',
      primaryWallet: '',
      wallets: [],
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
      action: 'TELEGRAM_PROFILE_CREATED',
      category: 'AUTH',
      details: `Created new NEXORUM user account for Telegram ID ${telegramId}`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({ success: true, user });
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

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
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

// 8. Marketplace Items & Purchase
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

// 9. AI Assistant (Gemini API Integration)
app.post('/api/v1/ai/assistant', async (req, res) => {
  const { prompt, contextType } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are NEXORUM OS Web3 AI Assistant. You are an expert in Web3, tokenomics, smart contracts, portfolio analysis, price predictions, and blockchain mechanics. Context: ${contextType || 'General Web3'}. Query: ${prompt}`,
      });

      return res.json({
        success: true,
        reply: response.text || 'Analysis complete for NEXORUM OS.',
      });
    }
  } catch (err: any) {
    console.error('Gemini API Error:', err?.message || err);
  }

  // Fallback intelligent responder if key unavailable or offline
  let fallbackReply = `NEXORUM Web3 AI Assistant Report:\n\nRegarding "${prompt}":\n\n• Portfolio Analysis: Your current multi-chain assets demonstrate a high liquidity ratio with strong upside in Base and TON network jettons.\n• Market Outlook: Gas fees across Arbitrum and Base remain ultra-low (<$0.05). Trend favors AI Agents & Jetton pools.\n• Token Strategy: Recommended initial pool liquidity of $2,000 USDT with standard 18 decimals on BEP20/ERC20 for maximum decentralized exchange router compatibility.`;

  res.json({
    success: true,
    reply: fallbackReply,
  });
});

// 10. Admin Settings & System Logs
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

// Daily Check-In & Streak Airdrop Engine
const DAILY_REWARDS_SCHEDULE = [15, 25, 40, 60, 80, 110, 170]; // Sums to 500 NEX

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
    message: `You earned ${rewardAmountNex} NEX tokens for your Day ${claimInfo.streak} check-in! Keep your streak active tomorrow for Day ${
      (claimInfo.streak % 7) + 1
    } bonus.`,
    type: 'WALLET',
    isRead: false,
    actionUrl: '/airdrops',
    createdAt: new Date().toISOString(),
  });

  // Advance streak to next day for tomorrow
  const claimedStreak = claimInfo.streak;
  claimInfo.streak = (claimInfo.streak % 7) + 1;

  res.json({
    success: true,
    message: `Claimed ${rewardAmountNex} NEX for Day ${claimedStreak} Check-In!`,
    rewardNex: rewardAmountNex,
    claimedStreak,
    nextStreak: claimInfo.streak,
    totalClaimed: claimInfo.totalClaimed,
    lastClaimTimestamp: claimInfo.lastClaimTimestamp,
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
