"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HiringData } from "./HiringModal";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft, ChevronRight, FileText, ShieldCheck } from "lucide-react";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  docName: string;
  docId: string;
  candidateName: string;
  hiringData: HiringData;
}

import { processDocumentTemplate } from "@/lib/document-utils";

export function DocumentPreviewModal({
  isOpen,
  onClose,
  docName,
  docId,
  candidateName,
  hiringData
}: DocumentPreviewModalProps) {
  const [content, setContent] = useState("");
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [taxFormType, setTaxFormType] = useState<"w9" | "w8ben">("w9");

  const TAX_FORMS = {
      w9: "/api/legal?doc=fw9",
      w8ben: "/api/legal?doc=fw8ben"
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchAndProcess = async () => {
      setLoading(true);
      let rawText = "";
      let fetchDocName = "";
      setIsPdf(false);

      if (docId === "tax_form") {
          setIsPdf(true);
          setPdfUrl(TAX_FORMS[taxFormType]);
          setLoading(false);
          return;
      }

      // 1. Determine Template to Fetch
      if (docId === "offer") {
          fetchDocName = hiringData.hiringType === "hourly" ? "independent_contractor_agreement" : "employment_offer_letter";
      } else if (docId === "nda") {
          fetchDocName = "non_disclosure_agreement";
      } else if (docId === "piia") {
          fetchDocName = "proprietary_information_agreement";
      } else if (docId === "background_consent") {
          fetchDocName = "background_check_consent";
      }

      if (fetchDocName) {
        try {
            const res = await fetch(`/api/legal?doc=${fetchDocName}`);
            if (res.ok) rawText = await res.text();
            else rawText = `Error loading template: ${fetchDocName}`;
        } catch (e) {
            rawText = "Error loading template.";
        }
      } else {
        rawText = `Preview not available for ${docId}`;
      }

      // 2. Dynamic Replacement via Utility
      const processedText = processDocumentTemplate(rawText, candidateName, hiringData);

      // 3. Pagination Split
      const splitPages = processedText.split('---');
      setPages(splitPages);
      setContent(processedText); 
      setLoading(false);
    };

    fetchAndProcess();
  }, [isOpen, docId, hiringData, candidateName]);

  useEffect(() => {
    if (isPdf && docId === "tax_form") {
      setPdfUrl(TAX_FORMS[taxFormType]);
    }
  }, [taxFormType, isPdf, docId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-900 font-poppins">
        {/* Header */}
        <DialogHeader className="p-6 border-b bg-background flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold">{docName}</DialogTitle>
                    <DialogDescription className="text-xs mt-1">
                        Reviewing full document for {candidateName}
                    </DialogDescription>
                </div>
            </div>
            {isPdf && docId === "tax_form" ? (
                <div className="flex bg-muted rounded-lg p-1">
                    <button 
                        onClick={() => setTaxFormType("w9")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${taxFormType === "w9" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                    >
                        W-9 (US)
                    </button>
                    <button 
                        onClick={() => setTaxFormType("w8ben")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${taxFormType === "w8ben" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                    >
                        W-8BEN (Intl)
                    </button>
                </div>
            ) : (
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border">
                    {pages.length} Pages • Scroll to Review
                </div>
            )}
          </div>
        </DialogHeader>
        
        {/* Document Viewer */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 md:p-8 custom-scrollbar">
             {loading ? (
                 <div className="animate-pulse flex flex-col gap-6 items-center w-full">
                     <div className="w-full max-w-[210mm] aspect-[1/1.4] bg-muted rounded-sm" />
                     <div className="w-full max-w-[210mm] aspect-[1/1.4] bg-muted rounded-sm" />
                 </div>
             ) : isPdf ? (
                 <div className="w-full h-full flex justify-center">
                    <iframe 
                        src={pdfUrl} 
                        className="w-full max-w-5xl h-full rounded-md shadow-lg border bg-white"
                        title="PDF Viewer"
                    />
                 </div>
             ) : (
                <div className="flex flex-col gap-8 items-center pb-12">
                    {pages.map((page, index) => (
                        <div key={index} className="w-full max-w-[210mm] min-h-[297mm] bg-white dark:bg-slate-900 shadow-xl border rounded-sm p-8 md:p-16 text-slate-900 dark:text-slate-100 relative">
                            {/* Page Number Indicator */}
                            <div className="absolute top-4 right-6 text-[10px] font-mono text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                                Page {index + 1}
                            </div>
                            
                            <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none 
                                prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
                                prose-p:leading-relaxed
                                prose-ul:list-disc prose-ul:pl-4
                                prose-li:marker:text-slate-400
                            ">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {page}
                                </ReactMarkdown>
                            </article>
                        </div>
                    ))}
                </div>
             )}
        </div>

        {/* Footer / Controls */}
        <DialogFooter className="p-4 border-t bg-background flex-shrink-0 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
            <ShieldCheck className="w-3 h-3 text-green-500" /> Standard {docName} Template
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="font-medium">Close</Button>
            <Button onClick={onClose} className="font-bold bg-primary hover:bg-primary/90">
                Finish Review
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
