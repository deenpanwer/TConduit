"use client";

import Link from "next/link";
import Image from "next/image";

export default function ThankYouPage() {
  return (
    <main className="relative min-h-screen font-serif text-center">
      <Image
        src="https://images.pexels.com/photos/17483850/pexels-photo-17483850.png"
        alt="Abstract background"
        fill
        className="object-cover"
        data-ai-hint="futuristic abstract"
      />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen bg-black/50 p-4">
        <div className="max-w-xl bg-white text-black p-8 rounded-none">
          <h1 className="text-3xl mb-4">Transmission Received</h1>
          <p className="text-lg">
            Your query has been submitted to our talent orchestration engine. Our specialized AI is now executing a multi-vector analysis across our proprietary network of elite problem-solvers. We will be in touch shortly with a curated selection of candidates.
          </p>
        </div>
        <div className="mt-8">
            <Link href="/" className="inline-block border border-white px-6 py-2 bg-transparent text-white hover:bg-white hover:text-black transition-colors">
              Submit Another Problem
            </Link>
        </div>
      </div>
    </main>
  );
}
