import { useState, useEffect, useCallback } from 'react';

export interface ViewportScaleInfo {
  width: number;
  height: number;
  dpr: number;
  fontScale: number;
  paddingScale: number;
  minTouchTargetPx: number;
  isHighDensity: boolean;
  scaleCategory: 'compact-mobile' | 'standard-mobile' | 'phablet' | 'tablet' | 'desktop' | 'ultra-wide';
  getScaledFont: (basePx: number) => number;
  getScaledPadding: (basePx: number) => number;
  getAccessibleTouchTargetPx: (basePx?: number) => number;
}

/**
 * Calculates responsive scaling factors based on window width, height, and devicePixelRatio
 * for consistent element sizing across high-density mobile devices and tablets,
 * ensuring touch targets remain accessible while maintaining desktop layout fidelity.
 */
export function calculateViewportScale(width: number, height: number, customDpr?: number): ViewportScaleInfo {
  const dpr = customDpr ?? (typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
  const isHighDensity = dpr >= 2;

  let fontScale = 1.0;
  let paddingScale = 1.0;
  let minTouchTargetPx = 44; // WCAG AA minimum touch target size (44px)
  let scaleCategory: ViewportScaleInfo['scaleCategory'] = 'standard-mobile';

  if (width < 360) {
    // Ultra compact mobile (e.g., iPhone SE / Galaxy Mini)
    fontScale = 0.88;
    paddingScale = 0.82;
    minTouchTargetPx = 44;
    scaleCategory = 'compact-mobile';
  } else if (width < 430) {
    // Standard mobile portrait
    fontScale = 0.94;
    paddingScale = 0.88;
    minTouchTargetPx = 44;
    scaleCategory = 'standard-mobile';
  } else if (width < 768) {
    // Large mobile / Phablet / Landscape
    fontScale = 0.98;
    paddingScale = 0.92;
    minTouchTargetPx = 44;
    scaleCategory = 'phablet';
  } else if (width < 1024) {
    // Tablet / iPad
    fontScale = 1.0;
    paddingScale = 0.96;
    minTouchTargetPx = 44;
    scaleCategory = 'tablet';
  } else if (width < 1440) {
    // Standard Desktop / Laptop
    fontScale = 1.0;
    paddingScale = 1.0;
    minTouchTargetPx = 40;
    scaleCategory = 'desktop';
  } else {
    // Ultra-wide Desktop
    fontScale = 1.04;
    paddingScale = 1.05;
    minTouchTargetPx = 40;
    scaleCategory = 'ultra-wide';
  }

  // Optical adjustment for high-density mobile screens to prevent oversized rendering
  if (isHighDensity && dpr >= 3 && width < 768) {
    fontScale = Math.min(fontScale, 0.94);
  }

  // Helper function to scale font size in px
  const getScaledFont = (basePx: number): number => {
    return Math.round(basePx * fontScale * 10) / 10;
  };

  // Helper function to scale padding in px
  const getScaledPadding = (basePx: number): number => {
    return Math.round(basePx * paddingScale);
  };

  // Helper function to ensure touch target meets accessibility threshold
  const getAccessibleTouchTargetPx = (basePx: number = 44): number => {
    return Math.max(basePx, minTouchTargetPx);
  };

  return {
    width,
    height,
    dpr,
    fontScale,
    paddingScale,
    minTouchTargetPx,
    isHighDensity,
    scaleCategory,
    getScaledFont,
    getScaledPadding,
    getAccessibleTouchTargetPx,
  };
}

/**
 * Custom React hook that monitors window.innerWidth and automatically applies
 * viewport-aware CSS custom properties to document.documentElement.
 */
export function useViewportScale(): ViewportScaleInfo {
  const [scaleInfo, setScaleInfo] = useState<ViewportScaleInfo>(() => {
    if (typeof window === 'undefined') {
      return calculateViewportScale(1280, 800, 1);
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
    root.style.setProperty('--vw-dpr', info.dpr.toFixed(2));
    root.style.setProperty('--vw-font-base', `${16 * info.fontScale}px`);
    root.style.setProperty('--min-touch-target', `${info.minTouchTargetPx}px`);
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

