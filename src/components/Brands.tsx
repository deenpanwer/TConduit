
import React from 'react';
import { cn } from '@/lib/utils';

type Brand = {
  name: string;
  logoUrl: string;
};

const brands: Brand[] = [
    { name: 'Flexport', logoUrl: 'https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
    { name: 'Ramp', logoUrl: 'https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
    { name: 'Verkada', logoUrl: 'https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
    { name: 'Perplexity', logoUrl: 'https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
    { name: 'Quora', logoUrl: 'https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
    { name: 'Brex', logoUrl: 'https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
    { name: 'Gemini', logoUrl: 'https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B' },
];

export function Brands() {
  const allBrands = [...brands, ...brands];

  return (
    <div className="mt-16 w-full">
      <div className="relative border-t">
        <p className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-2 text-xs text-muted-foreground">
          TRUSTED BY
        </p>
      </div>
      <div
        className="relative mt-8 w-full overflow-hidden"
        style={{
            maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)'
        }}
      >
        <div className="flex animate-[scroll-x_20s_linear_infinite]">
          {allBrands.map((brand, index) => (
            <div key={`${brand.name}-${index}`} className="flex-shrink-0 w-48 flex justify-center items-center">
              <img 
                src={brand.logoUrl} 
                alt={brand.name} 
                className="h-8 object-contain transition-all duration-300"
                style={{
                  filter: 'grayscale(100%)',
                  maskImage: 'linear-gradient(to right, black, white 50%, black)',
                }}
              />
            </div>
          ))}
        </div>
         <div 
          className="absolute inset-0"
          style={{
            maskImage: 'linear-gradient(to right, black 5%, transparent, transparent, transparent, black 95%)'
          }}
        >
            <div className="flex animate-[scroll-x_20s_linear_infinite]">
              {allBrands.map((brand, index) => (
                <div key={`${brand.name}-${index}-color`} className="flex-shrink-0 w-48 flex justify-center items-center">
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
    </div>
  );
}
