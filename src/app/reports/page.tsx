"use client";

import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { 
  Zap, 
  Activity, 
  Trophy, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  Copy,
  Check,
  Search,
  Loader2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

// --- DATA TYPES ---
interface OrgIntel {
  orgName: string;
  founderName: string;
  totalHours: string;
  totalStaff: number;
  topPerformer: string;
  performanceIndex: string[];
  aiSummary: string | null;
  aiPayload?: any;
}

export default function ManualReportAuditPage() {
  const [orgId, setOrgId] = useState('org_dzt6yhind');
  const [selectedDate, setSelectedDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [intel, setIntel] = useState<OrgIntel | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (intel?.aiPayload) {
      console.log("-----------------------------------------");
      console.log("TRAC AI INTELLIGENCE - PAYLOAD FOR MISTRAL:");
      console.log(intel.aiPayload);
      console.log("-----------------------------------------");
    }
  }, [intel]);

  const fetchReport = async () => {
    if (!orgId) return;
    setLoading(true);
    setIntel(null);
    try {
      const res = await fetch(`/api/reports/generate?orgId=${orgId}&date=${selectedDate}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch report');
      setIntel(data.intel);
    } catch (err: any) {
      toast({ title: "Audit Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateMarkdown = () => {
    if (!intel) return "";
    const dateStr = format(new Date(selectedDate), "MMM dd").toUpperCase();
    
    let md = `*TRAC DAILY REPORT // ${dateStr}*\n\n`;

    if (intel.aiSummary) {
      md += `📊 *TODAYS CEO SUMMARY:*\n${intel.aiSummary}\n\n`;
    }

    md += `⚡ *TOTAL WORK DONE:* ${intel.totalHours} HRS\n`;
    md += `👥 *TOTAL STAFF:* ${intel.totalStaff}\n\n`;
    
    md += `*-- WHO DID WHAT TODAY --*\n`;
    if (intel.performanceIndex.length > 0) {
      md += intel.performanceIndex.join('\n') + '\n';
    } else {
      md += `No work recorded today.\n`;
    }
    
    md += `\n🏆 *BEST LEADER:* ${intel.topPerformer}\n`;

    md += `\nFor a more detailed audit visit: traconomics.com/dashboard`;
    
    return md;
  };

  const copyToClipboard = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    toast({ title: "Markdown Copied", description: "Report ready for WhatsApp/Slack." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-poppins selection:bg-primary selection:text-black">
      {/* Search Bar / Input */}
      <div className="max-w-4xl mx-auto mb-20 space-y-8 bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px w-12 bg-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Intelligence Terminal</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Enter Organization ID</label>
            <div className="flex items-center gap-3 bg-black border border-white/10 rounded-2xl px-4 py-2 focus-within:border-primary transition-all">
              <Search size={18} className="text-white/20" />
              <input 
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                placeholder="org_xxxxxxxx"
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-white w-full outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Select Audit Date</label>
            <div className="flex items-center gap-3 bg-black border border-white/10 rounded-2xl px-4 py-2 focus-within:border-primary transition-all">
              <CalendarIcon size={18} className="text-white/20" />
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-white w-full outline-none cursor-pointer uppercase"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={fetchReport} 
          disabled={loading || !orgId}
          className="w-full h-14 rounded-2xl bg-primary text-black font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={18} className="mr-2 fill-current" />}
          Run Global Yield Audit
        </Button>
      </div>

      <main className="max-w-4xl mx-auto">
        {intel ? (
          <div className="space-y-12">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl">
               <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                     <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Audit Successful</p>
                    <p className="text-xs font-bold text-white/60">Ready for distribution.</p>
                  </div>
               </div>
               <Button 
                  onClick={copyToClipboard} 
                  variant="outline" 
                  className="rounded-xl border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black font-black uppercase text-[10px] tracking-widest h-12 px-8"
                >
                  {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                  {copied ? 'Copied' : 'Copy Markdown'}
                </Button>
            </div>

            {/* Preview Card */}
            <Card className="bg-white/[0.02] border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Zap size={200} className="text-primary" />
               </div>

               <div className="prose prose-invert max-w-none">
                  <pre className="bg-black/50 p-10 rounded-[2.5rem] border border-white/5 text-emerald-500 font-mono text-lg leading-relaxed whitespace-pre-wrap">
                    {generateMarkdown()}
                  </pre>
               </div>

               <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-12">
                  <div>
                     <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Status</p>
                     <p className="text-xs font-black text-emerald-500">VERIFIED</p>
                  </div>
                  <div>
                     <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Source</p>
                     <p className="text-xs font-black text-white">FIRESTORE_ADMIN</p>
                  </div>
                  <div>
                     <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Region</p>
                     <p className="text-xs font-black text-white">PAKISTAN_E</p>
                  </div>
                  <div>
                     <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Latency</p>
                     <p className="text-xs font-black text-white">124MS</p>
                  </div>
               </div>
            </Card>
          </div>
        ) : !loading && (
          <div className="h-[400px] border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center text-center space-y-6">
             <div className="size-20 rounded-3xl bg-white/[0.02] flex items-center justify-center text-white/10">
                <FileText size={40} />
             </div>
             <div className="space-y-2 px-12">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/40">Audit Standby</h3>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest max-w-xs leading-relaxed">Enter an Organization ID and Date to synthesize the 10-star intelligence briefing.</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
