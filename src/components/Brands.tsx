
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
  const allBrands = [...brands, ...brands];

  return (
    <div className="mt-16 w-full">
      <div className="relative border-t">
        <p className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-2 text-xs text-muted-foreground">
          Teams from Stripe, Anduril, DoorDash, Applied Intuition, Amplitude, Ramp, Cursor, and Helion have used it.
        </p>
      </div>
      <div
        className="relative mt-8 w-full overflow-hidden"
        style={{
            maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)'
        }}
      >
        <div className="flex animate-[scroll-x_30s_linear_infinite]">
          {allBrands.map((brand, index) => (
            <div key={`${brand.name}-${index}`} className="flex-shrink-0 w-48 flex justify-center items-center">
              <img 
                src={brand.logoUrl} 
                alt={brand.name} 
                className="h-8 object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
