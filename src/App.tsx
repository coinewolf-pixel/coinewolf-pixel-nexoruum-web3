import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { WalletModal } from './components/WalletModal';
import { TelegramAuthModal } from './components/TelegramAuthModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';

import { HomeView } from './components/HomeView';
import { DiscoverView } from './components/DiscoverView';
import { TokenCreatorView } from './components/TokenCreatorView';
import { MarketplaceView } from './components/MarketplaceView';
import { AiAssistantView } from './components/AiAssistantView';
import { AiQuantumSentinelView } from './components/AiQuantumSentinelView';
import { SearchView } from './components/SearchView';
import { ProfileView } from './components/ProfileView';
import { AdminPanelView } from './components/AdminPanelView';

function ToastContainer() {
  const { toasts, removeToast } = useNotifications();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto max-w-sm p-4 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl text-xs text-white animate-in slide-in-from-bottom-2 duration-300 backdrop-blur-xl flex justify-between items-start gap-3"
        >
          <div>
            <h4 className="font-bold text-cyan-300">{t.title}</h4>
            <p className="text-slate-300 mt-0.5 leading-snug">{t.message}</p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="text-slate-500 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function MainContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView setActiveTab={setActiveTab} />;
      case 'discover':
        return <DiscoverView setActiveTab={setActiveTab} />;
      case 'creator':
        return <TokenCreatorView setActiveTab={setActiveTab} />;
      case 'marketplace':
        return <MarketplaceView />;
      case 'sentinel':
        return <AiQuantumSentinelView setActiveTab={setActiveTab} />;
      case 'ai':
        return <AiAssistantView />;
      case 'search':
        return <SearchView setActiveTab={setActiveTab} />;
      case 'profile':
        return <ProfileView />;
      case 'admin':
        return <AdminPanelView />;
      default:
        return <HomeView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          setActiveTab={setActiveTab}
          openTelegramModal={() => setIsTelegramModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>

      {/* Global Modals & Overlay Panels */}
      <WalletModal />
      <TelegramAuthModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />
      <NotificationsDrawer />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <NotificationProvider>
          <MainContent />
        </NotificationProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
