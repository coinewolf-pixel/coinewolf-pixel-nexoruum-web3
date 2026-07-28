import React from 'react';

interface LogoProps {
  className?: string;
}

export const MetaMaskLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M29.5 5.5L18.5 13.5L20.5 8L29.5 5.5Z" fill="#E17726"/>
    <path d="M2.5 5.5L13.5 13.5L11.5 8L2.5 5.5Z" fill="#E17726"/>
    <path d="M25 21.5L29 17L30.5 11.5L25 15.5V21.5Z" fill="#E17726"/>
    <path d="M7 21.5L3 17L1.5 11.5L7 15.5V21.5Z" fill="#E17726"/>
    <path d="M12.5 14.5L10 18.5L15.5 18.8L15.2 14.8L12.5 14.5Z" fill="#E27625"/>
    <path d="M19.5 14.5L22 18.5L16.5 18.8L16.8 14.8L19.5 14.5Z" fill="#E27625"/>
    <path d="M7 21.5L10.5 27L16 29L16 18.8L10 18.5L7 21.5Z" fill="#E27625"/>
    <path d="M25 21.5L21.5 27L16 29L16 18.8L22 18.5L25 21.5Z" fill="#E27625"/>
    <path d="M16 3L11.5 8L15.2 14.8L16 15L16.8 14.8L20.5 8L16 3Z" fill="#F6851B"/>
    <path d="M29.5 5.5L30.5 11.5L25 15.5L20.5 8L29.5 5.5Z" fill="#F6851B"/>
    <path d="M2.5 5.5L1.5 11.5L7 15.5L11.5 8L2.5 5.5Z" fill="#F6851B"/>
    <path d="M10 18.5L16 22L22 18.5L22 14.5L16.8 14.8L15.2 14.8L10 14.5L10 18.5Z" fill="#C0AD9E"/>
  </svg>
);

export const TrustWalletLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 3L5 8.5V16C5 22.5 10 27.5 16 29C22 27.5 27 22.5 27 16V8.5L16 3Z" fill="#0500FF"/>
    <path d="M16 5.5L7 10V16C7 21.2 10.9 25.3 16 26.6V5.5Z" fill="#0038FF"/>
    <path d="M16 5.5L25 10V16C25 21.2 21.1 25.3 16 26.6V5.5Z" fill="#3375FF"/>
  </svg>
);

export const BinanceLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#F0B90B"/>
    <path d="M16 6L20 10L16 14L12 10L16 6ZM10 12L14 16L10 20L6 16L10 12ZM22 12L26 16L22 20L18 16L22 12ZM16 18L20 22L16 26L12 22L16 18ZM16 13L19 16L16 19L13 16L16 13Z" fill="#181A20"/>
  </svg>
);

export const OKXLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#000000"/>
    <rect x="7" y="7" width="6" height="6" fill="#FFFFFF"/>
    <rect x="19" y="7" width="6" height="6" fill="#FFFFFF"/>
    <rect x="13" y="13" width="6" height="6" fill="#FFFFFF"/>
    <rect x="7" y="19" width="6" height="6" fill="#FFFFFF"/>
    <rect x="19" y="19" width="6" height="6" fill="#FFFFFF"/>
  </svg>
);

export const CoinbaseLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#0052FF"/>
    <path d="M16 7C11.0294 7 7 11.0294 7 16C7 20.9706 11.0294 25 16 25C20.9706 25 25 20.9706 25 16C25 11.0294 20.9706 7 16 7ZM13 13H19V19H13V13Z" fill="#FFFFFF"/>
  </svg>
);

export const PhantomLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#AB9FF2"/>
    <path d="M22.5 12.5C22.5 10 20.5 8 18 8H12C8.5 8 6 11 6 15V22C6 23.5 7.5 24 8.5 23C9.5 22 10.5 22 11.5 23C12.5 24 13.5 24 14.5 23C15.5 22 16.5 22 17.5 23C18.5 24 20 23.5 20 22V16.5C20 16.5 22.5 15.5 22.5 12.5ZM10.5 13C10 13 9.5 12.5 9.5 12C9.5 11.5 10 11 10.5 11C11 11 11.5 11.5 11.5 12C11.5 12.5 11 13 10.5 13ZM15.5 13C15 13 14.5 12.5 14.5 12C14.5 11.5 15 11 15.5 11C16 11 16.5 11.5 16.5 12C16.5 12.5 16 13 15.5 13Z" fill="#2A2440"/>
  </svg>
);

