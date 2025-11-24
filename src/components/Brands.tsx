
import React from 'react';
import { cn } from '@/lib/utils';

type Brand = {
  name: string;
  logo: React.ReactNode;
};

const brands: Brand[] = [
  { name: 'Flexport', logo: <p className="font-bold text-lg">flexport</p> },
  { name: 'Ramp', logo: <p className="font-serif text-2xl italic">ramp</p> },
  { name: 'Verkada', logo: <p className="font-sans font-semibold text-lg">Verkada</p> },
  { name: 'Perplexity', logo: <p className="font-mono text-lg">perplexity</p> },
  { name: 'Quora', logo: <p className="font-serif font-bold text-2xl">Quora</p> },
];

export function Brands() {
  return (
    <div className="mt-16 w-full">
      <div className="relative border-t">
        <p className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-2 text-xs text-muted-foreground">
          TRUSTED BY
        </p>
      </div>
      <div className="flex items-center justify-around gap-x-6 gap-y-4 pt-8 text-muted-foreground/80 flex-wrap">
        {brands.map((brand) => (
          <div key={brand.name} className="flex items-center justify-center">
            {brand.logo}
          </div>
        ))}
      </div>
    </div>
  );
}
