"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Building2, Send, CheckCircle2, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Full page confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });

      setIsSubmitted(true);
      toast.success("Message sent successfully!");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="pt-32 pb-24 md:pb-32 bg-[#f5f5f7] dark:bg-[#0a0a0a] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Text Content */}
          <div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-8">
              Let's talk about <br />
              <span className="text-primary">your business.</span>
            </h2>
            <div className="space-y-6 text-xl text-muted-foreground font-medium max-w-lg mb-12 leading-relaxed">
              <p>Most remote teams look productive until a client leaves, a deadline breaks, or a key hire quits. By then the damage is done.</p>
              <p>Trac AI shows you exactly what's moving, what's stuck, and who's responsible — in real time, without micromanaging anyone.</p>
              <p>Your best people get recognized. Problems surface in days, not months. You stop running your company on status updates and gut feel.</p>
            </div>
            <div className="pt-2">
              <a 
                href="https://calendly.com/kaayfkhan/discovery-call"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-black text-sm uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
              >
                Or book a direct call on Calendly &rarr;
              </a>
            </div>
          </div>

          {/* Form Card */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-black p-8 md:p-12 rounded-[3rem] shadow-2xl border border-black/5 dark:border-white/10 relative overflow-hidden"
            >
              {isSubmitted ? (
                <div className="py-20 flex flex-col items-center text-center">
                  <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-8 text-emerald-500">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tight mb-4">Message Received</h3>
                  <p className="text-muted-foreground font-medium text-lg max-w-xs">
                    Thank you for reaching out. We've received your inquiry and will be in touch shortly.
                  </p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="mt-10 font-black text-xs uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 text-muted-foreground">Full Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] dark:bg-[#111] border-2 border-transparent focus:border-primary/20 outline-none transition-all font-medium"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 text-muted-foreground">Work Email</label>
                      <input
                        type="text"
                        placeholder="john@company.com"
                        className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] dark:bg-[#111] border-2 border-transparent focus:border-primary/20 outline-none transition-all font-medium"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 text-muted-foreground">Company</label>
                      <input
                        type="text"
                        placeholder="Organization Name"
                        className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] dark:bg-[#111] border-2 border-transparent focus:border-primary/20 outline-none transition-all font-medium"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 text-muted-foreground">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] dark:bg-[#111] border-2 border-transparent focus:border-primary/20 outline-none transition-all font-medium"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 text-muted-foreground">How can we help?</label>
                    <textarea
                      rows={4}
                      placeholder="Tell us a little about what you're looking for..."
                      className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f7] dark:bg-[#111] border-2 border-transparent focus:border-primary/20 outline-none transition-all font-medium resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <button
                    disabled={isSubmitting}
                    className={cn(
                      "w-full py-5 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                      "group relative overflow-hidden"
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        Send Message
                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Accent dot */}
            <div className="absolute -bottom-10 -right-10 size-40 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
