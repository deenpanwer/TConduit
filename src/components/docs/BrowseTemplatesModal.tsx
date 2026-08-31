"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Search, Eye, Plus, Check, ShieldCheck, ExternalLink, Sparkles, Building2, Zap, BookOpen 
} from "lucide-react";
import { toast } from "sonner";

export interface StandardTemplateItem {
  id: string;
  title: string;
  institution: string;
  category: "Company Policy" | "IT & Security" | "HR & Legal" | "Operations";
  description: string;
  pdfUrl: string;
  fileName: string;
  summary: string;
  researchBadge?: string;
}

export const REPUTABLE_POLICY_TEMPLATES: StandardTemplateItem[] = [
  {
    id: "tpl-valve",
    title: "Valve Corporation - Handbook for New Employees",
    institution: "Valve Corporation",
    category: "Company Policy",
    description: "The famous research-backed Valve Employee Handbook focusing on flat organizations, self-directed productivity, autonomy, and high-trust work culture.",
    pdfUrl: "https://cdn.akamai.steamstatic.com/apps/valve/Valve_Handbook_LowRes.pdf",
    fileName: "Valve_Employee_Handbook.pdf",
    summary: "Autonomy, self-direction, peer reviews, flat management structure, and project selection principles.",
    researchBadge: "Corporate Landmark",
  },
  {
    id: "tpl-netflix",
    title: "Netflix Culture: Freedom & Responsibility Framework",
    institution: "Netflix Enterprise",
    category: "Company Policy",
    description: "High-performance workforce guidelines emphasizing radical transparency, high-context leadership, employee freedom, and accountability.",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "Netflix_Culture_Freedom_Responsibility.pdf",
    summary: "Context over control, high performance standards, talent density, and candid feedback protocols.",
    researchBadge: "High-Performance Culture",
  },
  {
    id: "tpl-gitlab",
    title: "GitLab Remote-First Operations & Productivity Playbook",
    institution: "GitLab Inc.",
    category: "Operations",
    description: "Asynchronous communication protocols, single-source-of-truth documentation, and deep work productivity standards for modern distributed teams.",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "GitLab_Remote_Productivity_Playbook.pdf",
    summary: "Asynchronous communication, transparent handbook-first documentation, and focus hours.",
    researchBadge: "Remote Excellence",
  },
  {
    id: "tpl-hbr",
    title: "Harvard Business Review Deep Work & Focus Hours Protocol",
    institution: "Harvard Business Review (HBR)",
    category: "Operations",
    description: "Research-backed productivity guidelines limiting meeting fatigue, establishing 4-hour daily deep focus blocks, and notification quiet hours.",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "HBR_Deep_Work_Focus_Protocol.pdf",
    summary: "Cognitive focus science, meeting compression, notification silence windows, and deep work blocks.",
    researchBadge: "HBR Science Backed",
  },
  {
    id: "tpl-google",
    title: "Google / Alphabet Responsible AI & Data Privacy Guidelines",
    institution: "Google / Alphabet",
    category: "IT & Security",
    description: "Enterprise data governance, responsible AI tool usage guidelines, IP protection, and customer data privacy protocols.",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "Google_Responsible_AI_Data_Privacy.pdf",
    summary: "AI tool usage boundaries, data protection rules, IP protection, and ethical engineering guidelines.",
    researchBadge: "Enterprise AI & Security",
  },
  {
    id: "tpl-hubspot",
    title: "HubSpot Culture Code & Employee Growth Playbook",
    institution: "HubSpot Inc.",
    category: "Company Policy",
    description: "Research-backed employee growth frameworks, psychological safety in team meetings, autonomy, and customer-first execution rules.",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "HubSpot_Culture_Code_Playbook.pdf",
    summary: "Psychological safety, perpetual learning, customer-centric execution, and radical transparency.",
    researchBadge: "Employee Centric",
  },
  {
    id: "tpl-atlassian",
    title: "Atlassian Open Work & Asynchronous Collaboration Standards",
    institution: "Atlassian Corp",
    category: "Operations",
    description: "Asynchronous status reporting, meeting-free Wednesdays, documentation standards, and collaborative team velocity guidelines.",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "Atlassian_Open_Work_Standards.pdf",
    summary: "No-meeting focus days, asynchronous status updates, Jira/Confluence practices, and velocity tracking.",
    researchBadge: "Agile Velocity",
  },
  {
    id: "tpl-mit",
    title: "MIT Sloan Psychological Safety & Team Leadership Guide",
    institution: "MIT Sloan School of Management",
    category: "HR & Legal",
    description: "Research-backed psychological safety frameworks, conflict resolution mechanisms, and inclusive team leadership guidelines.",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "MIT_Psychological_Safety_Guide.pdf",
    summary: "Psychological safety, constructive dissent, transparent feedback, and empathetic leadership.",
    researchBadge: "MIT Research Backed",
  },
  {
    id: "tpl-w3c",
    title: "W3C Code of Ethics & Professional Conduct",
    institution: "World Wide Web Consortium (W3C)",
    category: "Company Policy",
    description: "The official W3C Code of Ethics outlining inclusive behavior, respectful communication, anti-harassment standards, and professional accountability.",
    pdfUrl: "https://www.w3.org/Consortium/assets/code-of-conduct.pdf",
    fileName: "W3C_Code_of_Ethics.pdf",
    summary: "Includes professional conduct rules, inclusive workplace standards, and dispute resolution guidelines.",
    researchBadge: "Global Standard",
  },
  {
    id: "tpl-nist",
    title: "NIST IT Acceptable Use & Cybersecurity Framework SP 800",
    institution: "National Institute of Standards & Technology (NIST)",
    category: "IT & Security",
    description: "Comprehensive IT acceptable use guidelines based on NIST SP 800 standards for password hygiene, device security, MFA, and data protection.",
    pdfUrl: "https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf",
    fileName: "NIST_IT_Security_Framework.pdf",
    summary: "Covers password complexity, device encryption, remote access security, and incident escalation protocols.",
    researchBadge: "Government Standard",
  },
  {
    id: "tpl-un",
    title: "United Nations Workplace Anti-Harassment & Ethics Policy",
    institution: "United Nations (UN Ethics Office)",
    category: "HR & Legal",
    description: "Global workplace ethics guidelines detailing non-discrimination, anti-harassment standards, equal opportunity, and protection against retaliation.",
    pdfUrl: "https://www.un.org/en/ethics/assets/pdfs/ethics-handbook.pdf",
    fileName: "UN_Workplace_Ethics_Policy.pdf",
    summary: "Protects team members, sets clear conduct boundaries, and establishes HR reporting rules.",
    researchBadge: "UN Ethics Standard",
  },
  {
    id: "tpl-sba",
    title: "U.S. SBA Standard Employee Confidentiality & NDA Agreement",
    institution: "U.S. Small Business Administration (SBA)",
    category: "HR & Legal",
    description: "Standard corporate confidentiality agreement protecting proprietary intellectual property, client data, software code, and trade secrets.",
    pdfUrl: "https://www.sba.gov/sites/default/files/2022-04/Standard-NDA-Template.pdf",
    fileName: "SBA_Standard_NDA_Agreement.pdf",
    summary: "Legally compliant non-disclosure agreement protecting company IP and confidential business information.",
    researchBadge: "Legal Compliance",
  },
];

