/**
 * Reown AppKit configuration — real WalletConnect v2 wallet connector.
 *
 * This replaces the previous fake/simulated `wc:...` URI generator in
 * WalletModal.tsx with an actual WalletConnect v2 session via Reown AppKit.
 *
 * IMPORTANT: `createAppKit` must run exactly once at module load, not inside
 * a React component (see AppKit skill best-practices). This file is imported
 * once from src/index.tsx before the app renders.
 */
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, bsc, polygon, arbitrum, base } from '@reown/appkit/networks';

// Public projectId is ONLY valid for localhost testing. For any real deployment,
// create your own project at https://dashboard.reown.com and set
// VITE_REOWN_PROJECT_ID in your .env (see .env.example).
const PUBLIC_LOCALHOST_ONLY_PROJECT_ID = 'b56e18d47c72ab683b10814fe9495694';

export const REOWN_PROJECT_ID: string =
  (import.meta as any).env?.VITE_REOWN_PROJECT_ID || PUBLIC_LOCALHOST_ONLY_PROJECT_ID;

if (!(import.meta as any).env?.VITE_REOWN_PROJECT_ID) {
  // eslint-disable-next-line no-console
  console.warn(
    '[AppKit] VITE_REOWN_PROJECT_ID is not set — using the public localhost-only projectId. ' +
      'Get your own at https://dashboard.reown.com before deploying to production.'
  );
}

const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://nexorum.network';

export const appKitModal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [mainnet, bsc, polygon, arbitrum, base],
  projectId: REOWN_PROJECT_ID,
  metadata: {
    name: 'NEXORUM',
    description: 'NEXORUM Web3 Platform — staking, token creation, and multi-chain wallet',
    url: appOrigin,
    icons: [`${appOrigin}/icon.png`],
  },
  features: {
    analytics: false,
  },
});
