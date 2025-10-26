'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { clarity } from 'react-microsoft-clarity';

if (typeof window !== 'undefined') {
  posthog.init('phc_WmQnO2rbuudmSRwtP2mgIUXcW4dP3d1f7Gz9LEzQ3YH', {
    api_host: 'https://us.posthog.com',
  });
  clarity.init('twaztmnjmm');
}
export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
