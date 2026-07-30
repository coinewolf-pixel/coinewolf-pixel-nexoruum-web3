import { useState, useEffect, useCallback } from 'react';

export interface ViewportScaleInfo {
  width: number;
  height: number;
  fontScale: number;
  paddingScale: number;
  scaleCategory: 'compact-mobile' | 'standard-mobile' | 'phablet' | 'tablet' | 'desktop' | 'ultra-wide';
  getScaledFont: (basePx: number) => number;
  getScaledPadding: (basePx: number) => number;
}

/**
 * Calculates responsive scaling factors based on window.innerWidth
 * for optimal reading typography and padding densities across all devices.
 */
export function calculateViewportScale(width: number, height: number): ViewportScaleInfo {
  let fontScale = 1.0;
  let paddingScale = 1.0;
  let scaleCategory: ViewportScaleInfo['scaleCategory'] = 'standard-mobile';

  if (width < 360) {
    // Ultra compact mobile (e.g., iPhone SE / Galaxy Mini)
    fontScale = 0.90;
    paddingScale = 0.85;
    scaleCategory = 'compact-mobile';
  } else if (width < 430) {
    // Standard mobile portrait
    fontScale = 0.96;
    paddingScale = 0.92;
    scaleCategory = 'standard-mobile';
  } else if (width < 768) {
    // Large mobile / landscape
    fontScale = 1.0;
    paddingScale = 1.0;
    scaleCategory = 'phablet';
  } else if (width < 1024) {
    // Tablet / iPad
    fontScale = 1.05;
    paddingScale = 1.08;
    scaleCategory = 'tablet';
  } else if (width < 1440) {
    // Standard Desktop / Laptop
    fontScale = 1.08;
    paddingScale = 1.12;
    scaleCategory = 'desktop';
  } else {
    // Ultra-wide Desktop
    fontScale = 1.12;
    paddingScale = 1.20;
    scaleCategory = 'ultra-wide';
  }

  // Helper function to scale font size in px
  const getScaledFont = (basePx: number): number => {
    return Math.round(basePx * fontScale * 10) / 10;
  };

  // Helper function to scale padding in px
  const getScaledPadding = (basePx: number): number => {
    return Math.round(basePx * paddingScale);
  };

  return {
    width,
    height,
    fontScale,
    paddingScale,
    scaleCategory,
    getScaledFont,
    getScaledPadding,
  };
}

/**
 * Custom React hook that monitors window.innerWidth and automatically applies
 * viewport-aware CSS custom properties to document.documentElement.
 */
export function useViewportScale(): ViewportScaleInfo {
  const [scaleInfo, setScaleInfo] = useState<ViewportScaleInfo>(() => {
    if (typeof window === 'undefined') {
      return calculateViewportScale(1280, 800);
    }
    return calculateViewportScale(window.innerWidth, window.innerHeight);
  });

  const updateRootCssVariables = useCallback((info: ViewportScaleInfo) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--vw-scale-font', info.fontScale.toFixed(3));
    root.style.setProperty('--vw-scale-padding', info.paddingScale.toFixed(3));
    root.style.setProperty('--vw-width-px', `${info.width}px`);
    root.style.setProperty('--vw-height-px', `${info.height}px`);
    root.style.setProperty('--vw-font-base', `${16 * info.fontScale}px`);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleResize() {
      const info = calculateViewportScale(window.innerWidth, window.innerHeight);
      setScaleInfo(info);
      updateRootCssVariables(info);
    }

    // Initial update
    const initialInfo = calculateViewportScale(window.innerWidth, window.innerHeight);
    setScaleInfo(initialInfo);
    updateRootCssVariables(initialInfo);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateRootCssVariables]);

  return scaleInfo;
}
