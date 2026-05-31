"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, ArrowRight, CheckCircle2, 
  BookOpen, Star, Loader2 
} from "lucide-react";

export default function TEIReportPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("form-top")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          company: formData.company,
          subject: "Independent TEI Study Download Request",
          message: `User requested a direct download of the Veritas Independent Consulting Total Economic Impact™ of TRAC AI study. User details: ${formData.firstName} ${formData.lastName}, Company: ${formData.company}.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setSuccess(true);

      // Trigger automatic PDF simulation download
      const link = document.createElement("a");
      link.href = "#";
      link.setAttribute("download", "Total_Economic_Impact_of_TRAC_AI.pdf");
      // In a real production system, this would point to a public PDF asset.
      console.log("Mock PDF download triggered for the user.");

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar />

      {/* Hero Header Spacer */}
      <div className="h-24 bg-white" />

      {/* SECTION 1: HERO & FORM */}
      <section 
        id="form-top" 
        className="py-20 lg:py-28 relative overflow-hidden select-none border-b border-zinc-100"
        style={{
          background: "radial-gradient(circle at 0% 50%, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0) 55%), radial-gradient(circle at 100% 50%, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 55%), #ffffff"
        }}
      >

        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column: Cost Savings Copy & Veritas Branding */}
            <div className="lg:col-span-7 text-left space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.25em] block">
                  INDEPENDENT STUDY
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.1] font-poppins">
                  Independent Study: TRAC AI drove <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 font-black">384% ROI</span>
                </h1>
              </div>

              <p className="text-base sm:text-lg font-medium text-zinc-500 leading-relaxed max-w-2xl">
                Discover how TRAC AI's Converged AI Workspace increased revenue, consolidated tools, and saved thousands of hours by automating workflows and replacing legacy subscriptions.
              </p>

              <div className="bg-zinc-50 border border-zinc-200/60 p-6 rounded-2xl max-w-xl">
                <p className="text-xs sm:text-sm font-bold text-zinc-600 leading-relaxed italic">
                  "Get the exclusive 20-page economic impact study conducted by Veritas Independent Consulting: The Total Economic Impact™ of TRAC AI."
                </p>
              </div>

              {/* Veritas Logo Mock */}
              <div className="flex items-center gap-3 opacity-70">
                <div className="size-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-black text-xs">
                  V
                </div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-900">
                  Veritas Independent Consulting
                </span>
              </div>
            </div>

            {/* Right Column: Premium Form Card */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-8 sm:p-10 shadow-2xl relative">
                
                {success ? (
                  <div className="text-center py-10 space-y-6">
                    <div className="size-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-500 animate-bounce">
                      <CheckCircle2 size={36} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">
                        Request Confirmed
                      </h3>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider leading-relaxed">
                        Your study download has started successfully! A copy of the Veritas Consulting 20-page report has been sent to your email.
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); alert("Preparing study files... Your download is complete."); }}
                        className="inline-flex h-10 items-center justify-center px-6 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all active:scale-95"
                      >
                        Download Report
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1 text-left">
                      <h3 className="text-lg font-black uppercase text-zinc-800 tracking-wider">
                        Download the Study
                      </h3>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                        Enter your business details below
                      </p>
                    </div>

                    {errorMsg && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold text-left">
                        {errorMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-wider text-zinc-500">First Name *</Label>
                        <Input 
                          id="firstName" 
                          name="firstName" 
                          required 
                          placeholder="Jane"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="h-11 rounded-xl border-zinc-200/80 focus-visible:ring-indigo-600"
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Last Name *</Label>
                        <Input 
                          id="lastName" 
                          name="lastName" 
                          required 
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="h-11 rounded-xl border-zinc-200/80 focus-visible:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Work Email *</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        required 
                        placeholder="jane@company.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="h-11 rounded-xl border-zinc-200/80 focus-visible:ring-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Company *</Label>
                      <Input 
                        id="company" 
                        name="company" 
                        required 
                        placeholder="Acme Corp"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="h-11 rounded-xl border-zinc-200/80 focus-visible:ring-indigo-600"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-12 rounded-xl bg-black hover:bg-zinc-800 text-white font-extrabold uppercase tracking-widest text-xs transition-colors"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        "Download Now"
                      )}
                    </Button>

                    <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider leading-relaxed text-center">
                      This site is protected by reCAPTCHA. By submitting, I agree to TRAC AI's Privacy Policy.
                    </p>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: KEY FINDINGS (4 GRADIENT CARDS) */}
      <section className="py-24 bg-white text-zinc-900 relative border-b border-zinc-100 select-none">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: 4 Premium Gradient Cards */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Card 1: ROI */}
              <div className="bg-gradient-to-br from-[#ff007a] to-[#9600ff] p-8 rounded-3xl min-h-[180px] flex flex-col justify-between text-white shadow-xl hover:scale-[1.02] transition-transform duration-300">
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight leading-none font-poppins">
                  384%
                </h3>
                <span className="text-xs font-black uppercase tracking-widest block opacity-90 mt-6">
                  ROI
                </span>
              </div>

              {/* Card 2: Revenue */}
              <div className="bg-gradient-to-br from-[#00c6ff] to-[#0072ff] p-8 rounded-3xl min-h-[180px] flex flex-col justify-between text-white shadow-xl hover:scale-[1.02] transition-transform duration-300">
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight leading-none font-poppins">
                  $3.9M
                </h3>
                <span className="text-xs font-black uppercase tracking-widest block opacity-90 mt-6">
                  Revenue increase
                </span>
              </div>

              {/* Card 3: Hours */}
              <div className="bg-gradient-to-br from-[#f9d423] to-[#ff4e50] p-8 rounded-3xl min-h-[180px] flex flex-col justify-between text-white shadow-xl hover:scale-[1.02] transition-transform duration-300">
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight leading-none font-poppins">
                  92,400
                </h3>
                <span className="text-xs font-black uppercase tracking-widest block opacity-90 mt-6">
                  Hours saved
                </span>
              </div>

              {/* Card 4: Payback */}
              <div className="bg-gradient-to-br from-[#3a0088] to-[#16002c] p-8 rounded-3xl min-h-[180px] flex flex-col justify-between text-white shadow-xl hover:scale-[1.02] transition-transform duration-300">
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight leading-none font-poppins">
                  &lt;6mo
                </h3>
                <span className="text-xs font-black uppercase tracking-widest block opacity-90 mt-6">
                  Payback
                </span>
              </div>

            </div>

            {/* Right Column: Key Findings Copy */}
            <div className="space-y-6 text-left">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest block">
                ROI UNLOCKED
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight uppercase font-poppins">
                Key findings
              </h2>
              <p className="text-base font-semibold text-zinc-500 uppercase tracking-wide leading-relaxed">
                Organizations interviewed by Veritas Consulting reported significant operational results:
              </p>

              <ul className="space-y-4 pt-2">
                <li className="flex items-start gap-3">
                  <span className="size-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold text-zinc-600 uppercase tracking-wider leading-relaxed">
                    Over three years, TRAC AI's economic return was nearly <strong className="text-zinc-950 font-black">4x</strong>.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="size-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold text-zinc-600 uppercase tracking-wider leading-relaxed">
                    Incremental team integration drove <strong className="text-zinc-950 font-black">$3.9M</strong> in business revenue.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="size-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold text-zinc-600 uppercase tracking-wider leading-relaxed">
                    Productivity recapture from hours saved drove <strong className="text-zinc-950 font-black">$2.8M</strong> in value.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="size-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold text-zinc-600 uppercase tracking-wider leading-relaxed">
                    The break-even point was reached in less than <strong className="text-zinc-950 font-black">six months</strong>.
                  </p>
                </li>
              </ul>

              <div className="pt-4">
                <a 
                  href="#form-top" 
                  onClick={handleScrollToForm}
                  className="inline-flex h-10 items-center justify-center px-5 rounded-lg bg-[#f3f3f5] hover:bg-[#e4e4e7] text-zinc-800 font-bold text-xs transition-all active:scale-95 shadow-sm"
                >
                  Get the study
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: WHAT CUSTOMERS ARE SAYING */}
      <section className="py-24 bg-zinc-50 text-zinc-900 border-b border-zinc-100 select-none">
        <div className="container mx-auto px-6 max-w-5xl text-center space-y-8">
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest block font-poppins">
            WHAT CUSTOMERS ARE SAYING
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight uppercase leading-tight font-poppins">
            Real organizations, real impact
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <blockquote className="text-base sm:text-xl font-medium text-zinc-600 leading-relaxed italic">
              "The glue of what we do is workflow management, and the glue of what every organization does is workflow management. I see now the opportunity goes through sales, legal, product, engineering, and commercial. It's all one workflow in one tool with everybody looking at the same thing. We could not achieve these results without TRAC AI."
            </blockquote>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
              — CTO and Managing Director, Gaming Company
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: BOOK MOCKUP DETAILS */}
      <section className="py-24 bg-white text-zinc-900 select-none">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column: Detail Description */}
            <div className="lg:col-span-7 text-left space-y-6">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest block">
                DOWNLOAD NOW
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 uppercase leading-none font-poppins">
                Read the full Veritas study
              </h2>
              
              <div className="space-y-4 text-zinc-500 font-medium leading-relaxed">
                <p className="text-xs sm:text-sm uppercase tracking-wide">
                  Download the complete Veritas Total Economic Impact™ study and discover the cost savings and business benefits enabled by TRAC AI.
                </p>
                <p className="text-xs sm:text-sm uppercase tracking-wide">
                  The complete 20-page study includes methodology, detailed financial analysis, and customer interview insights.
                </p>
                <p className="text-xs sm:text-sm uppercase tracking-wide">
                  Results based on Veritas's composite organization model. Individual results may vary.
                </p>
              </div>

              <div className="pt-4">
                <a 
                  href="#form-top" 
                  onClick={handleScrollToForm}
                  className="inline-flex h-10 items-center justify-center px-5 rounded-lg bg-[#f3f3f5] hover:bg-[#e4e4e7] text-zinc-800 font-bold text-xs transition-all active:scale-95 shadow-sm"
                >
                  Get the study
                </a>
              </div>
            </div>

            {/* Right Column: Beautiful CSS 3D Book Mockup */}
            <div className="lg:col-span-5 flex justify-center items-center">
              
              {/* CSS 3D Book Visual Wrapper */}
              <div className="perspective-container p-12">
                <style>{`
                  .perspective-container {
                    perspective: 1000px;
                  }
                  .book-3d {
                    width: 200px;
                    height: 270px;
                    position: relative;
                    transform-style: preserve-3d;
                    transform: rotateY(-20deg) rotateX(10deg);
                    transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                  }
                  .book-3d:hover {
                    transform: rotateY(-5deg) rotateX(5deg) scale(1.03);
                  }
                  .book-cover {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, #0e0e11 0%, #1c1b22 100%);
                    border-radius: 4px 12px 12px 4px;
                    box-shadow: 15px 15px 30px rgba(0, 0, 0, 0.3);
                    z-index: 5;
                    transform: translateZ(10px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    flex-col: justify-between;
                    padding: 24px;
                    text-align: left;
                  }
                  .book-pages {
                    position: absolute;
                    top: 5px;
                    bottom: 5px;
                    right: -8px;
                    width: 15px;
                    background: linear-gradient(90deg, #f0f0f0 0%, #ffffff 100%);
                    border-radius: 0 4px 4px 0;
                    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.15);
                    z-index: 4;
                    transform: rotateY(90deg) translateZ(192px);
                  }
                  .book-spine {
                    position: absolute;
                    inset-y: 0;
                    left: -8px;
                    width: 16px;
                    background: #08080a;
                    border-radius: 4px 0 0 4px;
                    z-index: 6;
                    transform: rotateY(-90deg) translateZ(8px);
                  }
                `}</style>

                {/* 3D Book Grid */}
                <div className="book-3d">
                  
                  {/* Front Cover */}
                  <div className="book-cover flex flex-col justify-between text-white">
                    {/* Ribbon header */}
                    <div className="space-y-1.5">
                      <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" className="size-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                          <polygon points="12 2 2 22 22 22" />
                        </svg>
                      </div>
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-400 block pt-1">
                        Veritas Consulting
                      </span>
                    </div>

                    {/* Book Title */}
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold tracking-tight font-poppins uppercase leading-snug">
                        Total Economic Impact™ of TRAC AI
                      </h4>
                      <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                        Cost Savings & Business Benefits Enabled by a Converged Work System
                      </p>
                    </div>

                    {/* Report Footnote */}
                    <div className="border-t border-white/10 pt-3 flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-zinc-500">
                      <span>2026 EDITION</span>
                      <span>STUDY</span>
                    </div>
                  </div>

                  {/* Spinal element */}
                  <div className="book-spine" />

                  {/* Inside Pages representation */}
                  <div className="book-pages" />

                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
