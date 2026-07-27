import React, { useState } from 'react';
import { X, Send, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TelegramAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramAuthModal: React.FC<TelegramAuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithTelegram } = useAuth();
  const [telegramHandle, setTelegramHandle] = useState('cyber_trader');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramHandle) return;

    setIsSubmitting(true);
    const mockTgId = String(Math.floor(100000000 + Math.random() * 900000000));
    const handle = telegramHandle.replace('@', '');

    await loginWithTelegram({
      telegramId: mockTgId,
      telegramUsername: handle,
      firstName: handle.charAt(0).toUpperCase() + handle.slice(1),
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-6">
        <button
          id="btn_close_telegram_modal"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center mx-auto shadow-lg shadow-sky-950">
            <Send className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Telegram 1-Click Login</h2>
          <p className="text-slate-400 text-xs">
            Log in with Telegram. NEXORUM User Engine automatically generates your unique User ID & profile.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Telegram Username or ID</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">@</span>
              <input
                id="input_telegram_username"
                type="text"
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                placeholder="username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>NEXORUM Identity Protocol</span>
            </div>
            <p>• Auto-assigns unique User ID on first login</p>
            <p>• No registration form required</p>
            <p>• Optional Email, Phone, and Wallets can be added anytime in Profile</p>
          </div>

          <button
            id="btn_confirm_telegram_login"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-950/50 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Authenticate Telegram Account</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
