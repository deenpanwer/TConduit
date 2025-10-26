"use client";

import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-black font-serif text-center p-4">
      <div className="max-w-xl">
        <h1 className="text-3xl mb-4">Thank You</h1>
        <p className="text-lg mb-8">
          Our agent will scour the internet to find the most suitable individual who can solve your problem. We'll be in touch.
        </p>
        <Link href="/" className="inline-block border border-black px-6 py-2 bg-white text-black hover:bg-gray-100">
          Submit Another Problem
        </Link>
      </div>
    </main>
  );
}
