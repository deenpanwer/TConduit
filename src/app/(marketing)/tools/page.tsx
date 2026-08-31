"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { Calculator, ArrowRight, ShieldAlert, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ToolsLandingPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-[#7B61FF] selection:text-white overflow-x-hidden">
            <Navbar />

            {/* Background elements */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/10 blur-[120px] rounded-full opacity-60" />
            </div>

            <div className="container mx-auto px-6 pt-40 pb-32 max-w-7xl relative z-10">
                {/* Header */}
                <div className="max-w-3xl mb-16 space-y-6">
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none uppercase italic">
                        Business <br className="hidden md:block" />
                        <span className="text-primary">Operations Tools</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-xl">
                        Free calculators, estimation engines, and operations generators to help you benchmark performance, plug revenue leaks, and streamline billing—100% free with no account required.
                    </p>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Tool Card 1: Productivity Loss Calculator */}
                    <Link href="/tools/calculator" className="group">
                        <Card className="p-8 h-full rounded-[2rem] border border-black/5 dark:border-white/10 bg-white dark:bg-[#0a0a0a] shadow-lg hover:shadow-2xl hover:border-primary/20 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="space-y-6 relative z-10">
                                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                                    <Calculator size={28} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black uppercase italic tracking-tight">Productivity Loss Calculator</h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Calculate the exact monthly, quarterly, and annual revenue leaking out of your business due to visibility bottlenecks and workforce fragmentation.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-primary font-black uppercase tracking-widest text-[11px] relative z-10">
                                <span>Try Calculator</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                            </div>
                        </Card>
                    </Link>

                    {/* Tool Card 2: Free Invoice Maker */}
                    <Link href="/tools/invoice-maker" className="group">
                        <Card className="p-8 h-full rounded-[2rem] border border-black/5 dark:border-white/10 bg-white dark:bg-[#0a0a0a] shadow-lg hover:shadow-2xl hover:border-blue-500/20 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="space-y-6 relative z-10">
                                <div className="size-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                                    <FileText size={28} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black uppercase italic tracking-tight">Free Invoice Maker</h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Generate, customize, and export high-resolution A4 PDF invoices instantly with custom branding logo upload, auto multi-page splitting, and digital signatures.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-blue-600 font-black uppercase tracking-widest text-[11px] relative z-10">
                                <span>Create Invoice</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>

            <Footer />
        </main>
    );
}
