"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const PricingNavbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border/10">
      <Link href="/dashboard">
        <h1 className="font-poppins font-bold text-2xl text-foreground tracking-tighter">
          TRAC AI
        </h1>
      </Link>
      
      <div className="flex items-center gap-4">
        <Link href="/ems/login">
          <Button variant="ghost" className="font-bold uppercase text-[10px] tracking-widest hover:bg-primary/5">
            Login
          </Button>
        </Link>
        <Link href="/ems/signup">
          <Button className="rounded-none font-black uppercase text-[10px] tracking-widest border-[3px] border-black dark:border-white hover:bg-primary/5 transition-all active:scale-95 h-10 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
            Start Here
          </Button>
        </Link>
      </div>
    </nav>
  );
};