export const WalletConnectLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#3B99FC"/>
    <path d="M8.5 11.5C12.6 7.4 19.4 7.4 23.5 11.5L24.2 12.2C24.5 12.5 24.5 13 24.2 13.3L22.1 15.4C21.9 15.6 21.6 15.6 21.4 15.4L20.4 14.4C17.9 11.9 14.1 11.9 11.6 14.4L10.5 15.5C10.3 15.7 10 15.7 9.8 15.5L7.7 13.4C7.4 13.1 7.4 12.6 7.7 12.3L8.5 11.5ZM26.8 14.8L28.7 16.7C29 17 29 17.5 28.7 17.8L21 25.5C20.7 25.8 20.2 25.8 19.9 25.5L16 21.6L12.1 25.5C11.8 25.8 11.3 25.8 11 25.5L3.3 17.8C3 17.5 3 17 3.3 16.7L5.2 14.8C5.5 14.5 6 14.5 6.3 14.8L10.2 18.7L14.1 14.8C14.4 14.5 14.9 14.5 15.2 14.8L16 15.6L16.8 14.8C17.1 14.5 17.6 14.5 17.9 14.8L21.8 18.7L25.7 14.8C26 14.5 26.5 14.5 26.8 14.8Z" fill="#FFFFFF"/>
  </svg>
);

export const TonkeeperLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#0098EA"/>
    <path d="M16 6L25 12L16 26L7 12L16 6ZM16 10L11 13.5L16 21.5L21 13.5L16 10Z" fill="#FFFFFF"/>
  </svg>
);

export const RainbowLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#101010"/>
    <path d="M8 20C8 13.3726 13.3726 8 20 8" stroke="#FF0000" strokeWidth="3" strokeLinecap="round"/>
    <path d="M8 22C8 16.4772 12.4772 12 18 12" stroke="#FF8A00" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M8 24C8 19.5817 11.5817 16 16 16" stroke="#FFD600" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 26C8 22.6863 10.6863 20 14 20" stroke="#00E0FF" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const BitgetLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#00F0FF"/>
    <path d="M10 10H22V15H15V17H22V22H10V10Z" fill="#0B0E14"/>
  </svg>
);

export const CryptoComLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#061239"/>
    <path d="M16 6L24 11V21L16 26L8 21V11L16 6ZM16 9.5L10.5 13V19L16 22.5L21.5 19V13L16 9.5Z" fill="#002D74"/>
    <path d="M16 12L19 14V18L16 20L13 18V14L16 12Z" fill="#00A3E0"/>
  </svg>
);

export const SafeLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#12ff80"/>
    <circle cx="16" cy="16" r="7" fill="#000000"/>
    <rect x="14" y="16" width="4" height="8" fill="#000000"/>
  </svg>
);

export const LedgerLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#000000"/>
    <path d="M8 8H14V10H10V22H14V24H8V8ZM18 8H24V24H18V22H22V10H18V8Z" fill="#FFFFFF"/>
  </svg>
);

export const ExodusLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#1F1B38"/>
    <path d="M16 6L26 12V20L16 26L6 20V12L16 6ZM16 10L9 14.5V17.5L16 13L23 17.5V14.5L16 10Z" fill="#8161FF"/>
  </svg>
);

export const OneInchLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#192330"/>
    <path d="M22 8L10 14L16 17L19 23L22 8Z" fill="#2F80ED"/>
    <path d="M10 14L13 22L16 17L10 14Z" fill="#11B67F"/>
  </svg>
);

export const RabbyLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="#8697FF"/>
    <path d="M11 9C11 7.5 12.5 7 13.5 8.5L15 11H17L18.5 8.5C19.5 7 21 7.5 21 9C21 11 19 14 16 14C13 14 11 11 11 9ZM9 16C9 14.5 11 14 16 14C21 14 23 14.5 23 16C23 18.5 20 23 16 23C12 23 9 18.5 9 16Z" fill="#FFFFFF"/>
  </svg>
);

export const TelegramWalletLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#24A1DE"/>
    <path d="M7 16L24 9L20 24L15 19L12 21V17.5L7 16Z" fill="#FFFFFF"/>
  </svg>
);

export const NexoVaultLogo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="16" fill="url(#nexo_g)"/>
    <defs>
      <linearGradient id="nexo_g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4"/>
        <stop offset="100%" stopColor="#3B82F6"/>
      </linearGradient>
    </defs>
    <path d="M16 6L25 11V21L16 26L7 21V11L16 6ZM16 10L10.5 13.2V18.8L16 22L21.5 18.8V13.2L16 10Z" fill="#FFFFFF"/>
    <circle cx="16" cy="16" r="3" fill="#06B6D4"/>
  </svg>
);

export const WalletLogoMap: Record<string, React.FC<LogoProps>> = {
  metamask: MetaMaskLogo,
  trust: TrustWalletLogo,
  binance: BinanceLogo,
  okx: OKXLogo,
  coinbase: CoinbaseLogo,
  phantom: PhantomLogo,
  walletconnect: WalletConnectLogo,
  tonkeeper: TonkeeperLogo,
  rainbow: RainbowLogo,
  bitget: BitgetLogo,
  crypto_com: CryptoComLogo,
  safe: SafeLogo,
  ledger: LedgerLogo,
  exodus: ExodusLogo,
  oneinch: OneInchLogo,
  rabby: RabbyLogo,
  telegram_wallet: TelegramWalletLogo,
  nexorum_vault: NexoVaultLogo,
};

export const getWalletLogo = (id: string, className = "w-6 h-6"): React.ReactNode => {
  const Component = WalletLogoMap[id.toLowerCase()];
  if (Component) {
    return <Component className={className} />;
  }
  return <WalletConnectLogo className={className} />;
};
