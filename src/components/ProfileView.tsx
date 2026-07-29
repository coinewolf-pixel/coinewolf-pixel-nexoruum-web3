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
  Key,
  Eye,
  EyeOff,
  Lock,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { formatAddress, formatCurrency } from '../lib/utils';
import { api } from '../services/api';
import { ChangeProfilePictureModal } from './ChangeProfilePictureModal';
import { PortfolioSummary } from './PortfolioSummary';

export const ProfileView: React.FC = () => {
  const { user, updateProfile, removeWalletFromProfile, clearDemoWallets } = useAuth();
  const { openWalletModal } = useWallet();

  const [isEditing, setIsEditing] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80');
  const [bio, setBio] = useState(user?.bio || '');
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Avatar Presets
  const AVATAR_PRESETS = [
    { name: 'Cyber Orb', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80' },
    { name: 'Crypto Gold', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=250&q=80' },
    { name: 'AI Mesh', url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=250&q=80' },
    { name: 'Quantum Core', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=250&q=80' },
    { name: 'Hologram', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80' },
  ];

  // Non-Custodial Vault Export State
  const [showVaultDetails, setShowVaultDetails] = useState(false);
  const [isExportingKeys, setIsExportingKeys] = useState(false);
  const [exportedVaultKeys, setExportedVaultKeys] = useState<{ privateKey: string; mnemonic: string } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedVaultKey, setCopiedVaultKey] = useState(false);

  const handleExportVaultKeys = async () => {
    setIsExportingKeys(true);
    try {
      const res = await api.exportNexoVault(user?.id || 'usr_nex_982341');
      if (res?.success && res.privateKey) {
        setExportedVaultKeys({
          privateKey: res.privateKey,
          mnemonic: res.mnemonic,
        });
        setShowVaultDetails(true);
      }
    } catch (e) {
      console.error('Failed to export NEXO vault keys:', e);
    } finally {
      setIsExportingKeys(false);
    }
  };

  const handleCopyVaultKey = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVaultKey(true);
    setTimeout(() => setCopiedVaultKey(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile({ email, phone, username, avatarUrl, bio });
    setIsEditing(false);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(`https://nexorum.os/ref/${user?.referralCode || 'NEX-99'}`);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Change Profile Picture Modal */}
      <ChangeProfilePictureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentAvatarUrl={user?.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80'}
        onSaveAvatar={(newUrl) => {
          setAvatarUrl(newUrl);
          updateProfile({ avatarUrl: newUrl });
        }}
      />

      {/* Profile Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          {/* Avatar with Camera Badge Button */}
          <div className="relative group cursor-pointer" onClick={() => setIsPhotoModalOpen(true)}>
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyan-500/50 p-[2px] bg-slate-950 shrink-0 relative transition-transform group-hover:scale-105">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80'}
                alt="User Avatar"
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                <Camera className="w-6 h-6 text-cyan-300" />
              </div>
            </div>
            <button
              type="button"
              id="btn_open_change_photo_badge"
              onClick={(e) => {
                e.stopPropagation();
                setIsPhotoModalOpen(true);
              }}
              title="Change Profile Picture"
              className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-cyan-500 text-slate-950 border-2 border-slate-900 shadow-lg hover:bg-cyan-400 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{user?.username || 'Alex Cyber'}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                {user?.role || 'CREATOR'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">User ID: {user?.id || 'usr_nex_982341'}</p>
            {user?.nexoId && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono mt-1">
                <Shield className="w-3.5 h-3.5" />
                <span>NEXO ID: {user.nexoId}</span>
              </div>
            )}
            {user?.telegramUsername && (
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono mt-1">
                <Send className="w-3.5 h-3.5" />
                <span>@{user.telegramUsername}</span>
              </div>
            )}
            {user?.bio && (
              <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed italic border-l-2 border-cyan-500/60 pl-2.5 bg-slate-950/50 py-1 rounded-r-xl">
                "{user.bio}"
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn_open_change_photo_modal"
            onClick={() => setIsPhotoModalOpen(true)}
            className="py-2 px-3.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-2 shrink-0"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Change Photo</span>
          </button>

          <button
            id="btn_edit_profile_toggle"
            onClick={() => {
              if (!isEditing) {
                setAvatarUrl(user?.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80');
                setUsername(user?.username || '');
                setEmail(user?.email || '');
                setPhone(user?.phone || '');
                setBio(user?.bio || '');
              }
              setIsEditing(!isEditing);
            }}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile Details'}</span>
          </button>
        </div>
      </div>

      {/* Editable Fields Box */}
      {isEditing && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Update Profile Details, Personal Bio & Avatar Photo</span>
          </h3>

          {/* Avatar Photo Picker */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-300 block">Avatar Photo Settings</label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-cyan-500/50 shrink-0 bg-slate-900">
                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500"
                  />
                  <label className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer shrink-0">
                    Upload Photo
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="py-1.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Camera / Studio</span>
                  </button>
                </div>

                {/* Preset Avatars */}
                <div className="flex items-center gap-2 overflow-x-auto pt-1">
                  <span className="text-[10px] text-slate-500 font-medium shrink-0">Presets:</span>
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all shrink-0 ${
                        avatarUrl === preset.url
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Username / Display Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 ..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Personal Bio Textarea */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <span>Personal Bio / Status</span>
              </label>
              <span className={`text-[10px] font-mono ${bio.length > 250 ? 'text-amber-400' : 'text-slate-500'}`}>
                {bio.length} / 280 chars
              </span>
            </div>
            <textarea
              id="input_user_bio"
              rows={3}
              maxLength={280}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a brief personal bio, Web3 summary, or status update..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-sans text-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none leading-relaxed"
            />
          </div>
          <button
            id="btn_save_profile_attributes"
            onClick={handleSaveProfile}
            className="py-2 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            Save Profile Changes
          </button>
        </div>
      )}

      {/* Aggregated Portfolio Summary Module (Live CoinGecko Prices) */}
      <PortfolioSummary />

      {/* Non-Custodial NEXO Protocol Vault */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">NEXO Native Non-Custodial Vault</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  AES-256 Encrypted
                </span>
              </div>
              <p className="text-xs text-slate-400">Auto-generated blockchain account & identity for NEXO Protocol</p>
            </div>
          </div>

          <button
            id="btn_export_nexo_vault_keys"
            onClick={showVaultDetails ? () => setShowVaultDetails(false) : handleExportVaultKeys}
            disabled={isExportingKeys}
            className="py-2 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span>{isExportingKeys ? 'Decrypting Vault...' : showVaultDetails ? 'Hide Security Keys' : 'Export Private Keys'}</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-sans">NEXO ID (Universal Identity)</span>
            <p className="text-amber-400 font-bold mt-0.5">{user?.nexoId || 'NEXO-A1B2C3D4'}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-sans">Vault Blockchain Address</span>
            <p className="text-cyan-300 font-bold mt-0.5 break-all">{user?.nexoVaultAddress || user?.primaryWallet || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}</p>
          </div>
        </div>

        {showVaultDetails && exportedVaultKeys && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
              <Lock className="w-4 h-4" />
              <span>NON-CUSTODIAL PRIVATE KEY & SEED PHRASE (Keep secret! Do not share with anyone)</span>
            </div>

            {exportedVaultKeys.mnemonic && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-sans font-medium">12-Word Recovery Seed Phrase</label>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-amber-200 font-mono text-xs break-words">
                  {exportedVaultKeys.mnemonic}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-slate-400 font-sans font-medium">Private Key (ECDSA Secp256k1)</label>
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 font-sans"
                >
                  {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPrivateKey ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type={showPrivateKey ? 'text' : 'password'}
                  readOnly
                  value={exportedVaultKeys.privateKey}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300"
                />
                <button
                  onClick={() => handleCopyVaultKey(exportedVaultKeys.privateKey)}
                  className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                >
                  {copiedVaultKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connected Wallets Manager */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Connected Web3 & TON Wallets</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearDemoWallets}
              className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
            >
              Clear Demo Wallets
            </button>
            <button
              id="btn_profile_add_wallet"
              onClick={openWalletModal}
              className="py-1.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          </div>
        </div>

        {user?.wallets && user.wallets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {user.wallets.map((w) => (
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
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="font-bold text-cyan-400">{formatCurrency(w.balanceUsd)}</p>
                  <p className="text-[10px] text-slate-400">{w.nativeBalance}</p>
                  <button
                    onClick={() => removeWalletFromProfile(w.id)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline font-sans mt-0.5"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">No Web3 wallets currently connected.</p>
            <button
              onClick={openWalletModal}
              className="py-2 px-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
            >
              Connect Real Web3 Wallet Now
            </button>
          </div>
        )}
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