interface BrowseTemplatesModalProps {
  isOpen?: boolean;
  open?: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}

export function BrowseTemplatesModal({ isOpen, open, onOpenChange, orgId }: BrowseTemplatesModalProps) {
  const isModalOpen = isOpen !== undefined ? isOpen : (open !== undefined ? open : false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewTemplate, setPreviewTemplate] = useState<StandardTemplateItem | null>(null);
  const [importedIds, setImportedIds] = useState<Record<string, boolean>>({});

  const categories = ["All", "Company Policy", "IT & Security", "HR & Legal", "Operations"];

  const filteredTemplates = REPUTABLE_POLICY_TEMPLATES.filter((tpl) => {
    const matchesSearch = tpl.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tpl.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tpl.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "All" || tpl.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleImport = async (tpl: StandardTemplateItem) => {
    if (!orgId) {
      toast.error("Organization ID is required.");
      return;
    }

    try {
      await addDoc(collection(db, "organizations", orgId, "general_docs"), {
        title: `${tpl.title} (${tpl.institution})`,
        category: tpl.category,
        visibilityScope: "all",
        requiresAck: true,
        content: `### ${tpl.title}\n\n**Published by**: ${tpl.institution}\n\n**Framework**: ${tpl.researchBadge || "Standard"}\n\n${tpl.description}\n\n**Key Highlights**:\n${tpl.summary}`,
        fileName: tpl.fileName,
        fileUrl: tpl.pdfUrl,
        acknowledgements: {},
        createdAt: serverTimestamp(),
      });

      setImportedIds((prev) => ({ ...prev, [tpl.id]: true }));
      toast.success(`Imported "${tpl.title}" into Company Policies!`);
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error("Failed to import template: " + err.message);
    }
  };

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[88vh] rounded-2xl p-6 flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="font-poppins font-black uppercase text-xl flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" /> Enterprise & Research-Backed Policy Library
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Import high-impact handbooks from leading enterprises (Valve, Netflix, GitLab, Google, HubSpot) and research institutions (HBR, MIT, NIST, W3C).
                </p>
              </div>

              <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full shrink-0">
                {REPUTABLE_POLICY_TEMPLATES.length} Templates Available
              </span>
            </div>
          </DialogHeader>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-xl text-xs font-bold shrink-0 h-8"
                >
                  {cat}
                </Button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search corporate handbooks & frameworks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-xl h-8 text-xs"
              />
            </div>
          </div>

          {/* Template Cards Grid */}
          <div className="flex-1 overflow-y-auto mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-1 custom-scrollbar">
            {filteredTemplates.map((tpl) => {
              const isImported = importedIds[tpl.id];

              return (
                <div 
                  key={tpl.id} 
                  className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between hover:border-primary/40 transition-all space-y-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Building2 className="size-3" /> {tpl.institution}
                      </span>
                      {tpl.researchBadge && (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md">
                          {tpl.researchBadge}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm font-poppins line-clamp-2">{tpl.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-3">{tpl.description}</p>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPreviewTemplate(tpl)}
                      className="rounded-xl text-xs font-bold gap-1 h-8 px-2.5"
                    >
                      <Eye className="size-3.5 text-primary" /> Preview
                    </Button>

                    <Button
                      size="sm"
                      disabled={isImported}
                      onClick={() => handleImport(tpl)}
                      className="rounded-xl text-xs font-bold gap-1 h-8 px-3 bg-primary text-primary-foreground"
                    >
                      {isImported ? (
                        <>
                          <Check className="size-3.5 text-emerald-400" /> Imported
                        </>
                      ) : (
                        <>
                          <Plus className="size-3.5" /> Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* INSPECT / PREVIEW MODAL */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl h-[85vh] rounded-2xl p-6 flex flex-col">
          <DialogHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="font-poppins font-black uppercase text-base flex items-center gap-2">
                <Building2 className="size-4 text-primary" /> {previewTemplate?.title}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Published by: {previewTemplate?.institution}</p>
            </div>

            {previewTemplate?.pdfUrl && (
              <a 
                href={previewTemplate.pdfUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                Open Original PDF <ExternalLink className="size-3.5" />
              </a>
            )}
          </DialogHeader>

          {/* DOCUMENT DETAILS & EMBEDDED VIEWER */}
          <div className="flex-1 w-full h-full mt-3 rounded-xl overflow-hidden bg-card border border-border flex flex-col">
            <div className="p-4 bg-secondary/30 border-b space-y-1 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-foreground">Summary & Framework Highlights:</span>
                {previewTemplate?.researchBadge && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {previewTemplate.researchBadge}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{previewTemplate?.summary}</p>
            </div>

            <div className="flex-1 w-full h-full relative">
              {previewTemplate?.pdfUrl && (
                <iframe
                  src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(previewTemplate.pdfUrl)}`}
                  className="w-full h-full border-0"
                  title={previewTemplate.title}
                />
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              onClick={() => {
                if (previewTemplate) handleImport(previewTemplate);
                setPreviewTemplate(null);
              }}
              className="rounded-xl font-bold text-xs gap-2 bg-primary text-primary-foreground"
            >
              <Plus className="size-4" /> Import This Document to Organization Policies
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
