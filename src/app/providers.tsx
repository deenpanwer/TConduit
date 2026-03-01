'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import clarity from '@microsoft/clarity';

if (typeof window !== 'undefined') {
  posthog.init('phc_WmQnO2rbuudmSRwtP2mgIUXcW4dP3d1f7Gz9LEzQ3YH', {
    api_host: 'https://us.posthog.com',
    person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    capture_performance: true,
    session_recording: {
      maskAllInputs: false,
      maskTextSelector: '.mask-me', // Example: how to selectively mask
    }
  });
  clarity.init('twaztmnjmm');
}
export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
