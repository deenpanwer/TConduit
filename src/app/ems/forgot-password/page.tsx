"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
      toast({ 
        title: "Reset link sent", 
        description: "Check your email for instructions to reset your password." 
      });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden font-poppins">
      <div className="absolute inset-0 lg:relative lg:w-1/2">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=2000')",
          }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] lg:bg-black/20" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10 lg:bg-background lg:dark:bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card/80 backdrop-blur-md lg:bg-card p-8 rounded-[2.5rem] shadow-2xl border border-border/50"
        >
          <div className="mb-8">
            <Link href="/ems/login" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={16} className="mr-2" />
              Back to login
            </Link>
          </div>

          <div className="flex flex-col space-y-2 text-center mb-10">
            <div className="flex justify-center mb-6">
               <img src="/logo.svg" alt="Logo" className="w-14 h-14 dark:invert" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {submitted 
                ? "Check your inbox for further instructions" 
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider ml-1">Email Address</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com" 
                    className="bg-background/50 border-border h-14 rounded-2xl px-5 pl-12"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                </div>
              </div>
              <Button disabled={loading || !email} type="submit" className="w-full h-14 rounded-2xl font-bold uppercase tracking-wide shadow-xl shadow-primary/20">
                {loading ? "Sending link..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-primary" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                We've sent a password reset link to <span className="text-foreground font-bold">{email}</span>. Please check your email.
              </p>
              <Button asChild variant="outline" className="w-full h-14 rounded-2xl font-bold uppercase tracking-wide">
                <Link href="/ems/login">Return to login</Link>
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
