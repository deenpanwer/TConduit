"use client";

import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { rtdb } from "@/lib/firebase";
import { ref, update, onValue } from "firebase/database";
import { 
  Smartphone, 
  Zap, 
  Loader2, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Vibrate,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";

export default function RemoteScannerPage() {
  const { orgId, syncId } = useParams();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "active" | "error">("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!orgId || !syncId) return;

    const bridgeRef = ref(rtdb, `sync_bridge/${orgId}/${syncId}`);
    
    // Connect to the bridge
    update(bridgeRef, {
      status: "connected",
      deviceName: navigator.userAgent.split(')')[0].split('(')[1] || "Mobile Device",
      timestamp: Date.now()
    }).then(() => {
      setStatus("active");
    }).catch(err => {
      setStatus("error");
      setErrorMsg("Failed to connect to PC session.");
    });

    // Handle session end from PC
    const unsub = onValue(bridgeRef, (snapshot) => {
      if (!snapshot.exists()) {
        setStatus("error");
        setErrorMsg("Session terminated by PC.");
        if (scannerRef.current) {
          scannerRef.current.stop().catch(() => {});
        }
      }
    });

    return () => {
      unsub();
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [orgId, syncId]);

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("reader", { 
         formatsToSupport: [ 
           Html5QrcodeSupportedFormats.QR_CODE, 
           Html5QrcodeSupportedFormats.EAN_13, 
           Html5QrcodeSupportedFormats.CODE_128 
         ],
         verbose: false 
      });
      scannerRef.current = html5QrCode;
      setScanning(true);

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleScan(decodedText);
        },
        (errorMessage) => {
          // Failure callback, usually noise
        }
      );
    } catch (err) {
      console.error(err);
      setErrorMsg("Camera access denied or unavailable.");
      setStatus("error");
      setScanning(false);
    }
  };

  const handleScan = (sku: string) => {
    if (!sku || lastScanned === sku) return;

    setLastScanned(sku);
    
    // Trigger Haptic Feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }

    // Update RTDB with the SKU
    const bridgeRef = ref(rtdb, `sync_bridge/${orgId}/${syncId}`);
    update(bridgeRef, {
      sku: sku,
      timestamp: Date.now()
    });

    // Reset last scanned after 2 seconds to allow re-scanning same item
    setTimeout(() => setLastScanned(null), 2000);
  };

  if (status === "error") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="h-20 w-20 rounded-3xl bg-red-500/20 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Connection Lost</h1>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">{errorMsg}</p>
        <Button 
          variant="outline" 
          className="w-full h-12 border-slate-800 text-white font-black uppercase tracking-widest"
          onClick={() => router.replace('/pos/checkout')}
        >
          Return to POS
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col text-white font-sans selection:bg-primary selection:text-white">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/10 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Remote Lens</h1>
            <p className="text-[10px] font-bold text-primary tracking-widest uppercase mt-1">Sync ID: {syncId}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Live Sync</span>
          </div>
        </div>
      </div>

      {/* Camera View Area */}
      <div className="flex-grow relative flex flex-col overflow-hidden bg-slate-900">
        {!scanning && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12 text-center bg-slate-950/80 backdrop-blur-md">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/30 animate-pulse">
              <Camera className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Ready to Scan</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
              Scan product barcodes to automatically add them to the PC checkout screen.
            </p>
            <Button 
              size="lg" 
              className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-[0.2em] shadow-2xl"
              onClick={startScanner}
            >
              Enable Camera
            </Button>
          </div>
        )}

        <div id="reader" className="w-full h-full object-cover" />

        {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-primary/50 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                    
                    {/* Scanning Line Animation */}
                    <div className="absolute left-0 right-0 h-[2px] bg-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-scan" style={{ top: '50%' }} />
                </div>
            </div>
        )}
      </div>

      {/* Footer / Status */}
      <div className="p-8 bg-slate-950 border-t border-white/10">
        <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center",
                lastScanned ? "bg-green-500/20 text-green-500" : "bg-slate-800 text-slate-500"
            )}>
              {lastScanned ? <CheckCircle2 className="h-6 w-6" /> : <Loader2 className={cn("h-6 w-6", scanning && "animate-spin")} />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</p>
              <p className="text-xs font-black uppercase tracking-tighter">
                {lastScanned ? `Synced: ${lastScanned}` : (scanning ? "Searching for barcode..." : "Camera inactive")}
              </p>
            </div>
          </div>
          {lastScanned && (
            <div className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
          )}
        </div>
        
        <p className="text-center text-[8px] font-black uppercase tracking-[0.3em] text-slate-700 mt-6">
          TRAC AI • Enterprise Remote Control Protocol
        </p>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 10%; opacity: 0.2; }
          50% { top: 90%; opacity: 1; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        #reader {
           border: none !important;
        }
        #reader video {
            width: 100vw !important;
            height: 100vh !important;
            object-fit: cover !important;
        }
        #reader__dashboard_section_csr, 
        #reader__status_span, 
        #reader button { 
           display: none !important; 
        }
      `}</style>
    </div>
  );
}
