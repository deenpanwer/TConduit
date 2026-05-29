'use client'
import 'regenerator-runtime/runtime';
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import clarity from '@microsoft/clarity';

if (typeof window !== 'undefined') {
  const isProd = process.env.NODE_ENV === 'production';
  
  posthog.init('phc_WmQnO2rbuudmSRwtP2mgIUXcW4dP3d1f7Gz9LEzQ3YH', {
    api_host: 'https://us.posthog.com',
    person_profiles: isProd ? 'always' : 'never', // Track only in prod, disabled in dev
    capture_performance: isProd,                 // Capture perf stats only in prod
    disable_session_recording: !isProd,          // Completely turn off recordings on localhost
    opt_out_capturing: !isProd,                  // Opt-out capturing in dev mode to completely disable dev event network calls
    session_recording: {
      maskAllInputs: false,
      maskTextSelector: '.mask-me',
    },
    loaded: (ph: any) => {
      if (!isProd) return;
      // Attribution Injection: Check for partner cookie
      const partnerSlug = document.cookie
        .split('; ')
        .find(row => row.startsWith('trac_partner_slug='))
        ?.split('=')[1];
      
      if (partnerSlug) {
        // Set as both a super property (for events) and a person property
        ph.register({ partner_slug: partnerSlug });
      }
    }
  } as any);

  if (isProd) {
    clarity.init('twaztmnjmm');
  }
}
export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
