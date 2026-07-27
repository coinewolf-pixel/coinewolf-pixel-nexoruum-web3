import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  Zap,
  Bot,
  Layers,
  FileCode,
  Box,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { MarketplaceItem, MarketplaceCategory } from '../types';
import { formatAddress } from '../lib/utils';

export const MarketplaceView: React.FC = () => {
  const { activeWallet } = useWallet();
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory | 'All'>('All');
  const [buyingItem, setBuyingItem] = useState<MarketplaceItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    api.getMarketplace().then((res) => {
      if (res.success && res.items) setItems(res.items);
    });
  }, []);

  const filteredItems = items.filter(
    (item) => selectedCategory === 'All' || item.category === selectedCategory
  );

  const handleConfirmPurchase = async () => {
    if (!buyingItem) return;
    setIsProcessing(true);

    try {
      const res = await api.buyMarketplaceItem(
        buyingItem.id,
        user?.id || 'usr_nex_982341',
        activeWallet?.address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
      );

      if (res.success) {
        addToast('Purchase Confirmed!', `Acquired ${buyingItem.title} on NEXORUM Blockchain Engine.`, 'success');
        setBuyingItem(null);
      }
    } catch (err) {
      console.error('Purchase error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ShoppingBag className="w-4 h-4" />
          <span>NEXORUM Marketplace Engine</span>
        </div>
        <h1 className="text-3xl font-black text-white">Marketplace & Ecosystem</h1>
        <p className="text-slate-400 text-xs mt-1">
          Buy and sell Tokens, Genesis NFTs, Autonomous AI Agents, Plugins, Digital Products, and DApp Templates.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(['All', 'Tokens', 'NFT', 'AI Agents', 'Plugins', 'Digital Products', 'Templates'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 shadow-2xl flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-800">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-slate-700 uppercase">
                  {item.category}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-extrabold text-white text-base group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>
                  {item.verified && <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-800/80 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Seller:</span>
                <span className="font-mono text-slate-300 font-semibold">{item.sellerName}</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium">Price</span>
                  <p className="text-lg font-black font-mono text-cyan-400">
                    {item.price} {item.priceSymbol}
                  </p>
                </div>

                <button
                  id={`btn_buy_item_${item.id}`}
                  onClick={() => setBuyingItem(item)}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Buy Item
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Buy Confirmation Modal */}
      {buyingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-extrabold text-white">Confirm Purchase</h3>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Item:</span>
                <span className="font-bold text-white">{buyingItem.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-mono font-bold text-cyan-400">
                  {buyingItem.price} {buyingItem.priceSymbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Buyer Address:</span>
                <span className="font-mono text-slate-300">
                  {formatAddress(activeWallet?.address || '0x71C7...8976F')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setBuyingItem(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                id="btn_confirm_buy_modal"
                onClick={handleConfirmPurchase}
                disabled={isProcessing}
                className="w-1/2 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
              >
                {isProcessing ? 'Verifying...' : 'Confirm Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
