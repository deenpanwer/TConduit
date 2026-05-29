'use client'
import 'regenerator-runtime/runtime';
import React, { useEffect, useState } from 'react';

export function PHProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<{ Provider: any; instance: any } | null>(null);

  useEffect(() => {
    const isProd = process.env.NODE_ENV === 'production';
    
    // Dynamic import to keep them out of the main critical chunk
    Promise.all([
      import('posthog-js'),
      import('posthog-js/react')
    ]).then(([{ default: ph }, { PostHogProvider: Provider }]) => {
      ph.init('phc_WmQnO2rbuudmSRwtP2mgIUXcW4dP3d1f7Gz9LEzQ3YH', {
        api_host: 'https://us.posthog.com',
        person_profiles: isProd ? 'always' : 'never', // Track only in prod, disabled in dev
        capture_performance: isProd,                 // Capture perf stats only in prod
        disable_session_recording: !isProd,          // Completely turn off recordings on localhost
        opt_out_capturing: !isProd,                  // Opt-out capturing in dev mode to completely disable dev event network calls
        session_recording: {
          maskAllInputs: false,
          maskTextSelector: '.mask-me',
        },
        loaded: (phInstance: any) => {
          if (!isProd) return;
          // Attribution Injection: Check for partner cookie
          const partnerSlug = document.cookie
            .split('; ')
            .find(row => row.startsWith('trac_partner_slug='))
            ?.split('=')[1];
          
          if (partnerSlug) {
            phInstance.register({ partner_slug: partnerSlug });
          }
        }
      } as any);

      setClient({ Provider, instance: ph });
    });

    if (isProd) {
      import('@microsoft/clarity').then(({ default: cl }) => {
        cl.init('twaztmnjmm');
      });
    }
  }, []);

  if (!client) {
    // Render children synchronously during SSR and initial client hydration to prevent FCP block
    return <>{children}</>;
  }

  const { Provider, instance } = client;
  return <Provider client={instance}>{children}</Provider>;
}
