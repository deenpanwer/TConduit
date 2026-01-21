"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
    CheckCircle2, FileText, Download, Upload, ShieldCheck, 
    ExternalLink, Package, Send, MoreHorizontal, FileSignature,
    CheckCircle, PartyPopper, Calendar, MessageSquare,
    Activity, History, Info, ArrowRight,
    FileUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HiringData } from "../HiringModal";
import { useToast } from "@/hooks/use-toast";

export type DocStatus = "pending" | "ready" | "sent";

export interface DocItem {
  id: string;
  name: string;
  description: string;
  status: DocStatus;
  type: "contract" | "compliance" | "tax";
}

interface OnboardingTabProps {
  candidateName: string;
  hiringData: HiringData;
  onBack: () => void;
  isSent: boolean;
  onSend: () => void;
  docs: DocItem[];
  onMarkReady: (id: string) => void;
  onMarkAllReady: () => void;
  onPreviewDoc: (doc: DocItem) => void;
}

import { processDocumentTemplate } from "@/lib/document-utils";
import { generateProfessionalPDF } from "@/lib/pdf-generator";

export function OnboardingTab({ 
  candidateName, 
  hiringData, 
  onBack, 
  isSent, 
  onSend,
  docs,
  onMarkReady,
  onMarkAllReady,
  onPreviewDoc
}: OnboardingTabProps) {
  const allReady = docs.every(d => d.status === "ready");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);

  const handleDownload = async (doc: DocItem) => {
    toast({
      title: "Generating PDF",
      description: `Creating a professional copy of ${doc.name}...`,
    });

    if (doc.type === "tax") {
      const pdfUrl = doc.id === "tax_form" ? "/api/legal?doc=fw9" : "/api/legal?doc=fw8ben";
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${doc.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      let fetchDocName = "";
      if (doc.id === "offer") {
          fetchDocName = hiringData.hiringType === "hourly" ? "independent_contractor_agreement" : "employment_offer_letter";
      } else if (doc.id === "nda") {
          fetchDocName = "non_disclosure_agreement";
      } else if (doc.id === "piia") {
          fetchDocName = "proprietary_information_agreement";
      }

      try {
        const res = await fetch(`/api/legal?doc=${fetchDocName}`);
        const rawText = await res.text();
        const processedText = processDocumentTemplate(rawText, candidateName, hiringData);
        
        await generateProfessionalPDF(doc.name, processedText, doc.name.replace(/\s+/g, '_'));
        
        toast({
            title: "Download Ready",
            description: `${doc.name} has been successfully generated and saved.`,
        });
      } catch (e) {
        console.error("PDF Error:", e);
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: "There was an error generating the high-fidelity PDF.",
        });
      }
    }
  };

  const handleReplaceClick = (docId: string) => {
    setReplacingDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && replacingDocId) {
      toast({
        title: "Document Replaced",
        description: `${file.name} has been uploaded and swapped into the packet.`,
      });
      // In a real app, we would upload this to Supabase storage and update the doc object
      setReplacingDocId(null);
    }
  };

  if (isSent) {
    return (
        <motion.div 
            key="sent-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full flex flex-col items-center py-10 px-4 md:px-0"
        >
            <div className="w-full max-w-6xl">
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-[2rem] p-8 md:p-12 text-center mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <PartyPopper className="size-64 -rotate-12" />
                    </div>

                    <div className="size-20 rounded-2xl bg-purple-500 flex items-center justify-center text-white mb-6 mx-auto shadow-xl shadow-purple-500/20">
                        <Send className="size-10" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Packet Dispatched!</h2>
                    <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                        All documents have been securely sent to <span className="text-foreground font-bold">{candidateName}</span>. 
                        The next step is for them to review and sign digitally.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-background border rounded-full text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            <History className="size-3" /> Status: Awaiting Signature
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-background border rounded-full text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            <Calendar className="size-3" /> Sent: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="bg-card border-none shadow-sm p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <FileSignature className="size-12" />
                        </div>
                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2 uppercase tracking-wider text-primary">
                            <CheckCircle className="size-4" /> Next Steps
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            The candidate will receive an email. Once they sign, you'll get an instant notification to countersign.
                        </p>
                    </Card>

                    <Card className="bg-card border-none shadow-sm p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <MessageSquare className="size-12" />
                        </div>
                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2 uppercase tracking-wider text-purple-500">
                            <Activity className="size-4" /> Comms
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your custom message has been included in the invite. Check the <span className="font-bold">Comms</span> tab for replies.
                        </p>
                    </Card>

                    <Card className="bg-card border-none shadow-sm p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="size-12" />
                        </div>
                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2 uppercase tracking-wider text-green-500">
                            <Info className="size-4" /> Verification
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            All docs are encrypted and stored securely. You can view the audit trail anytime in the document list.
                        </p>
                    </Card>
                </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                        <Button variant="outline" onClick={onBack} className="px-10 h-12 rounded-xl font-bold border-muted-foreground/20 hover:bg-secondary">
                                            Back to Search
                                        </Button>
                                        <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-10 h-12 rounded-xl shadow-lg shadow-purple-500/20 group">
                                            Go to Active Roster <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }
                          return (
                              <motion.div 
                                  key="prep-state"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  className="w-full flex flex-col pb-10"
                              >
                                {/* Dashboard Header */}
                                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 border-b pb-6">
                                  <div className="text-center lg:text-left">
                                     <div className="flex items-center justify-center lg:justify-start gap-2 text-muted-foreground mb-2 text-xs md:text-sm uppercase tracking-wider font-bold">
                                        <Package className="w-4 h-4" /> Onboarding Preparation
                                     </div>
                                     <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                                        {candidateName}
                                     </h1>
                                     <p className="text-muted-foreground mt-1 text-xs md:text-sm md:text-base">
                                        {hiringData.orgName} • {hiringData.hiringType === "hourly" ? "Contractor" : "Full-Time Employee"}
                                     </p>
                                  </div>
                                  
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                                      <Button variant="outline" size="sm" onClick={onBack} className="justify-center h-10 md:h-11">
                                          Cancel
                                      </Button>
                                      <Button 
                                          onClick={onMarkAllReady} 
                                          disabled={allReady}
                                          variant="secondary"
                                          size="sm"
                                          className="justify-center h-10 md:h-11"
                                      >
                                          Mark All Ready
                                      </Button>
                                      <Button 
                                          onClick={onSend}
                                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 shadow-lg shadow-purple-500/20 justify-center min-w-[160px] h-10 md:h-11"
                                          disabled={!allReady}
                                          size="sm"
                                      >
                                          <Send className="w-4 h-4" /> Send to Candidate
                                      </Button>
                                  </div>
                                </div>
                      
                                {/* Main Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
                                  
                                  {/* Document List */}
                                  <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
                                      <div className="flex items-center justify-between mb-2">
                                          <h3 className="font-bold text-base md:text-lg">Contract & Compliance Packet</h3>
                                          <span className="text-xs md:text-sm text-muted-foreground">{docs.filter(d => d.status === "ready").length} of {docs.length} Ready</span>
                                      </div>
                      
                                      {docs.map((doc) => (
                                          <div 
                                              key={doc.id} 
                                              className={cn(
                                                  "group flex flex-col sm:flex-row items-start gap-4 p-4 md:p-5 rounded-xl border transition-all duration-200 bg-card hover:shadow-md",
                                                  doc.status === "ready" ? "border-purple-500/20 bg-purple-50/5" : "border-border"
                                              )}
                                          >
                                              <div className={cn(
                                                  "p-3 rounded-lg shrink-0",
                                                  doc.status === "ready" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" : "bg-secondary text-secondary-foreground"
                                              )}>
                                                  {doc.type === "tax" ? <FileSignature className="w-5 h-5 md:w-6 md:h-6" /> : <FileText className="w-5 h-5 md:w-6 md:h-6" />}
                                              </div>
                                              
                                              <div className="flex-1 min-w-0 w-full">
                                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                                      <h4 className="font-bold text-sm md:text-base truncate pr-2">{doc.name}</h4>
                                                      {doc.status === "ready" && (
                                                          <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800 flex items-center gap-1 text-[10px]">
                                                              <CheckCircle className="size-3" /> Ready
                                                          </Badge>
                                                      )}
                                                  </div>
                                                  <p className="text-xs md:text-sm text-muted-foreground mb-4">{doc.description}</p>
                                                  
                                                  <div className="flex items-center gap-2">
                                                      <Button 
                                                          variant="outline" 
                                                          size="sm" 
                                                          className="h-8 text-[10px] md:text-xs font-semibold px-3 md:px-4"
                                                          onClick={() => onPreviewDoc(doc)}
                                                      >
                                                          <ExternalLink className="w-3 h-3 mr-1.5" /> Preview
                                                      </Button>
                      
                                                      {doc.status !== "ready" && (
                                                          <Button 
                                                              size="sm" 
                                                              className="h-8 text-[10px] md:text-xs font-bold px-3 md:px-4 bg-primary/90 hover:bg-primary"
                                                              onClick={() => onMarkReady(doc.id)}
                                                          >
                                                              <CheckCircle2 className="w-3 h-3 mr-1.5" /> Mark Ready
                                                          </Button>
                                                      )}
                                                      
                                                                                  <DropdownMenu>
                                                                                      <DropdownMenuTrigger asChild>
                                                                                          <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                                                                                              <MoreHorizontal className="w-4 h-4" />
                                                                                          </Button>
                                                                                      </DropdownMenuTrigger>
                                                                                      <DropdownMenuContent align="end">
                                                                                          <DropdownMenuItem className="text-xs font-bold gap-2" onClick={() => handleDownload(doc)}>
                                                                                              <Download className="size-3" /> Download PDF
                                                                                          </DropdownMenuItem>
                                                                                          <DropdownMenuItem className="text-xs font-bold gap-2" onClick={() => handleReplaceClick(doc.id)}>
                                                                                              <FileUp className="size-3" /> Replace File
                                                                                          </DropdownMenuItem>
                                                                                          <DropdownMenuItem className="text-xs font-bold gap-2 text-red-500">
                                                                                              <Info className="size-3" /> View Audit Trail
                                                                                          </DropdownMenuItem>
                                                                                      </DropdownMenuContent>
                                                                                  </DropdownMenu>
                                                                              </div>
                                                                          </div>
                                                                      </div>
                                                                  ))}
                                                              </div>
                                                      
                                              {/* Hidden File Input for Replacement */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                
                {/* Sidebar Summary */}
        <div className="space-y-6 order-1 lg:order-2">
            <Card className="bg-muted/30 border-none shadow-none lg:sticky lg:top-6">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preparation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Candidate</span>
                            <span className="font-bold">{candidateName}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Organization</span>
                            <span className="font-bold">{hiringData.orgName}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Contract Type</span>
                            <span className="font-bold capitalize">{hiringData.hiringType}</span>
                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Compliance Check</div>
                        <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                            <ShieldCheck className="w-4 h-4" /> Platform Verified
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                            MSA and DPA terms were accepted by you during the hiring step. These will be bundled with the packet.
                        </p>
                    </div>
                    
                    <div className="h-px bg-border/50" />

                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Compensation</div>
                        <div className="text-2xl font-black font-mono tracking-tighter">
                            {hiringData.currency === "USD" ? "$" : hiringData.currency}
                            {hiringData.hiringType === "hourly" ? hiringData.rate : hiringData.salary}
                            <span className="text-xs font-sans font-bold text-muted-foreground ml-1 uppercase tracking-widest">
                                {hiringData.hiringType === "hourly" ? "/ hr" : "/ yr"}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-dashed border-2 bg-transparent shadow-none">
                <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-3">
                        <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm mb-1">Custom Document</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                        Upload specific policies or team handbooks.
                    </p>
                    <Button variant="outline" size="sm" className="w-full text-xs font-bold">
                        Upload File
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </motion.div>
  );
}
