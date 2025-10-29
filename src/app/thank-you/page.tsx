
"use client";

import Link from "next/link";
import Image from "next/image";
import { ContactForm } from "@/components/ContactForm";

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-4 font-serif">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-none border border-black">
        <Image
          src="https://images.pexels.com/photos/17483850/pexels-photo-17483850.png"
          alt="Abstract background"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0"
          data-ai-hint="futuristic abstract"
        />
        <div className="relative z-10 bg-white/80 backdrop-blur-sm p-8 m-4 md:m-16 text-black text-center animate-fade-in">
          <h1 className="mb-4 text-xl sm:text-2xl md:text-3xl">Thank You</h1>
          <p className="text-sm sm:text-base md:text-lg mb-6">
            Our agent is scouring the net to find the right fit to solve your problem. We'll inform you.
          </p>
          <ContactForm />
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
