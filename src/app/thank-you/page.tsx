"use client";

import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-black font-serif text-center p-4">
      <div className="max-w-xl">
        <h1 className="text-3xl mb-4">Transmission Received</h1>
        <p className="text-lg mb-8">
          Your query has been submitted to our talent orchestration engine. Our specialized AI is now executing a multi-vector analysis across our proprietary network of elite problem-solvers. We will be in touch shortly with a curated selection of candidates.
        </p>
        <Link href="/" className="inline-block border border-black px-6 py-2 bg-white text-black hover:bg-gray-100">
          Submit Another Problem
        </Link>
      </div>
    </main>
  );
}
