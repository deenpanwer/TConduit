"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Zap, CheckCircle2, Loader2, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface RemoteScannerLinkProps {
  syncId: string | null;
  isConnected: boolean;
  onRefresh?: () => void;
}

export function RemoteScannerLink({ syncId, isConnected, onRefresh }: RemoteScannerLinkProps) {
  const { userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const orgId = (userData as any)?.orgId || (userData as any)?.ownedOrgId || "default";

  const scannerUrl = syncId ? `${window.location.origin}/pos/remote-scan/${orgId}/${syncId}` : "";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "h-11 gap-2 border-primary/20 transition-all",
            isConnected ? "bg-green-500/10 border-green-500/30 text-green-600" : "bg-primary/5 hover:bg-primary/10"
          )}
        >
          <Smartphone className={cn("h-4 w-4", isConnected ? "text-green-600" : "text-primary")} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isConnected ? "Scanner Linked" : "Remote Scan"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] border-0 shadow-2xl p-0 overflow-hidden bg-card rounded-3xl">
        <div className="bg-primary p-8 text-white relative">
          <div className="absolute top-4 right-4 bg-white/10 p-2 rounded-full cursor-pointer hover:bg-white/20 transition-colors" onClick={() => setIsOpen(false)}>
            <X size={16} />
          </div>
          <DialogHeader className="p-0 space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">
                Mobile Link
              </DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/70 font-bold uppercase text-[10px] tracking-widest text-left">
              Turn any smartphone into a scanner
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 flex flex-col items-center gap-6 text-center">
          <div className="relative p-6 bg-white rounded-3xl shadow-xl ring-1 ring-border group transition-all duration-500 hover:scale-[1.02]">
            {syncId ? (
              <QRCodeSVG 
                value={scannerUrl} 
                size={200} 
                level="H" 
                includeMargin={false}
                imageSettings={{
                  src: "/logo.svg",
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            ) : (
              <div className="h-[200px] w-[200px] flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
              </div>
            )}
            
            {isConnected && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 rounded-3xl">
                <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
                <p className="text-sm font-black uppercase tracking-widest text-green-600 mt-2">Active Link</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 px-4 leading-relaxed">
                  Your phone is now acting as a scanner.<br/>Closing this won't disconnect it.
                </p>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-4 text-[8px] font-black uppercase tracking-widest text-red-500"
                    onClick={() => { if(onRefresh) onRefresh(); }}
                >
                    <RefreshCw className="h-2 w-2 mr-1" /> Reset Connection
                </Button>
              </div>
            )}
          </div>

          <div className="w-full space-y-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sync Code</span>
              <span className="text-3xl font-black tracking-[0.3em] text-primary">{syncId || "------"}</span>
            </div>

            <div className="bg-muted/50 p-4 rounded-2xl flex items-center gap-4 border border-border/50 text-left">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Zero-Latency Bridge</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">
                    {isConnected ? "Linked in background. Scan now!" : "Scan QR with phone camera to start pairing"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

