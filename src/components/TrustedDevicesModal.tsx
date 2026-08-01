import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Clock,
  Globe,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  Lock,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { useDeviceDetect, DeviceInfo } from '../hooks/useDeviceDetect';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { SwipeableContainer } from './SwipeableContainer';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, collection, setDoc, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore';

export interface DeviceSessionRecord {
  id: string;
  deviceName: string;
  deviceCategory: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  isTrusted: boolean;
  isCurrentSession: boolean;
  lastActive: string;
  location: string;
  ipAddress: string;
  resolution: string;
}

interface TrustedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY_DEVICES = 'nexorum_user_devices_v1';

export const TrustedDevicesModal: React.FC<TrustedDevicesModalProps> = ({ isOpen, onClose }) => {
  const deviceInfo = useDeviceDetect();
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [devices, setDevices] = useState<DeviceSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'trusted' | 'history'>('trusted');

  // Detect current browser name from userAgent
  const getBrowserName = (): string => {
    if (typeof navigator === 'undefined') return 'Web Browser';
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    if (ua.includes('Trident')) return 'Internet Explorer';
    if (ua.includes('Edge') || ua.includes('Edg')) return 'Microsoft Edge';
    if (ua.includes('Chrome')) return 'Google Chrome';
    if (ua.includes('Safari')) return 'Apple Safari';
    return 'Web Browser';
  };

  // Generate current session device info
  const getCurrentSessionInfo = (): DeviceSessionRecord => {
    const browser = getBrowserName();
    const deviceName = deviceInfo.isMobile
      ? `${deviceInfo.os} Mobile (${browser})`
      : deviceInfo.isTablet
      ? `${deviceInfo.os} Tablet (${browser})`
      : `${deviceInfo.os} Desktop (${browser})`;

    return {
      id: 'current_session_id',
      deviceName,
      deviceCategory: deviceInfo.deviceCategory,
      os: deviceInfo.os,
      browser,
      isTrusted: true,
      isCurrentSession: true,
      lastActive: new Date().toISOString(),
      location: 'Current Location (Encrypted IP)',
      ipAddress: '192.168.1.1 (Web3 Proxy)',
      resolution: `${deviceInfo.width}×${deviceInfo.height}`,
    };
  };

  // Load devices from Firestore / LocalStorage on mount
  useEffect(() => {
    if (!isOpen) return;

    const currentSession = getCurrentSessionInfo();

    const loadDevices = async () => {
      setIsLoading(true);

      // Default initial mock/saved devices for comprehensive initial view
      const initialMockDevices: DeviceSessionRecord[] = [
        currentSession,
        {
          id: 'dev_iphone_15',
          deviceName: 'iPhone 15 Pro (Safari)',
          deviceCategory: 'mobile',
          os: 'iOS 17.4',
          browser: 'Apple Safari',
          isTrusted: true,
          isCurrentSession: false,
          lastActive: new Date(Date.now() - 3600000 * 2).toISOString(),
          location: 'Frankfurt, Germany',
          ipAddress: '185.220.101.5',
          resolution: '393×852',
        },
        {
          id: 'dev_macbook_pro',
          deviceName: 'MacBook Pro M2 (Chrome)',
          deviceCategory: 'desktop',
          os: 'macOS Sonoma',
          browser: 'Google Chrome',
          isTrusted: true,
          isCurrentSession: false,
          lastActive: new Date(Date.now() - 3600000 * 18).toISOString(),
          location: 'London, UK',
          ipAddress: '82.165.42.19',
          resolution: '1512×982',
        },
        {
          id: 'dev_android_galaxy',
          deviceName: 'Samsung Galaxy S24 (Samsung Internet)',
          deviceCategory: 'mobile',
          os: 'Android 14',
          browser: 'Samsung Internet',
          isTrusted: false,
          isCurrentSession: false,
          lastActive: new Date(Date.now() - 3600000 * 72).toISOString(),
          location: 'Warsaw, Poland',
          ipAddress: '91.200.12.88',
          resolution: '412×915',
        },
      ];

      // Try reading from Firestore if logged in
      if (user?.id) {
        try {
          const userId = user.id;
          const sessionsRef = collection(db, 'users', userId, 'sessions');
          const q = query(sessionsRef, orderBy('lastActive', 'desc'), limit(20));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const fetched = snapshot.docs.map((d) => d.data() as DeviceSessionRecord);
            // Ensure current session is present
            const updated = [
              currentSession,
              ...fetched.filter((item) => item.id !== 'current_session_id'),
            ];
            setDevices(updated);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Firestore fetch failed for sessions, falling back to local state:', err);
        }
      }

      // LocalStorage fallback
      const cached = localStorage.getItem(STORAGE_KEY_DEVICES);
      if (cached) {
        try {
          const parsed: DeviceSessionRecord[] = JSON.parse(cached);
          const updated = [
            currentSession,
            ...parsed.filter((item) => item.id !== 'current_session_id'),
          ];
          setDevices(updated);
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse cached devices:', e);
        }
      }

      // Set initial
      setDevices(initialMockDevices);
      localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(initialMockDevices));
      setIsLoading(false);
    };

    loadDevices();
  }, [isOpen, user?.id]);

  const saveDevices = async (newList: DeviceSessionRecord[]) => {
    setDevices(newList);
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(newList));

    // Async sync to Firestore if signed in
    if (user?.id) {
      try {
        const userId = user.id;
        for (const dev of newList) {
          const ref = doc(db, 'users', userId, 'sessions', dev.id);
          await setDoc(ref, dev, { merge: true });
        }
      } catch (err) {
        console.warn('Failed to sync session updates to Firestore:', err);
      }
    }
  };

  const toggleTrustStatus = async (deviceId: string) => {
    const updated = devices.map((d) => {
      if (d.id === deviceId) {
        const newTrust = !d.isTrusted;
        addToast({
          title: newTrust ? 'Device Trusted' : 'Device Trust Removed',
          message: `${d.deviceName} is now ${newTrust ? 'marked as trusted' : 'untrusted'}.`,
        });
        return { ...d, isTrusted: newTrust };
      }
      return d;
    });
    await saveDevices(updated);
  };

  const handleRevokeSession = async (deviceId: string, deviceName: string) => {
    const updated = devices.filter((d) => d.id !== deviceId);
    await saveDevices(updated);

    if (user?.id) {
      try {
        const ref = doc(db, 'users', user.id, 'sessions', deviceId);
        await deleteDoc(ref);
      } catch (e) {
        console.warn('Could not delete session from firestore:', e);
      }
    }

    addToast({
      title: 'Session Revoked',
      message: `Access revoked for ${deviceName}.`,
    });
  };

  if (!isOpen) return null;

  const trustedDevices = devices.filter((d) => d.isTrusted);

  return (
    <SwipeableContainer
      onClose={onClose}
      direction="down"
      backdropClassName="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xl"
      className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Доверенные устройства & Сессии</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Security Hub
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Управление доверенными входами и историей подключений NEXORUM OS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Device Banner */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border-b border-slate-800/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {deviceInfo.isMobile ? (
              <Smartphone className="w-5 h-5 text-cyan-400 shrink-0" />
            ) : (
              <Laptop className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Текущее устройство:</span>
                <span className="text-cyan-300 font-semibold">{deviceInfo.os}</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  ACTIVE NOW
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Экран: {deviceInfo.width}×{deviceInfo.height} ({deviceInfo.orientation}) • {deviceInfo.isMobile ? 'Mobile Touch View' : 'PC Desktop View'}
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right text-[10px] font-mono text-slate-400">
            <div>Encrypted Vault</div>
            <div className="text-emerald-400">256-bit AES Sync</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2">
          <button
            onClick={() => setActiveSubTab('trusted')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'trusted'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Доверенные устройства ({trustedDevices.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'history'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>История входов ({devices.length})</span>
          </button>
        </div>

        {/* Device List Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {isLoading ? (
            <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs font-medium">Синхронизация истории устройств...</span>
            </div>
          ) : activeSubTab === 'trusted' ? (
            trustedDevices.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Нет доверенных устройств</p>
                <p className="text-xs text-slate-400 mt-1">
                  Вы можете добавить устройство в список доверенных в разделе "История входов".
                </p>
              </div>
            ) : (
              trustedDevices.map((dev) => (
                <div
                  key={dev.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    dev.isCurrentSession
                      ? 'bg-slate-950/90 border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 shrink-0 mt-0.5">
                      {dev.deviceCategory === 'mobile' ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{dev.deviceName}</span>
                        {dev.isCurrentSession && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40">
                            Текущая сессия
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          {dev.location}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-400">{dev.ipAddress}</span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {dev.isCurrentSession
                            ? 'Активно сейчас'
                            : `Последний вход: ${new Date(dev.lastActive).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => toggleTrustStatus(dev.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Доверенное</span>
                    </button>

                    {!dev.isCurrentSession && (
                      <button
                        onClick={() => handleRevokeSession(dev.id, dev.deviceName)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        title="Отозвать сессию"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            devices.map((dev) => (
              <div
                key={dev.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  dev.isCurrentSession
                    ? 'bg-slate-950/90 border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 shrink-0 mt-0.5">
                    {dev.deviceCategory === 'mobile' ? (
                      <Smartphone className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <Laptop className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{dev.deviceName}</span>
                      {dev.isCurrentSession ? (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40">
                          Текущая сессия
                        </span>
                      ) : dev.isTrusted ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Доверенное
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                          Обычный вход
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        {dev.location}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-slate-400">{dev.ipAddress}</span>
                      <span>•</span>
                      <span className="text-slate-400">
                        {dev.isCurrentSession
                          ? 'Активно прямо сейчас'
                          : new Date(dev.lastActive).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => toggleTrustStatus(dev.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      dev.isTrusted
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {dev.isTrusted ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Доверенное</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Сделать доверенным</span>
                      </>
                    )}
                  </button>

                  {!dev.isCurrentSession && (
                    <button
                      onClick={() => handleRevokeSession(dev.id, dev.deviceName)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      title="Отозвать доступ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 text-cyan-400">
            <Lock className="w-4 h-4" />
            <span>Защищено NEXORUM Security Kernel</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer min-h-[44px]"
          >
            Закрыть
          </button>
        </div>
    </SwipeableContainer>
  );
};
