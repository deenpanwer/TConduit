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
