"use client";

import React, { useState, useMemo } from "react";
import { 
  X, Search, LayoutGrid, List as ListIcon, 
  Calendar, Hash, Type, CheckSquare, 
  Users, Layers, Link as LinkIcon, 
  Phone, Mail, FileText, 
  Flag, Clock,
  ChevronRight,
  Plus,
  LucideIcon,
  Calculator,
  Grid,
  Briefcase,
  Globe,
  MessageSquare,
  History,
  TrendingUp,
  Sticker,
  Quote,
  Check,
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FieldConfig } from "@/hooks/use-crm-module";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ColumnPickerProps {
  onSelect: (template?: Partial<FieldConfig>, type?: FieldConfig['type']) => void;
  availableTemplates: FieldConfig[];
  children: React.ReactNode;
}

interface ColumnOption {
  label: string;
  type: FieldConfig['type'];
  icon: LucideIcon;
  template?: Partial<FieldConfig>;
  category: "Essentials" | "Super Useful" | "Advanced";
  description?: string;
  color?: string;
}

const getTemplateIcon = (key: string, type: string): LucideIcon => {
    if (type === 'email') return Mail;
    if (type === 'phone') return Phone;
    if (type === 'people') return Users;
    if (type === 'timeline') return Clock;
    if (type === 'link') return LinkIcon;
    if (key === 'company') return Layers;
    if (key === 'jobTitle') return Briefcase;
    if (key === 'industry') return Globe;
    if (key === 'website') return Globe;
    if (key === 'source') return TrendingUp;
    if (key === 'lastInteraction') return History;
    if (key === 'nextFollowUp') return Calendar;
    if (key === 'followUpStatus') return MessageSquare;
    if (key === 'comments') return Quote;
    if (key === 'salutation') return Sticker;
    return Plus;
};

