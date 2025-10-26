"use client";

import Link from "next/link";
import Image from "next/image";

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-4 font-serif">
      <div className="relative w-full max-w-3xl">
        <Image
          src="https://images.pexels.com/photos/17483850/pexels-photo-17483850.png"
          alt="Abstract background"
          width={800}
          height={600}
          className="object-cover rounded-lg"
          data-ai-hint="futuristic abstract"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg p-4 sm:p-6 md:p-8">
          <div className="bg-white p-8 text-black rounded-none">
            <h1 className="mb-4 text-xl sm:text-2xl md:text-3xl">Thank You</h1>
            <p className="text-sm sm:text-base md:text-lg">
              Our agent is scouring the net to find the right fit to solve your problem. We'll inform you.
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
