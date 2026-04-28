import React from 'react';
import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';

const FeaturesHero = () => {

  return (
    <div className="relative w-full bg-white overflow-hidden pt-10 pb-16">
      {/* Main Hero Visual Area */}
      <div className="relative flex flex-col items-center z-10">
        <div className="relative w-full max-w-[1200px] aspect-[1200/400] mb-12">
          {/* Glow Effect behind the central part of the image */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full blur-[80px] opacity-40" />
          
          <Image
            src="/feature/hero-image.jfif"
            alt="Trac AI Features Overview"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Content */}
        <div className="text-center max-w-4xl px-6">
          <span className="text-sm font-bold text-[#7B61FF] uppercase tracking-widest mb-4 block">
            TRAC AI FEATURES
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-[#1a1919] tracking-tighter mb-6 leading-[1.1]">
            All the features,<br />one platform
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Trac AI packs more features than any other business management platform - 
            <span className="text-gray-900 font-semibold"> Software That Replaces All Software.</span>
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a 
              href="/login"
              className="h-16 px-10 bg-[#1a1919] text-white rounded-2xl font-bold text-lg flex items-center gap-2 hover:bg-black transition-colors shadow-lg shadow-black/10"
            >
              Get started. It&apos;s FREE <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="https://calendly.com/kaayfkhan/discovery-call"
              target="_blank"
              rel="noopener noreferrer"
              className="h-16 px-10 bg-[#f0f0f0] text-[#1a1919] rounded-2xl font-bold text-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              Get a demo
            </a>
          </div>

          {/* Feature Rating Badge */}
<div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className="w-5 h-5 fill-[#FFB800] text-[#FFB800]" />
    ))}
  </div>
  <p className="text-sm text-gray-500 flex items-center gap-2">
    500+ reviews from 
    <span className="flex gap-2">
      {/* Download the image above and update the path here */}
      <img src="/feature/ratings1.png" alt="Partner Logos" className="h-6 w-auto" />
    </span>
  </p>
</div>
        </div>
      </div>


    </div>
  );
};

export default FeaturesHero;

