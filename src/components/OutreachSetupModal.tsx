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
  callMethod: "system" | "google-voice";
  setCallMethod: (val: "system" | "google-voice") => void;
}

export function OutreachSetupModal({
  isOpen,
  onOpenChange,
  emailSubject,
  emailBody,
  callScript,
  callMethod,
  setCallMethod,
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
      <DialogContent className="max-w-md bg-background border rounded-2xl p-5 gap-0">
        <DialogHeader className="pb-3 border-b border-border/40">
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCallMethod("system")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
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
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    callMethod === "google-voice"
                      ? "bg-purple-600 border-purple-600 text-white shadow-sm font-extrabold"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.63-1.09-1.38-1.38-2.22z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google Voice
                </button>
              </div>
              
              <div className="flex flex-col gap-1 text-[9px] text-muted-foreground/80 leading-normal pl-1.5 mt-1 font-semibold">
                {callMethod === "system" ? (
                  <p>• Launches standard system-available telephony client (FaceTime, Skype, or local CRM dialer integration).</p>
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
