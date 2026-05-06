"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Fingerprint, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AuthGuardProps {
  isAuthorized: boolean;
  onAuthenticated: () => void;
  children: React.ReactNode;
}

export function AuthGuard({ isAuthorized, onAuthenticated, children }: AuthGuardProps) {
  const [passInput, setPassInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  // SHA-256 Hash of your 8-word password
  const AUTH_HASH = "a42f3ed947bf56fd88344ff797856507cebd631d73496c16a8be54c6036165b6";

  const checkPassword = async () => {
    setIsChecking(true);
    try {
      const msgUint8 = new TextEncoder().encode(passInput.trim().toLowerCase());
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (hashHex === AUTH_HASH) {
        onAuthenticated();
        toast.success("Access Granted. Welcome back.");
      } else {
        toast.error("Invalid Security Key");
        setPassInput("");
      }
    } catch (err) {
      toast.error("Security Engine Error");
    } finally {
      setIsChecking(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="size-20 rounded-[2rem] bg-white/10 border-2 border-white/20 flex items-center justify-center mx-auto mb-8 group hover:border-emerald-500/50 transition-all duration-700">
               <ShieldAlert className="size-10 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">Security Protocol</h1>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.4em]">Level 4 Internal Clearance Required</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="relative group">
              <Fingerprint className="absolute left-6 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-emerald-500 transition-colors" size={24} />
              <Input 
                type="password"
                placeholder="INPUT 8-WORD SECURITY PHRASE..." 
                autoFocus
                className="h-20 pl-16 rounded-[2.5rem] border-4 border-white/30 bg-white/10 text-emerald-500 placeholder:text-white/60 focus-visible:ring-0 focus-visible:border-emerald-500 focus-visible:bg-emerald-500/10 transition-all font-black text-xl tracking-[0.2em] uppercase shadow-2xl"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkPassword()}
              />
            </div>
            
            <Button 
              onClick={checkPassword}
              disabled={isChecking || passInput.length < 5}
              className="w-full h-20 rounded-[2.5rem] bg-white text-black hover:bg-emerald-500 hover:text-white transition-all font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
            >
              {isChecking ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <Zap size={20} />
                  Authenticate Access
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 pt-8">
               <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">Encrypted Session Active</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
