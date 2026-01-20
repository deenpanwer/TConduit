"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { legalSections } from "@/lib/legal-data";
import { ChevronDown, ChevronRight, Scale } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LegalSidebar() {
  const pathname = usePathname();
  const currentSlug = pathname.split("/").pop();

  // Find the section that contains the current slug
  const activeSection = legalSections.find(section => 
    section.items.some((item: any) => item.id === currentSlug)
  );

  // State to track the open section title
  const [openSectionTitle, setOpenSectionTitle] = useState<string | null>(activeSection?.title || null);

  // Update open section when route changes (optional, but good for deep linking)
  useEffect(() => {
    if (activeSection) {
      setOpenSectionTitle(activeSection.title);
    }
  }, [currentSlug]);

  const handleToggle = (title: string) => {
    setOpenSectionTitle(prev => prev === title ? null : title);
  };

  return (
    <aside className="w-full lg:w-72 shrink-0 lg:border-r bg-muted/10 h-auto lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 overflow-y-auto font-poppins">
      <div className="p-6">
        <Link href="/legal" className="flex items-center gap-2 mb-8 group">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Scale className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Legal Center</span>
        </Link>
        
        <nav className="space-y-6">
          {legalSections.map((section) => (
            <SectionGroup 
                key={section.title} 
                section={section} 
                currentSlug={currentSlug} 
                isOpen={openSectionTitle === section.title}
                onToggle={() => handleToggle(section.title)}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function SectionGroup({ 
  section, 
  currentSlug, 
  isOpen, 
  onToggle 
}: { 
  section: any, 
  currentSlug: string | undefined, 
  isOpen: boolean, 
  onToggle: () => void 
}) {
  const hasActiveChild = section.items.some((item: any) => item.id === currentSlug);

  return (
    <div className="space-y-1">
      <button 
        onClick={onToggle}
        className={cn(
            "flex items-center justify-between w-full text-left px-2 py-1 text-xs font-bold uppercase tracking-wider transition-colors",
            hasActiveChild || isOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {section.title}
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
            <motion.ul 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 overflow-hidden pl-2"
            >
                {section.items.map((item: any) => {
                const isActive = item.id === currentSlug;
                return (
                    <li key={item.id}>
                    <Link
                        href={`/legal/${item.id}`}
                        className={cn(
                        "block px-3 py-2 text-sm rounded-md transition-all duration-200 border-l-2",
                        isActive
                            ? "bg-primary/5 text-primary border-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                        )}
                    >
                        {item.name}
                    </Link>
                    </li>
                );
                })}
            </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}