export function ColumnPicker({ onSelect, availableTemplates, children }: ColumnPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allOptions: ColumnOption[] = useMemo(() => [
    // ESSENTIALS
    { label: "Status", type: "select", icon: LayoutGrid, category: "Essentials", color: "text-blue-500", description: "Track progress of items", template: { key: "status", label: "Status", type: "select" } },
    { label: "Dropdown", type: "select", icon: ListIcon, category: "Essentials", color: "text-purple-500", description: "Select from a list" },
    { label: "Text", type: "text", icon: Type, category: "Essentials", color: "text-amber-500", description: "Short text information" },
    { label: "Date", type: "date", icon: Calendar, category: "Essentials", color: "text-rose-500", description: "Select a date" },
    { label: "People", type: "people", icon: Users, category: "Essentials", color: "text-indigo-500", description: "Assign to team members" },
    { label: "Numbers", type: "number", icon: Hash, category: "Essentials", color: "text-emerald-500", description: "Raw numerical data" },

    // SUPER USEFUL
    { label: "Files", type: "text", icon: FileText, category: "Super Useful", color: "text-blue-400", description: "Attach documents" },
    { label: "Checkbox", type: "checkbox", icon: CheckSquare, category: "Super Useful", color: "text-green-500", description: "Mark as done" },
    { label: "Formula", type: "number", icon: Calculator, category: "Super Useful", color: "text-orange-500", description: "Auto-calculated values" },
    { label: "Timeline", type: "timeline", icon: Clock, category: "Super Useful", color: "text-pink-500", description: "Visualize date ranges" },
    { label: "Priority", type: "select", icon: Flag, category: "Super Useful", color: "text-red-500", description: "Set urgency levels", template: { key: "priority", label: "Priority", type: "select" } },
    { label: "Link", type: "link", icon: LinkIcon, category: "Super Useful", color: "text-sky-500", description: "External web links" },

    // SYSTEM TEMPLATES
    ...availableTemplates.map(t => ({
        label: t.label,
        type: t.type,
        icon: getTemplateIcon(t.key, t.type),
        category: "Advanced" as const,
        template: t,
        description: t.description || `Add ${t.label} to your board`,
        color: "text-muted-foreground"
    }))
  ], [availableTemplates]);

  const dropdownOptions = allOptions.filter(o => o.category === "Essentials").slice(0, 6);

  const filteredModalOptions = useMemo(() => {
    if (!searchQuery) return allOptions;
    const q = searchQuery.toLowerCase();
    return allOptions.filter(o => o.label.toLowerCase().includes(q) || o.category.toLowerCase().includes(q));
  }, [searchQuery, allOptions]);

  const renderDropdownOption = (opt: ColumnOption) => (
    <button 
        key={opt.label}
        onClick={() => { 
            onSelect(opt.template, opt.type); 
            setIsDropdownOpen(false); 
        }}
        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-500/10 transition-all group text-left w-full"
    >
        <div className={cn("p-1.5 rounded-lg bg-secondary/30 group-hover:bg-background transition-colors", opt.color)}>
            <opt.icon size={14} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest truncate">{opt.label}</span>
    </button>
  );

  const renderCardOption = (opt: ColumnOption) => {
    const Icon = opt.icon;
    return (
        <button
            key={opt.label}
            onClick={() => { 
                onSelect(opt.template, opt.type); 
                setIsModalOpen(false); 
            }}
            className="h-28 text-left p-4 rounded-xl border-2 border-border bg-card/50 hover:bg-card/90 hover:border-blue-500/50 transition-all flex flex-col justify-between relative group"
        >
            <div className="flex items-start justify-between">
                <div className='flex items-center'>
                    <div className={cn("p-2 rounded-lg bg-secondary/30 group-hover:bg-blue-500/10 transition-colors mr-3", opt.color)}>
                        <Icon size={20} />
                    </div>
                    <h3 className="font-black text-[10px] uppercase tracking-widest">{opt.label}</h3>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center transition-all group-hover:border-blue-500">
                    <Plus size={10} className="text-muted-foreground/30 group-hover:text-blue-500" />
                </div>
            </div>
            <p className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter leading-tight opacity-60 group-hover:opacity-100 transition-opacity">
                {opt.description || "Add this field to your workspace"}
            </p>
        </button>
    );
  };

  return (
    <>
      <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent 
          side="bottom" 
          align="end" 
          sideOffset={8}
          className="w-[240px] bg-card/95 border border-border/40 shadow-2xl rounded-[1.5rem] backdrop-blur-3xl p-0 z-[100]"
        >
          <div className="p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Suggested</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsDropdownOpen(false)} className="h-6 w-6 rounded-full">
                <X size={12} />
              </Button>
            </div>

            <div className="space-y-0.5">
              {dropdownOptions.map(renderDropdownOption)}
            </div>

            <div className="pt-3 mt-2 border-t border-border/20">
                <Button 
                    variant="ghost" 
                    className="w-full h-9 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/10 hover:text-blue-500 transition-all group justify-between px-2"
                    onClick={() => {
                        setIsDropdownOpen(false);
                        setIsModalOpen(true);
                    }}
                >
                    Column Center
                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 rounded-[2.5rem] border-none shadow-2xl bg-card/95 backdrop-blur-3xl">
          <div className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="p-10 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">Knowledge Engine</span>
                    <Sparkles size={12} className="text-blue-500 animate-pulse" />
                  </div>
                  <DialogTitle className="text-4xl font-black uppercase tracking-tighter">Column <span className="text-blue-600 italic">Center</span></DialogTitle>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 max-w-md">Choose from highly specialized data types to power your workflow. Each column is optimized for maximum data density and speed.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-14 w-14 rounded-full hover:bg-secondary/50 border border-border/20">
                  <X size={24} />
                </Button>
              </div>
              
              <div className="mt-10 relative group max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={20} />
                <Input 
                  placeholder="SEARCH FOR A COLUMN OR CATEGORY..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-16 h-16 bg-secondary/30 border-none rounded-[1.25rem] text-xs font-black uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-blue-500/20 shadow-inner"
                  autoFocus
                />
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pt-4 space-y-16">
              {["Essentials", "Super Useful", "Advanced"].map(category => {
                const categoryOptions = filteredModalOptions.filter(o => o.category === category);
                if (categoryOptions.length === 0) return null;

                return (
                  <div key={category} className="space-y-8">
                    <div className="flex items-center gap-6">
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 whitespace-nowrap">{category}</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-border/40 to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {categoryOptions.map(renderCardOption)}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-10 pt-6 border-t border-border/20 bg-secondary/5 mt-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                            <Grid size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest block">System Healthy</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{filteredModalOptions.length} specialized modules available</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest border-border/40 px-10 hover:bg-secondary/50 transition-all" onClick={() => setIsModalOpen(false)}>Back to Table</Button>
                        <Button className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-10 shadow-xl shadow-blue-500/20 transition-all">Request Feature</Button>
                    </div>
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
