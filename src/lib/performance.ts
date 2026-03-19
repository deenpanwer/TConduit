export function getPageLoadTime(): number {
  if (typeof window === "undefined" || !window.performance) return 0;
  
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (nav) {
      // Returns duration in milliseconds
      return Math.round(nav.duration);
    }
    
    // Fallback for older browsers
    const timing = window.performance.timing;
    return timing.loadEventEnd - timing.navigationStart;
  } catch (e) {
    return 0;
  }
}

export function getDeviceCapabilities() {
  if (typeof window === "undefined") return {};

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: (navigator as any).platform,
    vendor: navigator.vendor,
    isPWA: window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true,
    notificationsEnabled: "Notification" in window ? Notification.permission === "granted" : false,
    cookiesEnabled: navigator.cookieEnabled,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export async function getPushSubscription() {
  if (typeof window === "undefined" || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (e) {
    console.error("Error getting push subscription:", e);
    return null;
  }
}
