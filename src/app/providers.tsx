'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import clarity from '@microsoft/clarity';

if (typeof window !== 'undefined') {
  posthog.init('phc_WmQnO2rbuudmSRwtP2mgIUXcW4dP3d1f7Gz9LEzQ3YH', {
    api_host: 'https://us.posthog.com',
    person_profiles: 'always', // Track everyone immediately
    capture_performance: true,
    session_recording: {
      maskAllInputs: false,
      maskTextSelector: '.mask-me',
    },
    loaded: (ph) => {
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
  });
  clarity.init('twaztmnjmm');
}
export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
