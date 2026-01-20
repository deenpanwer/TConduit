"use client";

import Link from "next/link";
import { legalSections } from "@/lib/legal-data";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scale, ShieldCheck, FileText, Globe, Cookie, Lock } from "lucide-react";
import { motion } from "framer-motion";

// Helper to get an icon based on section title or ID
const getIcon = (title: string, id: string) => {
  if (title.includes("Security") || id.includes("security")) return ShieldCheck;
  if (title.includes("Privacy") || id.includes("privacy")) return Lock;
  if (id.includes("cookie")) return Cookie;
  if (id.includes("residency") || id.includes("transfer")) return Globe;
  if (id.includes("agreement")) return Scale;
  return FileText;
};

export default function LegalLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background font-poppins">
      {/* Hero Section */}
      <div className="bg-background border-b pt-20 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl text-primary mb-6">
                <Scale className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Legal Center
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Transparency is core to our values. Here you can find all the agreements, policies, and terms that govern our relationship with you.
            </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 gap-12">
            {legalSections.map((section, idx) => (
                <motion.div 
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                >
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        {section.title}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.items.map((item: any) => {
                            const Icon = getIcon(section.title, item.id);
                            return (
                                <Card key={item.id} className="flex flex-col hover:shadow-lg transition-shadow border-muted/60">
                                    <CardHeader>
                                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4 text-foreground">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <CardTitle className="text-lg">{item.name}</CardTitle>
                                        <CardDescription className="line-clamp-2 mt-2">
                                            {item.description || "Review the terms and conditions."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter className="mt-auto pt-0">
                                        <Button asChild variant="outline" className="w-full justify-between group">
                                            <Link href={`/legal/${item.id}`}>
                                                Read Policy
                                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </motion.div>
            ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-12 bg-white dark:bg-card">
        <div className="max-w-5xl mx-auto px-6 text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} Trac AI, Inc. All rights reserved.</p>
            <div className="flex justify-center gap-6 mt-4">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <Link href="mailto:legal@trac.ai" className="hover:text-foreground">Contact Legal</Link>
            </div>
        </div>
      </div>
    </div>
  );
}