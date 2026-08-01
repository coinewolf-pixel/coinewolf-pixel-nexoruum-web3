import { useState, useEffect } from 'react';
import { useViewportScale, calculateViewportScale, ViewportScaleInfo } from './useViewportScale';

export { useViewportScale, calculateViewportScale };
export type { ViewportScaleInfo };

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  deviceCategory: 'mobile' | 'tablet' | 'desktop';
  os: 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'Unknown';
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  fontScale: number;
  paddingScale: number;
}

function getOS(): 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'Unknown' {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';

  if (/android/i.test(ua)) return 'Android';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'iOS';
  }
  if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(ua)) return 'macOS';
  if (/Win32|Win64|Windows|WinCE/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';

  return 'Unknown';
}

function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      deviceCategory: 'desktop',
      os: 'Unknown',
      width: 1280,
      height: 800,
      orientation: 'landscape',
      fontScale: 1.0,
      paddingScale: 1.0,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0 || (window as unknown as { DocumentTouch?: unknown }).DocumentTouch !== undefined;

  const ua = navigator.userAgent.toLowerCase();
  const isMobileUA = /mobile|iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua);

  const isMobile = width < 768 || (isMobileUA && width < 1024);
  const isTablet = !isMobile && (width < 1024 || (isTouchDevice && width < 1280));
  const isDesktop = !isMobile && !isTablet;

  const deviceCategory: 'mobile' | 'tablet' | 'desktop' = isMobile
    ? 'mobile'
    : isTablet
    ? 'tablet'
    : 'desktop';

  const orientation: 'portrait' | 'landscape' = height > width ? 'portrait' : 'landscape';

  const scale = calculateViewportScale(width, height);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    deviceCategory,
    os: getOS(),
    width,
    height,
    orientation,
    fontScale: scale.fontScale,
    paddingScale: scale.paddingScale,
  };
}

export function useDeviceDetect(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo);

  useEffect(() => {
    function handleResize() {
      setDeviceInfo(getDeviceInfo());
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
}
