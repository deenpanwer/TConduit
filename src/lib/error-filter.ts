/**
 * Utility to filter out normal errors that shouldn't prompt a user-facing error report modal.
 * Specifically excludes React hydration errors and Firebase permission-denied errors.
 */
export function shouldShowReportButton(message?: string | null): boolean {
  if (!message) return true;

  const msg = message.toLowerCase();

  // Exclude React / Next.js hydration errors
  const isHydrationError = 
    msg.includes('hydration') ||
    msg.includes('initial ui does not match') ||
    msg.includes('text content does not match') ||
    msg.includes('did not match server') ||
    msg.includes('hydration-error');

  // Exclude Firebase permission / security rule errors
  const isFirebasePermissionError =
    msg.includes('permission-denied') ||
    msg.includes('insufficient permissions') ||
    msg.includes('permission denied') ||
    msg.includes('firebaseerror: [code=permission-denied]');

  // Return true ONLY if it is not any of these normal errors
  return !isHydrationError && !isFirebasePermissionError;
}
