"use client";

import { useState } from "react";
import { HiringData } from "./HiringModal";
import { motion } from "framer-motion";
import { 
    CheckCircle2, FileText, Download, Upload, ShieldCheck, 
    ExternalLink, Package, Send, MoreHorizontal, FileSignature,
    CheckCircle, PartyPopper, Calendar, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OnboardingHubProps {
  candidateName: string;
  hiringData: HiringData;
  onBack: () => void;
}

type DocStatus = "pending" | "ready" | "approved";

interface DocItem {
  id: string;
  name: string;
  description: string;
  status: DocStatus;
  type: "contract" | "compliance" | "tax";
}

export function OnboardingHub({ candidateName, hiringData, onBack }: OnboardingHubProps) {
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();
  
  // Initialize docs based on hiring type
  const [docs, setDocs] = useState<DocItem[]>([
    {
      id: "offer",
      name: hiringData.hiringType === "hourly" ? "Independent Contractor Agreement" : "Employment Offer Letter",
      description: `Formal ${hiringData.hiringType === "hourly" ? "contract" : "offer"} detailing compensation and terms.`,
      status: "ready",
      type: "contract",
    },
    {
      id: "piia",
      name: "Proprietary Info & Inventions Assignment",
      description: "Ensures company ownership of all IP created.",
      status: "ready",
      type: "contract",
    },
    {
      id: "nda",
      name: "Non-Disclosure Agreement (NDA)",
      description: "Standard protection for confidential information.",
      status: "ready",
      type: "contract",
    },
    {
      id: "tax_form",
      name: hiringData.hiringType === "hourly" ? "Tax Form (W-9 / W-8BEN)" : "Form I-9",
      description: "Required tax and eligibility documentation.",
      status: "ready",
      type: "tax",
    }
  ]);

  const handleApproveDoc = (id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "approved" } : d));
  };

  const handleApproveAll = () => {
    setDocs(prev => prev.map(d => ({ ...d, status: "approved" })));
  };

  const handleSend = () => {
    setIsSent(true);
    toast({
      title: "Onboarding Packet Sent!",
      description: `The offer and compliance documents have been sent to ${candidateName}.`,
    });
  };

  const allApproved = docs.every(d => d.status === "approved");

  if (isSent) {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mx-auto py-20 flex flex-col items-center text-center"
        >
            <div className="size-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 mb-8 shadow-xl shadow-purple-500/10">
                <PartyPopper className="size-10" />
            </div>
            
            <h1 className="text-4xl font-black tracking-tight mb-4">Packet Dispatched!</h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-md">
                All documents have been securely sent to <strong>{candidateName}</strong>. They will receive an email shortly to review and sign.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
                <Card className="bg-muted/30 border-none text-left p-4">
                    <div className="flex items-center gap-3 mb-2 text-primary">
                        <Calendar className="size-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Next Steps</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        The candidate will sign the docs. You'll be notified immediately via email.
                    </p>
                </Card>
                <Card className="bg-muted/30 border-none text-left p-4">
                    <div className="flex items-center gap-3 mb-2 text-purple-500">
                        <MessageSquare className="size-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Communication</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Your message has been included in the invite. Expect a response soon.
                    </p>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" onClick={onBack} className="px-8">
                    Back to Search
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8">
                    View Pipeline Status
                </Button>
            </div>
        </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto h-full flex flex-col font-poppins"
    >
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b pb-6">
        <div>
           <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm uppercase tracking-wider font-bold">
              <Package className="w-4 h-4" /> Onboarding Packet
           </div>
           <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
              {candidateName}
           </h1>
           <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {hiringData.orgName} • {hiringData.hiringType === "hourly" ? "Contractor" : "Full-Time Employee"}
           </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button variant="outline" onClick={onBack} className="justify-center">
                Cancel
            </Button>
            <Button 
                onClick={handleApproveAll} 
                disabled={allApproved}
                variant="secondary"
                className="justify-center"
            >
                Approve All
            </Button>
            <Button 
                onClick={handleSend}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 shadow-lg shadow-purple-500/20 justify-center"
                disabled={!allApproved}
            >
                <Send className="w-4 h-4" /> Send Packet
            </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        
        {/* Document List */}
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Documents to Review</h3>
                <span className="text-sm text-muted-foreground">{docs.filter(d => d.status === "approved").length} of {docs.length} Approved</span>
            </div>

            {docs.map((doc) => (
                <div 
                    key={doc.id} 
                    className={cn(
                        "group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 bg-card hover:shadow-md",
                        doc.status === "approved" ? "border-green-500/20 bg-green-50/5" : "border-border"
                    )}
                >
                    <div className={cn(
                        "p-3 rounded-lg mt-1 shrink-0",
                        doc.status === "approved" ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" : "bg-secondary text-secondary-foreground"
                    )}>
                        {doc.type === "tax" ? <FileSignature className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-base truncate pr-2">{doc.name}</h4>
                            {doc.status === "approved" && (
                                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:border-green-800">Ready</Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{doc.description}</p>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs font-medium"
                                onClick={() => setPreviewDoc(doc)}
                            >
                                <ExternalLink className="w-3 h-3 mr-1.5" /> Preview
                            </Button>

                            {doc.status !== "approved" && (
                                <Button 
                                    size="sm" 
                                    className="h-8 text-xs font-medium bg-primary/90 hover:bg-primary"
                                    onClick={() => handleApproveDoc(doc.id)}
                                >
                                    <CheckCircle2 className="w-3 h-3 mr-1.5" /> {doc.type === "tax" ? "Confirm" : "Approve"}
                                </Button>
                            )}
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Download PDF</DropdownMenuItem>
                                    <DropdownMenuItem>Replace with Custom File</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6 order-1 lg:order-2">
            <Card className="bg-muted/30 border-none shadow-none lg:sticky lg:top-6">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Platform Compliance</div>
                        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                            <ShieldCheck className="w-4 h-4" /> Agreements Signed
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            MSA, DPA, and Terms agreed on {new Date().toLocaleDateString()}
                        </p>
                    </div>
                    
                    <div className="h-px bg-border/50" />

                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Compensation</div>
                        <div className="text-xl font-bold font-mono">
                            {hiringData.currency === "USD" ? "$" : hiringData.currency}
                            {hiringData.hiringType === "hourly" ? hiringData.rate : hiringData.salary}
                            <span className="text-sm font-sans font-normal text-muted-foreground ml-1">
                                {hiringData.hiringType === "hourly" ? "/hr" : "/yr"}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-dashed border-2 bg-transparent shadow-none">
                <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm mb-1">Add Custom Document</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                        Need to include a specific policy or handbook?
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                        Upload File
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>

      {previewDoc && (
        <DocumentPreviewModal
            isOpen={!!previewDoc}
            onClose={() => setPreviewDoc(null)}
            docName={previewDoc.name}
            docId={previewDoc.id}
            candidateName={candidateName}
            hiringData={hiringData}
        />
      )}
    </motion.div>
  );
}