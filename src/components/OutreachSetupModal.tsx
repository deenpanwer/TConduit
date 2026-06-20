import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Phone } from "lucide-react";

interface OutreachSetupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  emailSubject: string;
  emailBody: string;
  callScript: string;
  callMethod: "system" | "google-voice" | "justcall" | "ringcentral";
  setCallMethod: (val: "system" | "google-voice" | "justcall" | "ringcentral") => void;
  emailMethod: "gmail" | "outlook" | "yahoo";
  setEmailMethod: (val: "gmail" | "outlook" | "yahoo") => void;
}

export function OutreachSetupModal({
  isOpen,
  onOpenChange,
  emailSubject,
  emailBody,
  callScript,
  callMethod,
  setCallMethod,
  emailMethod,
  setEmailMethod,
}: OutreachSetupModalProps) {
  const [activeTab, setActiveTab] = useState<"email" | "call">("email");

  // Helper to format/render curly bracket tags as pretty inline blocks
  const highlightVariables = (text: string) => {
    if (!text) return "";
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    return escaped.replace(/({[^{}]+})/g, (match) => {
      const label = match.replace(/[{}]/g, "");
      return `<span class="bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded px-1.5 py-0.5 font-black border border-purple-500/20 font-mono text-[9px] uppercase tracking-wider inline-flex items-center mx-0.5 select-none">${label}</span>`;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border rounded-2xl p-6 gap-0 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="pb-4 border-b border-border/40">
          <DialogTitle className="text-sm font-black uppercase tracking-wider text-foreground">
            Outreach Setup
          </DialogTitle>
        </DialogHeader>

        {/* Custom Tab Switcher */}
        <div className="flex border-b border-border/40 mb-4 text-[10px] font-black uppercase tracking-wider select-none shrink-0 mt-3">
          <button
            onClick={() => setActiveTab("email")}
            className={`flex-1 pb-2.5 text-center transition-all ${
              activeTab === "email"
                ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email Outreach
          </button>
          <button
            onClick={() => setActiveTab("call")}
            className={`flex-1 pb-2.5 text-center transition-all ${
              activeTab === "call"
                ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Call Outreach
          </button>
        </div>

        {activeTab === "email" ? (
          <div className="space-y-3.5 text-xs">
            <p className="text-muted-foreground font-semibold leading-relaxed">
              Below is the pre-configured high-conversion email outreach template launched when clicking email buttons on the USA CEO Leads page.
            </p>

            <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-sm">
              <div className="bg-muted/40 border-b p-3 flex flex-col gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-14 uppercase tracking-wider text-[9px] font-black text-muted-foreground/70">To:</span>
                  <span className="text-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded border text-[10px]">lead@company.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-14 uppercase tracking-wider text-[9px] font-black text-muted-foreground/70">Subject:</span>
                  <span 
                    className="text-foreground truncate font-mono bg-muted/60 px-1.5 py-0.5 rounded border flex-1 text-[10px]"
                    dangerouslySetInnerHTML={{ __html: highlightVariables(emailSubject) }}
                  />
                </div>
              </div>
              <div 
                className="p-4 bg-background/50 font-mono leading-relaxed whitespace-pre-wrap select-text text-foreground min-h-[160px] max-h-[220px] overflow-y-auto text-[11px] border-t"
                dangerouslySetInnerHTML={{ __html: highlightVariables(emailBody) }}
              />
            </div>

            {/* Preferred Email Method Selector */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Preferred Email Client</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEmailMethod("gmail")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    emailMethod === "gmail"
                      ? "bg-purple-600 border-purple-600 text-white shadow-sm font-extrabold"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <img src="/gmail.svg" alt="Gmail" className="h-3.5 w-3.5 shrink-0 object-contain" loading="lazy" />
                  Gmail
                </button>
                <button
                  type="button"
                  onClick={() => setEmailMethod("outlook")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    emailMethod === "outlook"
                      ? "bg-purple-600 border-purple-600 text-white shadow-sm font-extrabold"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <img src="/outlook.png" alt="Outlook" className="h-3.5 w-3.5 shrink-0 object-contain" loading="lazy" />
                  Outlook
                </button>
                <button
                  type="button"
                  onClick={() => setEmailMethod("yahoo")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    emailMethod === "yahoo"
                      ? "bg-purple-600 border-purple-600 text-white shadow-sm font-extrabold"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <img src="/yahoo.jpeg" alt="Yahoo Mail" className="h-3.5 w-3.5 shrink-0 object-contain rounded-sm" loading="lazy" />
                  Yahoo Mail
                </button>
              </div>
            </div>

            <div className="p-3 bg-purple-500/[0.03] border border-purple-500/10 rounded-xl">
              <p className="text-[10px] text-muted-foreground leading-normal font-medium">
                <strong>Conversion Tip</strong>: This template relies on a low-friction inquiry, allowing prospects to easily reply. Dynamic tags are merged automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 text-xs">
            <p className="text-muted-foreground font-semibold leading-relaxed">
              Below is the research-backed, high-converting cold call outreach script.
            </p>

            <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-sm">
              <div className="bg-muted/40 border-b p-3 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Sales Cold Call Framework</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[8px] tracking-widest uppercase">
                  Top Converting
                </span>
              </div>
              <div className="p-4 bg-background/50 font-sans leading-relaxed text-foreground text-[11px] space-y-2.5 max-h-[220px] overflow-y-auto select-text">
                <p>Hello <strong className="text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded font-mono font-black text-[10px] uppercase">John</strong>,</p>
                
                <p>I know I'm calling you completely out of the blue. Do you have 30 seconds for me to tell you why I called, and you can decide if it makes sense to keep talking?</p>
                
                <p className="text-muted-foreground/80 italic pl-2.5 border-l-2 border-border font-semibold text-[10px]">(Wait for agreement)</p>
                
                <p>Great. I noticed that <strong className="text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded font-mono font-black text-[10px] uppercase">Acme Corp</strong> is active in <strong className="text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded font-mono font-black text-[10px] uppercase">Software Development</strong>. We help organizations in your sector optimize workflow efficiency.</p>
                
                <p>How are you currently handling that bottleneck, and are you seeing the results you expected, or is that becoming a challenge for your team?</p>
                
                <p className="text-muted-foreground/80 italic pl-2.5 border-l-2 border-border font-semibold text-[10px]">(Listen to response)</p>
                
                <p>I'm not suggesting we make any changes today, but I'd love to share how peers in your industry are benchmarking this. Do you have 15 minutes later this week to compare notes?</p>
              </div>
            </div>

            <div className="p-3 bg-purple-500/[0.03] border border-purple-500/10 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-purple-600 uppercase tracking-wider">
                <span>Harvard & Industry Standard Framework</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal font-medium">
                HBS case studies and sales research confirm that a permission-based pattern-interrupt opener combined with low-pressure discovery questions yields up to a <strong>30% increase</strong> in call-to-meeting conversion rates.
              </p>
            </div>

            {/* Preferred Call Method Selector */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Preferred Call Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCallMethod("system")}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    callMethod === "system"
                      ? "bg-purple-600 border-purple-600 text-white shadow-sm font-extrabold"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Phone size={12} className="shrink-0" />
                  System Default
                </button>
                <button
                  type="button"
                  onClick={() => setCallMethod("google-voice")}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    callMethod === "google-voice"
                      ? "bg-purple-600 border-purple-600 text-white shadow-sm font-extrabold"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <img src="/google-voice.png" alt="Google Voice" className="h-3.5 w-3.5 shrink-0 object-contain" loading="lazy" />
                  Google Voice
                </button>
                <button
                  type="button"
                  onClick={() => setCallMethod("justcall")}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    callMethod === "justcall"
                      ? "bg-purple-600 border-purple-600 text-white shadow-sm font-extrabold"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <img src="/just-call.jpeg" alt="JustCall" className="h-3.5 w-3.5 shrink-0 object-contain rounded-sm" loading="lazy" />
                  JustCall
                </button>
                <button
                  type="button"
                  onClick={() => setCallMethod("ringcentral")}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    callMethod === "ringcentral"
                      ? "bg-purple-600 border-purple-600 text-white shadow-sm font-extrabold"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <img src="/ring-central.png" alt="RingCentral" className="h-3.5 w-3.5 shrink-0 object-contain" loading="lazy" />
                  RingCentral
                </button>
              </div>
              
              <div className="flex flex-col gap-1 text-[9px] text-muted-foreground/80 leading-normal pl-1.5 mt-1 font-semibold">
                {callMethod === "system" ? (
                  <p>• Launches standard system-available telephony client (FaceTime, Skype, or local CRM dialer integration).</p>
                ) : callMethod === "justcall" ? (
                  <p>• JustCall will open in your browser automatically with the lead's number populated.</p>
                ) : callMethod === "ringcentral" ? (
                  <>
                    <p className="text-purple-600 dark:text-purple-400 font-extrabold">• VPN Required: Always open inside a US VPN if dialing from outside North America region.</p>
                    <p>• RingCentral will open with the lead's number populated.</p>
                  </>
                ) : (
                  <>
                    <p className="text-purple-600 dark:text-purple-400 font-extrabold">• VPN Required: Always open inside a US VPN if dialing from outside North America region.</p>
                    <p>• Google Voice will open in your browser automatically with the lead's number populated.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-border/40 mt-4 shrink-0">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 rounded-lg"
          >
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
