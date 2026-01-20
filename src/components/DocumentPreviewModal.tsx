"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HiringData } from "./HiringModal";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  docName: string;
  docId: string;
  candidateName: string;
  hiringData: HiringData;
}

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
  const [currentPage, setCurrentPage] = useState(0);
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

      // 2. Dynamic Replacement
      const logoMarkdown = hiringData.logoUrl 
        ? `![Company Logo](${hiringData.logoUrl})` 
        : `**${hiringData.orgName}**`; // Fallback to text if no logo

      const processedText = rawText
        .replace(/!\[Company Logo\]\({{ORG_LOGO}}\)/g, logoMarkdown)
        .replace(/{{ORG_LOGO}}/g, hiringData.logoUrl || "") // Catch-all
        .replace(/{{CLIENT_NAME}}/g, hiringData.orgName)
        .replace(/{{ORG_NAME}}/g, hiringData.orgName)
        .replace(/{{COMPANY_NAME}}/g, hiringData.orgName)
        .replace(/{{CLIENT_ADDRESS}}/g, "123 Business Rd, Tech City") 
        .replace(/{{CONTRACTOR_NAME}}/g, candidateName)
        .replace(/{{EMPLOYEE_NAME}}/g, candidateName)
        .replace(/{{CANDIDATE_NAME}}/g, candidateName)
        .replace(/{{CANDIDATE_ADDRESS}}/g, "Remote")
        .replace(/{{CONTRACTOR_ADDRESS}}/g, "Remote") 
        .replace(/{{SERVICES_DESCRIPTION}}/g, "Software development and engineering services.")
        .replace(/{{PAYMENT_RATE}}/g, `${hiringData.currency}${hiringData.rate}/hr`)
        .replace(/{{SALARY_AMOUNT}}/g, `${hiringData.currency}${hiringData.salary}`)
        .replace(/{{EQUITY_AMOUNT}}/g, "1,000") // Placeholder
        .replace(/{{JOB_TITLE}}/g, "Software Engineer") // Placeholder
        .replace(/{{MANAGER_NAME}}/g, hiringData.userName)
        .replace(/{{USER_NAME}}/g, hiringData.userName)
        .replace(/{{START_DATE}}/g, "immediately")
        .replace(/{{EXPIRATION_DATE}}/g, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString())
        .replace(/{{END_DATE}}/g, "Open-ended")
        .replace(/{{DISPUTE_COUNTY}}/g, "San Francisco County, CA")
        .replace(/{{CONFIDENTIALITY_OTHER}}/g, "None")
        .replace(/{{GOVERNING_LAW_STATE}}/g, "California")
        .replace(/{{CURRENT_DATE}}/g, new Date().toLocaleDateString())
        .replace(/{{EFFECTIVE_DATE}}/g, new Date().toLocaleDateString());

      // 3. Pagination Split
      const splitPages = processedText.split('---');
      setPages(splitPages);
      setContent(processedText); 
      setCurrentPage(0);
      setLoading(false);
    };

        fetchAndProcess();

      }, [isOpen, docId, hiringData, candidateName]);

    

      useEffect(() => {

          if (isPdf && docId === "tax_form") {

              setPdfUrl(TAX_FORMS[taxFormType]);

          }

      }, [taxFormType, isPdf, docId]);

    

      const handleNext = () => {
    if (currentPage < pages.length - 1) setCurrentPage(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-900 font-poppins">
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
                        Reviewing document for {candidateName}
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
            ) : pages.length > 1 && (
                <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    Page {currentPage + 1} of {pages.length}
                </div>
            )}
          </div>
        </DialogHeader>
        
        {/* Document Viewer (A4 Ratio-ish) */}
        <div className="flex-1 overflow-hidden relative bg-slate-100 dark:bg-slate-950 p-4 md:p-8 flex justify-center items-start overflow-y-auto">
             {loading ? (
                 <div className="animate-pulse flex flex-col gap-4 w-full max-w-3xl">
                     <div className="h-8 bg-muted rounded w-1/3" />
                     <div className="h-4 bg-muted rounded w-full" />
                     <div className="h-4 bg-muted rounded w-full" />
                     <div className="h-4 bg-muted rounded w-2/3" />
                 </div>
             ) : isPdf ? (
                 <iframe 
                    src={pdfUrl} 
                    className="w-full h-full rounded-md shadow-lg border bg-white"
                    title="PDF Viewer"
                 />
             ) : (
                <div className="w-full max-w-[210mm] min-h-[297mm] bg-white dark:bg-slate-900 shadow-xl border rounded-sm p-8 md:p-12 text-slate-900 dark:text-slate-100">
                    <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none 
                        prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
                        prose-p:leading-relaxed
                        prose-ul:list-disc prose-ul:pl-4
                        prose-li:marker:text-slate-400
                    ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {pages[currentPage] || content}
                        </ReactMarkdown>
                    </article>
                </div>
             )}
        </div>

        {/* Footer / Controls */}
        <DialogFooter className="p-4 border-t bg-background flex-shrink-0 flex items-center justify-between sm:justify-between">
          <div className="flex gap-2">
             {!isPdf && (
                 <>
                    <Button 
                        variant="outline" 
                        onClick={handlePrev} 
                        disabled={currentPage === 0 || loading}
                        className="gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleNext} 
                        disabled={currentPage === pages.length - 1 || loading}
                        className="gap-2"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </Button>
                 </>
             )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Close Preview</Button>
            <Button onClick={onClose}>Done Reviewing</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
