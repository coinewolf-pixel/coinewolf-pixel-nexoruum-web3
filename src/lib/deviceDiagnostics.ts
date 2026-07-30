export interface DeviceDiagnosticEntry {
  id: string;
  timestamp: string;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  platform: string;
  language: string;
  connectionType?: string;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
}

const STORAGE_KEY = 'nexorum_device_history_log';

export class DeviceDiagnostics {
  /**
   * Captures the current device diagnostic metadata (non-sensitive)
   */
  public static captureCurrentDiagnostics(): DeviceDiagnosticEntry {
    if (typeof window === 'undefined') {
      return {
        id: `diag_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userAgent: 'Server Environment',
        screenWidth: 1920,
        screenHeight: 1080,
        viewportWidth: 1280,
        viewportHeight: 800,
        devicePixelRatio: 1,
        platform: 'Unknown',
        language: 'en-US',
        deviceType: 'Desktop',
      };
    }

    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const isTablet = /(iPad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch)))/i.test(ua);
    const deviceType: 'Mobile' | 'Tablet' | 'Desktop' = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';

    // Connection type (if available on navigator)
    const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const connectionType = navConn?.effectiveType || navConn?.type || (navigator.onLine ? 'Online' : 'Offline');

    return {
      id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userAgent: ua,
      screenWidth: window.screen ? window.screen.width : window.innerWidth,
      screenHeight: window.screen ? window.screen.height : window.innerHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      platform: navigator.platform || 'Web',
      language: navigator.language || 'en-US',
      connectionType,
      deviceType,
    };
  }

  /**
   * Logs current connection session to local storage device history
   */
  public static logConnectionSession(): DeviceDiagnosticEntry {
    const current = this.captureCurrentDiagnostics();
    const existing = this.getDeviceHistory();

    // Avoid duplicate logging within 5 seconds
    if (existing.length > 0) {
      const last = existing[0];
      const timeDiff = new Date(current.timestamp).getTime() - new Date(last.timestamp).getTime();
      if (timeDiff < 5000 && last.userAgent === current.userAgent) {
        return last;
      }
    }

    const updated = [current, ...existing].slice(0, 15);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save device diagnostics to localStorage', e);
    }
    return current;
  }

  /**
   * Retrieves stored device history
   */
  public static getDeviceHistory(): DeviceDiagnosticEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = this.captureCurrentDiagnostics();
        localStorage.setItem(STORAGE_KEY, JSON.stringify([initial]));
        return [initial];
      }
      return JSON.parse(raw);
    } catch (e) {
      return [this.captureCurrentDiagnostics()];
    }
  }

  /**
   * Clears device history logs
   */
  public static clearDeviceHistory(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
