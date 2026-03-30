"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCRM, CRMEntity, FieldConfig } from "@/hooks/use-crm";
import { 
  User, Mail, Phone, Building2, MapPin, 
  Briefcase, ArrowLeft, Edit3, Plus, 
  TrendingUp, Clock, ShieldCheck, ExternalLink,
  ChevronRight, DollarSign, Target, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactModal } from "@/components/crm/forms/ContactModal";
import { DealModal } from "@/components/crm/forms/DealModal";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ContactDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { contacts, loading, updateEntity, config } = useCRM();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);

  const contact = useMemo(() => contacts.find(c => c.id === id), [contacts, id]);
  const contactFields = config.modules.contacts.fields;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen space-y-4">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Contact Not Found</h2>
        <Button variant="outline" onClick={() => router.push('/crm/contacts')} className="rounded-xl">
          <ArrowLeft className="mr-2" size={16} /> Back to Contacts
        </Button>
      </div>
    );
  }

  const handleCreateDeal = () => {
    setIsDealModalOpen(true);
  };

  // Pre-fill deal data from contact
  const dealInitialData = {
    organization: contact.data.company,
    firstName: contact.data.firstName,
    lastName: contact.data.lastName,
    email: contact.data.email,
    mobile: contact.data.mobile,
    name: `${contact.data.company || contact.name} - New Opportunity`
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <ContactModal 
        isOpen={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        mode="edit" 
        contact={contact} 
      />
      
      <DealModal 
        isOpen={isDealModalOpen} 
        onOpenChange={setIsDealModalOpen} 
        mode="create" 
        deal={null}
        initialData={dealInitialData}
      />

      {/* HEADER ACTION BAR */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/crm/contacts')} className="rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-secondary">
          <ArrowLeft className="mr-2" size={14} /> Back to Network
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest border-border/60">
            <Edit3 className="mr-2" size={14} /> Edit Profile
          </Button>
          <Button onClick={handleCreateDeal} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-8 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20">
            <Plus className="mr-2" size={16} /> Launch Deal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: PRIMARY IDENTITY */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm rounded-[2rem] overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-end justify-center pb-0">
                <div className="size-24 rounded-[2rem] bg-background border-4 border-background translate-y-12 flex items-center justify-center shadow-xl">
                  <User size={40} className="text-blue-600" />
                </div>
              </div>
              <div className="pt-16 pb-8 px-8 text-center space-y-2">
                <h2 className="text-2xl font-black tracking-tighter uppercase">{contact.name}</h2>
                <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em]">
                  {contact.data.designation || "Executive"} @ {contact.data.company || "Independent"}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-4">
                  <Badge variant="secondary" className="rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-wider bg-blue-500/10 text-blue-500 border-none">
                    Verified Network
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-wider bg-green-500/10 text-green-500 border-none">
                    Active
                  </Badge>
                </div>
              </div>
              
              <div className="border-t border-border/20 p-8 space-y-6 bg-secondary/5">
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="size-10 rounded-xl bg-background border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-blue-500 group-hover:border-blue-500/50 transition-all shadow-sm">
                    <Mail size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Email Address</span>
                    <span className="text-xs font-bold truncate max-w-[180px]">{contact.data.email || "No email linked"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="size-10 rounded-xl bg-background border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-blue-500 group-hover:border-blue-500/50 transition-all shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Mobile Number</span>
                    <span className="text-xs font-bold">{contact.data.mobile || "No number linked"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="size-10 rounded-xl bg-background border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-blue-500 group-hover:border-blue-500/50 transition-all shadow-sm">
                    <MapPin size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Global Address</span>
                    <span className="text-xs font-bold line-clamp-2 leading-relaxed">{contact.data.address || "No address on record"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: INTELLIGENCE & DEALS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* PROFILE INTEL */}
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm rounded-[2rem] shadow-xl">
            <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-500" /> Professional Intel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-6">
              <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                {contactFields.map(field => {
                  const val = contact.data[field.key];
                  if (!val || ['firstName', 'lastName', 'email', 'mobile', 'address'].includes(field.key)) return null;
                  return (
                    <div key={field.id} className="space-y-1.5 border-l-2 border-blue-500/20 pl-4 py-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{field.label}</p>
                      <p className="text-sm font-bold uppercase tracking-tight">{String(val)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ACTION CARD: DEALS */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">Strategic Opportunities</h3>
            <Card className="border-dashed border-2 border-blue-500/30 bg-blue-500/5 rounded-[2rem] overflow-hidden hover:bg-blue-500/[0.08] transition-all group cursor-pointer" onClick={handleCreateDeal}>
              <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="size-16 rounded-[1.5rem] bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/40 group-hover:scale-110 transition-transform">
                  <TrendingUp size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tighter uppercase">Launch New Deal Intelligence</h4>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Start tracking a revenue opportunity for {contact.data.company || contact.name}.</p>
                </div>
                <Button className="mt-4 bg-background text-foreground border border-border/40 hover:bg-background rounded-xl font-black text-[10px] uppercase tracking-widest px-8 h-10 group-hover:border-blue-500/50 transition-colors">
                  Create Opportunity <ChevronRight className="ml-2" size={14} />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* METRICS / HISTORY PLACEHOLDER */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm rounded-3xl p-6 flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Relationship Age</p>
                <p className="text-lg font-black tracking-tight">{Math.floor((Date.now() - new Date(contact.createdAt).getTime()) / (1000 * 60 * 60 * 24))} Days</p>
              </div>
            </Card>
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm rounded-3xl p-6 flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Data Health</p>
                <p className="text-lg font-black tracking-tight text-green-500">100% SECURE</p>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
