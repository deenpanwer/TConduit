"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    quote: "Switching to Trac was the best decision we made for our sales team. We replaced three different tools and saved thousands a month.",
    author: "Sarah Chen",
    role: "Head of Operations",
    company: "NextGen Media",
    avatar: "/diary/apple-logo.png"
  },
  {
    quote: "The hiring tool is like magic. We found two top-tier engineers in less than a week using the AI search.",
    author: "Marcus Thorne",
    role: "CEO",
    company: "Future Lab",
    avatar: "/diary/linux.png"
  },
  {
    quote: "Everything just works. No more integration headaches. No more manual data entry. Just pure productivity.",
    author: "Alex Rivera",
    role: "CTO",
    company: "DataStream",
    avatar: "/diary/windows.png"
  }
];

export function Testimonials() {
  return (
    <section className="py-40 bg-white dark:bg-black border-y border-black/5 dark:border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-24">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8">
             <Sparkles size={14} />
             <span className="text-xs font-black uppercase tracking-widest">Built for professionals</span>
           </div>
           <h2 className="text-4xl md:text-6xl font-black font-poppins tracking-tighter uppercase italic">Trusted by world-class teams.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {TESTIMONIALS.map((testimonial, index) => (
             <motion.div
               key={testimonial.author}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: index * 0.1 }}
               className="group flex flex-col p-10 rounded-[3rem] bg-[#f5f5f7] dark:bg-[#111] border border-black/5 dark:border-white/10 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 hover:-translate-y-2"
             >
               <Quote className="size-12 text-primary/20 mb-8 group-hover:text-primary transition-colors" />
               <p className="text-xl font-medium leading-relaxed mb-12">
                 "{testimonial.quote}"
               </p>
               <div className="mt-auto flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-white dark:bg-black flex items-center justify-center border border-black/5 dark:border-white/10 overflow-hidden shadow-lg">
                    <img src={testimonial.avatar} alt={testimonial.author} className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <div className="font-bold text-sm uppercase tracking-widest">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground font-medium">{testimonial.role} at {testimonial.company}</div>
                  </div>
               </div>
             </motion.div>
           ))}
        </div>
      </div>
    </section>
  );
}
