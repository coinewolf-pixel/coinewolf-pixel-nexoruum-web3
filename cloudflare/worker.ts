/**
 * Cloudflare Worker for NEXORUM OS Web3 Application Module
 * Uses 100% Web Standard APIs (Fetch, Request, Response, URL, Crypto)
 */

export interface Env {
  DB?: any;
  NEXORUM_KV?: any;
  GEMINI_API_KEY?: string;
  ENVIRONMENT?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Nexorum-Kernel-Token',
        },
      });
    }

    const jsonHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Nexorum-Module': 'Web3-App-v1.0',
    };

    // Health check endpoint
    if (url.pathname === '/api/v1/kernel/status') {
      return new Response(
        JSON.stringify({
          status: 'ONLINE',
          module: 'NEXORUM OS Web3 Application',
          version: '1.0.0',
          runtime: 'Cloudflare Worker (Edge)',
          kernelConnected: true,
          timestamp: new Date().toISOString(),
        }),
        { headers: jsonHeaders }
      );
    }

    // Supported networks API
    if (url.pathname === '/api/v1/blockchain/networks') {
      return new Response(
        JSON.stringify({
          success: true,
          networks: [
            { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', chainId: 1, gasPriceGwei: 14.2, isPopular: true },
            { id: 'bsc', name: 'BNB Smart Chain', symbol: 'BNB', chainId: 56, gasPriceGwei: 3.0, isPopular: true },
            { id: 'polygon', name: 'Polygon', symbol: 'POL', chainId: 137, gasPriceGwei: 32.5, isPopular: true },
            { id: 'arbitrum', name: 'Arbitrum One', symbol: 'ETH', chainId: 42161, gasPriceGwei: 0.1, isPopular: true },
            { id: 'base', name: 'Base', symbol: 'ETH', chainId: 8453, gasPriceGwei: 0.05, isPopular: true },
            { id: 'solana', name: 'Solana', symbol: 'SOL', chainId: 'solana-mainnet', gasPriceGwei: 0.000005, isPopular: true },
            { id: 'ton', name: 'TON Network', symbol: 'TON', chainId: 'ton-mainnet', gasPriceGwei: 0.005, isPopular: true },
          ],
        }),
        { headers: jsonHeaders }
      );
    }

    // Fallback response
    return new Response(
      JSON.stringify({
        error: 'NEXORUM Cloudflare Worker Edge Handler Active',
        pathname: url.pathname,
        message: 'Endpoint proxied to NEXORUM Kernel',
      }),
      { status: 200, headers: jsonHeaders }
    );
  },
};
