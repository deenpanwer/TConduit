'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCRM, CRMEntity, FieldConfig } from '@/hooks/use-crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Trash2,
  Link as LinkIcon,
  Edit,
  Plus,
  Users,
  Briefcase,
  Globe,
  Check,
  X,
  Copy,
  ChevronLeft,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DealModal } from '@/components/crm/forms/DealModal';
import { ContactModal } from '@/components/crm/forms/ContactModal';

// Inline editing component
const InlineEditField = ({
  label,
  value,
  onSave,
  fieldConfig,
}: {
  label: string;
  value: any;
  onSave: (value: any) => void;
  fieldConfig: FieldConfig;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(currentValue);
    setIsEditing(false);
    toast.success(`${label} updated successfully.`);
  };

  const renderDisplay = () => {
    if (value === null || value === undefined || value === '') {
      return (
        <span className="text-muted-foreground/60 group-hover:text-blue-500">
          Add {label}...
        </span>
      );
    }
    if (fieldConfig.type === 'currency') {
      return `$${Number(value).toLocaleString()}`;
    }
    if (fieldConfig.type === 'select') {
      return (
        fieldConfig.options?.find((o) => o.value === value)?.label ||
        String(value)
      );
    }
    return String(value);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type={fieldConfig.type === 'number' ? 'number' : 'text'}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          className="h-8 bg-transparent border-blue-500/50"
        />
        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500" onClick={handleSave}><Check size={14} /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => setIsEditing(false)}><X size={14} /></Button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="group flex items-center justify-between cursor-pointer min-h-[32px] rounded-lg hover:bg-secondary p-2"
    >
      <span className="font-medium text-sm text-foreground">
        {renderDisplay()}
      </span>
      <Edit
        size={14}
        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
};

// Main Component
export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { entities, config, updateEntityField, deleteEntity, addEntity, deals, contacts } = useCRM();

  const [isCopied, setIsCopied] = useState(false);
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [organization, setOrganization] = useState<CRMEntity | undefined>();

  useEffect(() => {
    const org = entities.find((e) => e.id === id && e.type === 'organization');
    if (org) {
      setOrganization(org);
    }
  }, [entities, id]);

  const orgNameValue = useMemo(() => organization?.data.organizationName || organization?.name, [organization]);

  const organizationDeals = useMemo(() => deals.filter(d => d.data.organization === orgNameValue), [deals, orgNameValue]);
  const organizationContacts = useMemo(() => contacts.filter(c => c.data.company === orgNameValue), [contacts, orgNameValue]);

  if (!organization) {
    return (
        <div className="flex items-center justify-center h-screen bg-background text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-bold">Loading Organization...</p>
          </div>
        </div>
      );
  }
  
  const moduleConfig = config.modules.organizations;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      await deleteEntity(organization.id);
      toast.success('Organization has been deleted.');
      router.push('/crm/organizations');
    }
  };
  
  const copyLink = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="p-6 space-y-6">
        {/* Header */}
        <header className="space-y-4">
          <Button variant="ghost" onClick={() => router.push('/crm/organizations')} className="font-bold text-muted-foreground hover:bg-secondary">
             <ChevronLeft size={16} className="mr-2"/> Organizations / {orgNameValue}
          </Button>

          <div className="flex items-center gap-4 justify-between">
             <div className="flex items-center gap-4">
                <div className="size-16 rounded-xl bg-secondary flex items-center justify-center border border-border">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {String(orgNameValue || 'O').charAt(0).toUpperCase()}
                    </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{orgNameValue}</h1>
                  <a href={organization.data.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors">
                      <Globe size={14}/>
                      <span className="text-sm font-medium">{organization.data.website || 'No website'}</span>
                  </a>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="destructive" size="sm" className="font-bold text-xs uppercase tracking-widest rounded-lg" onClick={handleDelete}>
                    <Trash2 size={14} className="mr-2"/> Delete
                </Button>
                <Button variant="outline" size="sm" className="font-bold text-xs uppercase tracking-widest rounded-lg" onClick={copyLink}>
                    {isCopied ? <Check size={14} className="mr-2 text-green-500"/> : <LinkIcon size={14} className="mr-2"/>}
                    {isCopied ? 'Copied' : 'Link'}
                </Button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border/80 rounded-2xl">
              <div className="p-4 border-b border-border/80">
                <h2 className="font-bold text-sm uppercase tracking-wider">Details</h2>
              </div>
              <div className="p-4 space-y-2">
                {moduleConfig.fields.map((field) => (
                  <div key={field.id} className="grid grid-cols-3 items-center">
                    <label className="text-sm font-medium text-muted-foreground col-span-1">
                      {field.label}
                    </label>
                    <div className="col-span-2">
                      <InlineEditField
                        label={field.label}
                        value={organization.data[field.key]}
                        onSave={(newValue) => updateEntityField(organization.id, field.key, newValue)}
                        fieldConfig={field}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Deals & Contacts */}
          <div className="lg:col-span-2">
             <Tabs defaultValue="contacts" className="w-full">
               <TabsList className="grid w-full grid-cols-2 bg-card border border-border/80 rounded-xl p-1 h-auto">
                 <TabsTrigger value="deals" className="rounded-lg">
                    <Briefcase size={16} className="mr-2"/> Deals <Badge className="ml-2">{organizationDeals.length}</Badge>
                 </TabsTrigger>
                 <TabsTrigger value="contacts" className="rounded-lg">
                    <Users size={16} className="mr-2"/> Contacts <Badge className="ml-2">{organizationContacts.length}</Badge>
                 </TabsTrigger>
               </TabsList>
               
               <TabsContent value="deals" className="mt-4">
                 <div className="bg-card border border-border/80 rounded-2xl min-h-[400px] p-6 flex flex-col">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-lg">Deals <Badge className="ml-2">{organizationDeals.length}</Badge></h3>
                     <Button className="bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20" onClick={() => setIsNewDealModalOpen(true)}>
                       <Plus size={16} className="mr-2"/>New Deal
                     </Button>
                   </div>
                   <DealModal
                     isOpen={isNewDealModalOpen}
                     onOpenChange={setIsNewDealModalOpen}
                     mode="create"
                     deal={null}
                     initialData={{ organization: orgNameValue }}
                   />
                   {organizationDeals.length === 0 ? (
                     <div className="m-auto text-center">
                       <Briefcase size={40} className="mx-auto text-muted-foreground/50 mb-4"/>
                       <h3 className="font-bold text-lg">No Deals Found</h3>
                       <p className="text-sm text-muted-foreground">Add your first deal to get started.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {organizationDeals.map(deal => (
                          <div key={deal.id} className="p-4 rounded-xl border border-border/60 hover:border-blue-500/30 transition-all flex justify-between items-center group cursor-pointer" onClick={() => router.push(`/crm/deals/${deal.id}`)}>
                             <div>
                                <p className="font-bold text-sm group-hover:text-blue-500 transition-colors">{deal.name}</p>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{deal.data.status}</p>
                             </div>
                             <div className="text-right">
                                <p className="font-black text-sm text-green-500">${Number(deal.data.annualRevenue || 0).toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground font-medium">{new Date(deal.updatedAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                 </div>
               </TabsContent>

               <TabsContent value="contacts" className="mt-4">
                 <div className="bg-card border border-border/80 rounded-2xl min-h-[400px] p-6 flex flex-col">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-lg">Contacts <Badge className="ml-2">{organizationContacts.length}</Badge></h3>
                     <Button className="bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20" onClick={() => setIsNewContactModalOpen(true)}>
                       <Plus size={16} className="mr-2"/>New Contact
                     </Button>
                   </div>
                   <ContactModal
                     isOpen={isNewContactModalOpen}
                     onOpenChange={setIsNewContactModalOpen}
                     mode="create"
                     contact={null}
                     initialStage={orgNameValue}
                   />
                   {organizationContacts.length === 0 ? (
                     <div className="m-auto text-center">
                        <Users size={40} className="mx-auto text-muted-foreground/50 mb-4"/>
                       <h3 className="font-bold text-lg">No Contacts Found</h3>
                       <p className="text-sm text-muted-foreground">Add a new contact to get started.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {organizationContacts.map(contact => (
                          <div key={contact.id} className="p-4 rounded-xl border border-border/60 hover:border-blue-500/30 transition-all flex justify-between items-center group cursor-pointer" onClick={() => router.push(`/crm/contacts/${contact.id}`)}>
                             <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-secondary flex items-center justify-center border border-border">
                                   <User size={14} className="text-muted-foreground"/>
                                </div>
                                <div>
                                   <p className="font-bold text-sm group-hover:text-blue-500 transition-colors">{contact.name}</p>
                                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{contact.data.designation || 'Contact'}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="font-bold text-xs">{contact.data.email}</p>
                                <p className="text-[10px] text-muted-foreground font-medium">{contact.data.mobile}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                 </div>
               </TabsContent>
             </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}