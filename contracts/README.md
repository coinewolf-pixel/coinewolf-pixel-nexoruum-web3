# NEXORUM Smart Contracts

Real, on-chain Solidity contracts replacing the app's previous fake
in-memory token/staking data:

- **`NexorumToken.sol`** — a standard fixed-supply ERC20 token (NEX,
  1,000,000,000 total supply, 18 decimals). Uses OpenZeppelin's
  battle-tested ERC20 implementation.
- **`NexorumStaking.sol`** — a real staking contract with the same 4
  pools shown in the app's UI (Flexible 8.5% APY, 30-Day 18.2%, 90-Day
  36.5%, 365-Day 85%). Users `approve()` then `stake()` real NEX tokens;
  rewards accrue linearly over time and are paid from a reward pool the
  contract owner funds separately.

Both contracts compile cleanly (verified with `solc` directly — 3,517
bytes and 6,383 bytes of bytecode respectively, well under the 24KB
contract size limit) and use `ReentrancyGuard` + `SafeERC20` for standard
security practices.

## ⚠️ Security — read this first

**Never share your private key with anyone, including Claude, in chat.**
This whole setup is designed so you deploy from your own machine using
your own wallet — nobody else ever sees your key.

Use a **dedicated deployer wallet**, not your main wallet:
1. Create a fresh wallet in MetaMask (Add Account → new wallet) just for
   this.
2. Fund it with **testnet ETH only** (free, from a faucet — see below).
   Never send real ETH to a deployer wallet.

## Step 1 — Get free Sepolia testnet ETH

You need a small amount of Sepolia ETH to pay gas for deployment (a few
cents worth, but on testnet it's free).

1. Open MetaMask → switch network to **Sepolia** (enable "Show test
   networks" in Settings if you don't see it)
2. Copy your new deployer wallet's address
3. Get free testnet ETH from any of these faucets:
   - https://sepoliafaucet.com
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://www.infura.io/faucet/sepolia

## Step 2 — Install dependencies

```bash
cd contracts
npm install
```

## Step 3 — Configure your deployer wallet

```bash
cp .env.example .env
```

Edit `.env` and paste your **dedicated deployer wallet's** private key
(MetaMask → Account details → Show private key) into `PRIVATE_KEY`.

`.env` is already git-ignored — it will never be committed or pushed
anywhere.

## Step 4 — Compile

```bash
npm run compile
```

## Step 5 — Deploy to Sepolia testnet

```bash
npm run deploy:sepolia
```

This deploys both contracts, then automatically funds the staking
contract's reward pool with 50,000,000 NEX so real rewards can actually
be paid out. At the end it prints both contract addresses — **save
them**, you'll need to give them to Claude next to wire up the backend
(`cloudflare/worker.ts`) and frontend to read/write real on-chain state
instead of the current demo data.

## What happens after deployment

Once you have both addresses, tell Claude:
> "Deployed NEX token at 0x... and staking contract at 0x... on Sepolia"

From there, the backend can be updated to read real token balances /
staking positions directly from the chain via `ethers.Contract` calls
(read-only, no private key needed for reads), and the frontend's
stake/unstake buttons can be wired to call the contract directly through
the user's own connected wallet (MetaMask/WalletConnect) — so the user
signs their own real transactions, and neither the backend nor Claude
ever touches anyone's private key.

## Going to real mainnet later

Everything above uses Sepolia (free testnet — no real money). When you're
ready for a real production deployment with actual value:
1. Same steps, but fund your deployer wallet with **real ETH** instead
2. Change `--network sepolia` to a mainnet config you add to
   `hardhat.config.js` (or an L2 like Base/Arbitrum for much lower gas
   fees — recommended over Ethereum mainnet directly)
3. Consider getting the contracts professionally audited first — this is
   standard practice before handling real user funds, and something a
   specialized smart-contract security firm should do, not something to
   skip for anything holding real money.
