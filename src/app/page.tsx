import React from "react";
import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { AppGrid } from "@/components/home/AppGrid";
import { ValueProps } from "@/components/home/ValueProps";
import { Testimonials } from "@/components/home/Testimonials";
import { Footer } from "@/components/home/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-primary selection:text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <AppGrid />
      <ValueProps />
      <Testimonials />
      <Footer />
    </main>
  );
}
