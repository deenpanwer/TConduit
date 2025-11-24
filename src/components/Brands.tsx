
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type Brand = {
  name: string;
  logoUrl: string;
};

const brands: Brand[] = [
  { name: 'Stripe', logoUrl: 'https://cdn.brandfetch.io/idgF9FqCgW/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
  { name: 'Anduril', logoUrl: 'https://cdn.brandfetch.io/idl2KxqxdU/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
  { name: 'DoorDash', logoUrl: 'https://cdn.brandfetch.io/idrVhdDocf/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
  { name: 'Applied Intuition', logoUrl: 'https://cdn.brandfetch.io/idlgUl599B/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
  { name: 'Amplitude', logoUrl: 'https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
  { name: 'Ramp', logoUrl: 'https://cdn.brandfetch.io/idWQ_FWEk6/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
  { name: 'Cursor', logoUrl: 'https://cdn.brandfetch.io/ideKwS9dxx/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
  { name: 'Helion', logoUrl: 'https://cdn.brandfetch.io/idbTWCiXhC/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
];

export function Brands() {
  return (
    <div className="mt-16 w-full">
      <div className="relative border-t">
        <p className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-2 text-xs text-muted-foreground">
          Trusted by teams at
        </p>
      </div>
      <div
        className="relative mt-8 w-full overflow-hidden"
        style={{
            maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)'
        }}
      >
        <div className="flex w-max animate-[scroll-x_30s_linear_infinite]">
          {[...brands, ...brands].map((brand, index) => (
            <div key={`${brand.name}-${index}`} className="flex w-48 flex-shrink-0 items-center justify-center px-4">
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-5 object-contain grayscale brightness-0"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
