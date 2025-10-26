"use client";

import Link from "next/link";
import Image from "next/image";

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-4 font-serif">
      <div className="relative w-full max-w-2xl">
        <Image
          src="https://images.pexels.com/photos/17483850/pexels-photo-17483850.png"
          alt="Abstract background"
          width={800}
          height={600}
          className="object-cover"
          data-ai-hint="futuristic abstract"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="max-w-xl bg-white p-8 text-black rounded-none">
            <h1 className="mb-4 text-3xl">Transmission Received</h1>
            <p className="text-lg">
              Your query has been submitted to our talent orchestration engine. Our specialized AI is now executing a multi-vector analysis across our proprietary network of elite problem-solvers. We will be in touch shortly with a curated selection of candidates.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-block border border-black bg-white px-6 py-2 text-black transition-colors hover:bg-black hover:text-white"
        >
          Submit Another Problem
        </Link>
      </div>
    </main>
  );
}