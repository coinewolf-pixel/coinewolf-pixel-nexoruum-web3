import React, { useState } from 'react';
import {
  User,
  Send,
  Mail,
  Phone,
  Wallet,
  Award,
  Share2,
  Copy,
  Plus,
  Shield,
  Check,
  Edit2,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { formatAddress, formatCurrency } from '../lib/utils';

export const ProfileView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { openWalletModal } = useWallet();

  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [username, setUsername] = useState(user?.username || '');
  const [copiedReferral, setCopiedReferral] = useState(false);

  const handleSaveProfile = async () => {
    await updateProfile({ email, phone, username });
    setIsEditing(false);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(`https://nexorum.os/ref/${user?.referralCode || 'NEX-99'}`);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyan-500/50 p-[2px] bg-slate-950 shrink-0">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
              alt="User Avatar"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{user?.username || 'Alex Cyber'}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                {user?.role || 'CREATOR'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">User ID: {user?.id || 'usr_nex_982341'}</p>
            {user?.telegramUsername && (
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono mt-1">
                <Send className="w-3.5 h-3.5" />
                <span>@{user.telegramUsername}</span>
              </div>
            )}
          </div>
        </div>

        <button
          id="btn_edit_profile_toggle"
          onClick={() => setIsEditing(!isEditing)}
          className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shrink-0"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Profile Details'}</span>
        </button>
      </div>

      {/* Editable Fields Box */}
      {isEditing && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white">Update Profile Attributes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
          <button
            id="btn_save_profile_attributes"
            onClick={handleSaveProfile}
            className="py-2 px-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Connected Wallets Manager */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Connected Web3 & TON Wallets</h3>
          </div>
          <button
            id="btn_profile_add_wallet"
            onClick={openWalletModal}
            className="py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Wallet</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {user?.wallets.map((w) => (
            <div
              key={w.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{w.providerName}</span>
                  {w.isPrimary && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-slate-400 mt-1">{formatAddress(w.address)}</p>
                <span className="text-[10px] text-slate-500 uppercase">{w.network} network</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-cyan-400">{formatCurrency(w.balanceUsd)}</p>
                <p className="text-[10px] text-slate-400">{w.nativeBalance}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral & Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Referral Analytics */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Referral & Earn Protocol</h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400">Your Unique NEXORUM Referral Code</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`https://nexorum.os/ref/${user?.referralCode || 'NEX-99'}`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono"
              />
              <button
                id="btn_copy_referral_link"
                onClick={handleCopyRef}
                className="p-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
              >
                {copiedReferral ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 font-medium">Total Referred</span>
              <p className="text-base font-bold text-white mt-0.5">{user?.referralsCount || 24} Users</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 font-medium">Total Earnings</span>
              <p className="text-base font-bold text-emerald-400 mt-0.5">
                {formatCurrency(user?.referralEarningsUsd || 1240.5)}
              </p>
            </div>
          </div>
        </div>

        {/* Gamified Achievements */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Achievements & Badges</h3>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { title: 'Genesis Creator', desc: 'Deployed first token on NEXORUM Blockchain Engine', unlocked: true },
              { title: 'Multi-Chain Pioneer', desc: 'Connected wallets on 3 or more chains', unlocked: true },
              { title: 'AI Assistant Analyst', desc: 'Ran 10+ portfolio analysis prompts with Gemini AI', unlocked: true },
            ].map((ach, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3"
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{ach.title}</h4>
                  <p className="text-[11px] text-slate-400">{ach.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
