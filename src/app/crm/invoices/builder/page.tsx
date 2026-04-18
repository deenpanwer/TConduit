'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCRM } from '@/hooks/use-crm';
import { useAuth } from '@/hooks/use-auth';
import { useCRMInvoices } from '@/hooks/use-crm-invoices';
import {
  ChevronLeft, ChevronRight, Save, Trash2, Plus,
  Minus, FileText, CheckCircle2, User, Building,
  CreditCard, Layout, Signature as SignatureIcon,
  Image as ImageIcon,
  Loader2,
  X,
  Upload,
  Globe,
  Settings,
  ShieldCheck,
  Package,
  Eye,
  Edit3,
  Download,
  Printer,
  Smartphone,
  Monitor,
  NotebookPen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Types ---

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  from: {
    name: string;
    email: string;
    address: string;
    phone: string;
    branding?: string; // Logo URL
  };
  to: {
    name: string;
    email: string;
    address: string;
    organization: string;
  };
  items: LineItem[];
  paymentInfo: string;
  notes: string;
  signature?: string; // Signature data/text
  branding?: string; // Root level branding
  relatedToId?: string;
  relatedToType?: 'lead' | 'deal';
}

const CURRENCIES = [
  { label: 'PKR - Pakistani Rupee', value: 'PKR' },
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
  { label: 'AED - UAE Dirham', value: 'AED' },
];

const STEPS = [
  { id: 'from-to', label: 'People', icon: User },
  { id: 'details', label: 'General', icon: FileText },
  { id: 'items', label: 'Items', icon: Package },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'summary', label: 'Sign', icon: Layout },
];

// --- Components ---

export default function InvoiceBuilder() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { leads, deals, invoices: allInvoices, updateEntity, addActivity } = useCRM();
  const { user, userData } = useAuth();
  const { addEntity: addInvoiceEntity } = useCRMInvoices();

  const relatedId = searchParams.get('id');
  const relatedType = searchParams.get('type') as 'lead' | 'deal';
  const invoiceId = searchParams.get('invoiceId');

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [brandingLogo, setBrandingLogo] = useState<string | null>(null);
  const [showPreviewOnMobile, setShowPreviewOnMobile] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'PKR',
    from: {
      name: userData?.companyName || userData?.name || user?.displayName || '',
      email: user?.email || '',
      address: '',
      phone: '',
    },
    to: {
      name: '',
      email: '',
      address: '',
      organization: '',
    },
    items: [
      { id: '1', description: 'Professional Services', quantity: 1, rate: 0 }
    ],
    paymentInfo: 'Bank: \nAccount Name: \nAccount Number: \nIBAN: ',
    notes: 'Payment is due within 7 days. Thank you!',
    relatedToId: relatedId || undefined,
    relatedToType: relatedType || undefined,
    signature: '',
  });

  const subtotal = useMemo(() => {
    return invoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  }, [invoice.items]);

  useEffect(() => {
    async function fetchOrgLogo() {
        const orgId = userData?.ownedOrgId || userData?.orgId;
        if (orgId && !invoiceId) {
            try {
                const orgDoc = await getDoc(doc(db, 'organizations', orgId));
                if (orgDoc.exists()) {
                    const data = orgDoc.data();
                    if (data.logo || data.logoUrl) {
                        setBrandingLogo(data.logo || data.logoUrl);
                    }
                    if (data.name && !invoice.from.name) {
                        updateInvoice('from.name', data.name);
                    }
                    if (data.address && !invoice.from.address) {
                        updateInvoice('from.address', data.address);
                    }
                }
            } catch (err) {
                console.error('Error fetching org logo:', err);
            }
        }
    }
    fetchOrgLogo();
  }, [userData, invoiceId]);

  useEffect(() => {
    if (invoiceId) {
      const existing = allInvoices.find(i => i.id === invoiceId);
      if (existing) {
        const existingData = existing.data as InvoiceData;
        setInvoice(prev => ({
          ...prev,
          ...existingData,
          from: { ...prev.from, ...(existingData.from || {}) },
          to: { ...prev.to, ...(existingData.to || {}) },
          items: existingData.items || prev.items
        }));
        if (existingData.branding) setBrandingLogo(existingData.branding);
        if (existingData.from?.branding) setBrandingLogo(existingData.from.branding);
      }
    }
  }, [invoiceId, allInvoices]);

  useEffect(() => {
    if (relatedId && relatedType && !invoiceId) {
      const source = relatedType === 'lead' 
        ? leads.find(l => l.id === relatedId) 
        : deals.find(d => d.id === relatedId);

      if (source) {
        setInvoice(prev => ({
          ...prev,
          to: {
            name: `${source.data?.firstName || ''} ${source.data?.lastName || source.name || ''}`.trim(),
            email: source.data?.email || '',
            address: source.data?.address || '',
            organization: source.data?.company || source.data?.organization || '',
          }
        }));
      }
    }
  }, [relatedId, relatedType, leads, deals, invoiceId]);

  const updateInvoice = (path: string, value: any) => {
    setInvoice(prev => {
      const keys = path.split('.');
      if (keys.length === 1) return { ...prev, [keys[0]]: value };
      
      const newPrev = { ...prev } as any;
      let current = newPrev;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return { ...newPrev };
    });
  };

  const addLineItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: Math.random().toString(), description: '', quantity: 1, rate: 0 }]
    }));
  };

  const removeLineItem = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter(item => item.id !== id) : prev.items
    }));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const invoicePayload = {
        ...invoice,
        amount: subtotal,
        clientName: invoice.to?.name || invoice.to?.organization || 'Unknown Client',
        branding: brandingLogo,
      };

      if (invoiceId) {
        await updateEntity(invoiceId, invoicePayload, 'invoice_updated');
        toast.success('Invoice updated!');
        router.push('/crm/invoices');
      } else {
        const resId = await addInvoiceEntity({
          name: invoice.invoiceNumber,
          data: {
            ...invoicePayload,
            status: 'draft',
          }
        });
        if (resId) {
          if (invoice.relatedToId) {
              await addActivity(invoice.relatedToId, {
                  type: 'Invoice',
                  content: `Created Invoice ${invoice.invoiceNumber} for ${invoice.currency} ${subtotal.toLocaleString()}`,
                  details: { invoiceId: resId, amount: subtotal, number: invoice.invoiceNumber }
              });
          }
          toast.success('Invoice created!');
          router.push('/crm/invoices');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    toast.info('Making PDF...');

    const invoicePages = Array.from(invoiceRef.current?.querySelectorAll('.invoice-page') || []);
    if (invoicePages.length === 0) {
        toast.error('Failed to find invoice content.');
        setIsDownloading(false);
        return;
    }

    try {
        const firstPage = invoicePages[0] as HTMLElement;
        const firstCanvas = await html2canvas(firstPage, {
            scale: 2,
            useCORS: true,
            backgroundColor: null,
        });

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [firstCanvas.width, firstCanvas.height]
        });

        pdf.addImage(firstCanvas.toDataURL('image/png'), 'PNG', 0, 0, firstCanvas.width, firstCanvas.height);

        for (let i = 1; i < invoicePages.length; i++) {
            const page = invoicePages[i] as HTMLElement;
            const canvas = await html2canvas(page, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
            });
            pdf.addPage([canvas.width, canvas.height]);
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        }

        pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
        toast.success('PDF downloaded successfully!');

    } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF.');
    } finally {
        setIsDownloading(false);
    }
  };

  const pages = useMemo(() => {
    const items = [...invoice.items];
    const p: LineItem[][] = [];
    
    // A4 Aspect Ratio is ~1:1.414. For a width of 800px, height is ~1131px.
    const PAGE_HEIGHT = 1131;
    const PADDING = 120; // Total vertical padding (p-12 md:p-16)
    const SAFE_ZONE = PAGE_HEIGHT - PADDING;

    // Height estimates in pixels (Refined for compact layout)
    const FIRST_PAGE_HEADER = 450; // Logo, Title, Amount, Dates, Parties Grid
    const SUBSEQUENT_PAGE_HEADER = 100; // Continued header
    const FOOTER_HEIGHT = 400; // Payment Info, Notes, Total, Signature
    const ITEM_BASE_HEIGHT = 50; // Base height for one line item
    const CHARS_PER_LINE = 60; 
    const LINE_HEIGHT = 16;

    let currentPageItems: LineItem[] = [];
    let currentHeight = FIRST_PAGE_HEADER;
    let isFirstPage = true;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const extraLines = Math.max(0, Math.ceil((item.description || '').length / CHARS_PER_LINE) - 1);
      const itemHeight = ITEM_BASE_HEIGHT + (extraLines * LINE_HEIGHT);

      const isLastItem = i === items.length - 1;
      const neededHeight = isLastItem ? itemHeight + FOOTER_HEIGHT : itemHeight;

      if (currentHeight + neededHeight > SAFE_ZONE) {
        // If it's the first page and even one item with footer doesn't fit, 
        // or if subsequent pages overflow
        p.push(currentPageItems);
        currentPageItems = [item];
        currentHeight = SUBSEQUENT_PAGE_HEADER + itemHeight;
        isFirstPage = false;
      } else {
        currentPageItems.push(item);
        currentHeight += itemHeight;
      }
    }

    if (currentPageItems.length > 0 || p.length === 0) {
      p.push(currentPageItems);
    }

    // If the last page still can't fit the footer, add one more empty page for it
    const lastPageItems = p[p.length - 1];
    let lastPageHeight = (p.length === 1 ? FIRST_PAGE_HEADER : SUBSEQUENT_PAGE_HEADER);
    lastPageItems.forEach(item => {
        const extraLines = Math.max(0, Math.ceil((item.description || '').length / CHARS_PER_LINE) - 1);
        lastPageHeight += ITEM_BASE_HEIGHT + (extraLines * LINE_HEIGHT);
    });

    if (lastPageHeight + FOOTER_HEIGHT > SAFE_ZONE && lastPageItems.length > 0) {
        p.push([]);
    }

    return p;
  }, [invoice.items, invoice.notes, invoice.paymentInfo]);

  return (
    <div className='flex flex-col md:flex-row h-screen bg-background overflow-hidden'>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
        .font-signature { font-family: 'Dancing Script', cursive; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
      {/* Mobile Header */}
      <div className='md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-50'>
        <Button variant='ghost' size='sm' onClick={() => router.back()} className='rounded-xl text-[10px] font-black uppercase'><ChevronLeft size={14} /></Button>
        <h2 className='text-xs font-black uppercase tracking-widest'>{invoiceId ? 'Edit' : 'New'} Invoice</h2>
        <div className='w-10' /> {/* Spacer to balance back button */}
      </div>

      {/* Left side: Form Steps */}
      <div className='w-full md:w-[450px] border-r border-border/40 flex flex-col bg-card/50 backdrop-blur-xl shrink-0'>
        <div className='p-8 border-b border-border/40 hidden md:flex items-center justify-between bg-background/50'>
          <Button variant='ghost' size='sm' onClick={() => router.back()} className='rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary/50'><ChevronLeft size={14} className='mr-2' /> Back</Button>
          <h2 className='text-sm font-black uppercase tracking-tighter'>Invoice <span className='text-blue-600'>Builder</span></h2>
        </div>

        {/* Step Progress */}
        <div className='p-4 flex gap-1 border-b border-border/40 bg-muted/10 overflow-x-auto no-scrollbar scroll-smooth'>
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={cn(
                'flex flex-col items-center justify-center min-w-[70px] aspect-square rounded-2xl transition-all gap-1',
                currentStep === idx ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105' : 'hover:bg-secondary/50 text-muted-foreground'
              )}
            >
              <step.icon size={18} strokeWidth={2.5} />
              <span className='text-[8px] font-black uppercase tracking-widest'>{step.label}</span>
            </button>
          ))}
        </div>

        <div className='flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10'>
          <AnimatePresence mode='wait'>
            {currentStep === 0 && (
              <motion.div key='step0' initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className='space-y-8'>
                <div className='space-y-6'>
                  <div className='flex items-center gap-3'>
                    <div className='size-8 rounded-xl bg-blue-500/10 flex items-center justify-center'><Building size={16} className='text-blue-600' /></div>
                    <span className='text-[11px] font-black uppercase tracking-[0.2em] text-foreground'>Your Business</span>
                  </div>
                  
                  <div className='relative group'>
                    <div className='size-24 rounded-3xl border-2 border-dashed border-border/60 flex items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all overflow-hidden group shadow-inner'>
                        {brandingLogo ? (
                            <div className='relative w-full h-full'>
                                <img src={brandingLogo} className='w-full h-full object-cover' />
                                <button onClick={(e) => { e.stopPropagation(); setBrandingLogo(null); }} className='absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity'><X size={20} /></button>
                            </div>
                        ) : (
                            <label className='flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center'>
                                <Upload size={20} className='text-muted-foreground group-hover:text-blue-500 transition-colors' />
                                <span className='text-[9px] font-black uppercase text-muted-foreground'>Logo</span>
                                <input type='file' className='hidden' accept='image/*' onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (re) => setBrandingLogo(re.target?.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }} />
                            </label>
                        )}
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Business Name</label>
                        <Input placeholder='E.G. TRAC AI' value={invoice.from.name} onChange={(e) => updateInvoice('from.name', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest px-5 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all' />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-1.5'>
                            <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Email</label>
                            <Input placeholder='HELLO@TRAC.AI' value={invoice.from.email} onChange={(e) => updateInvoice('from.email', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest px-5' />
                        </div>
                        <div className='space-y-1.5'>
                            <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Phone</label>
                            <Input placeholder='+1 234 567' value={invoice.from.phone} onChange={(e) => updateInvoice('from.phone', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest px-5' />
                        </div>
                    </div>
                    <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Address</label>
                        <Textarea placeholder='WHERE ARE YOU LOCATED?' value={invoice.from.address} onChange={(e) => updateInvoice('from.address', e.target.value)} className='bg-secondary/30 border-none rounded-2xl text-[11px] font-bold uppercase tracking-widest p-5 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[100px] resize-none' />
                    </div>
                  </div>
                </div>

                <div className='space-y-6 pt-8 border-t border-border/40'>
                  <div className='flex items-center gap-3'>
                    <div className='size-8 rounded-xl bg-purple-500/10 flex items-center justify-center'><User size={16} className='text-purple-600' /></div>
                    <span className='text-[11px] font-black uppercase tracking-[0.2em] text-foreground'>Client Info</span>
                  </div>
                  <div className='space-y-4'>
                    <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Client Name</label>
                        <Input placeholder='WHO ARE YOU BILLING?' value={invoice.to.name} onChange={(e) => updateInvoice('to.name', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest px-5' />
                    </div>
                    <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Company Name</label>
                        <Input placeholder='CLIENT BUSINESS NAME' value={invoice.to.organization} onChange={(e) => updateInvoice('to.organization', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest px-5' />
                    </div>
                    <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Client Email</label>
                        <Input placeholder='CLIENT@EMAIL.COM' value={invoice.to.email} onChange={(e) => updateInvoice('to.email', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest px-5' />
                    </div>
                    <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Client Address</label>
                        <Textarea placeholder='CLIENT BILLING ADDRESS' value={invoice.to.address} onChange={(e) => updateInvoice('to.address', e.target.value)} className='bg-secondary/30 border-none rounded-2xl text-[11px] font-bold uppercase tracking-widest p-5 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[100px] resize-none' />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div key='step1' initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className='space-y-8'>
                 <div className='space-y-6'>
                  <div className='flex items-center gap-3'>
                    <div className='size-8 rounded-xl bg-orange-500/10 flex items-center justify-center'><FileText size={16} className='text-orange-600' /></div>
                    <span className='text-[11px] font-black uppercase tracking-[0.2em] text-foreground'>Invoice Info</span>
                  </div>
                  <div className='grid grid-cols-1 gap-6'>
                    <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Invoice #</label>
                        <Input value={invoice.invoiceNumber} onChange={(e) => updateInvoice('invoiceNumber', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest px-5' />
                    </div>
                    <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Currency</label>
                        <Select value={invoice.currency} onValueChange={(val) => updateInvoice('currency', val)}>
                            <SelectTrigger className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest px-5'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className='bg-card border-border rounded-2xl shadow-2xl p-2'>
                                {CURRENCIES.map(c => <SelectItem key={c.value} value={c.value} className='text-[10px] font-black uppercase p-3 rounded-xl'>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Invoice Date</label>
                        <Input type='date' value={invoice.issueDate} onChange={(e) => updateInvoice('issueDate', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest px-5' />
                    </div>
                    <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-muted-foreground/60 ml-1'>Due Date</label>
                        <Input type='date' value={invoice.dueDate} onChange={(e) => updateInvoice('dueDate', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest px-5' />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key='step2' initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className='space-y-8'>
                 <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <div className='size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center'><Package size={16} className='text-emerald-600' /></div>
                        <span className='text-[11px] font-black uppercase tracking-[0.2em] text-foreground'>What are you billing for?</span>
                    </div>
                    <Button onClick={addLineItem} size='sm' variant='outline' className='h-10 rounded-xl text-[10px] font-black uppercase border-blue-500/20 text-blue-600 hover:bg-blue-500/5 px-4'><Plus size={14} className='mr-2' /> Add Item</Button>
                 </div>

                 <div className='space-y-6'>
                    {invoice.items.map((item, idx) => (
                        <motion.div layout key={item.id} className='p-6 bg-secondary/20 rounded-[2rem] border border-border/40 relative group'>
                            <button onClick={() => removeLineItem(item.id)} className='absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-90'><Minus size={14} /></button>
                            <div className='space-y-4'>
                                <div className='space-y-1.5'>
                                    <label className='text-[8px] font-black uppercase text-muted-foreground/60 ml-1'>Description</label>
                                    <Input 
                                        placeholder='WHAT WORK WAS DONE?' 
                                        value={item.description} 
                                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                        className='h-12 bg-background/50 border-none rounded-xl text-[11px] font-bold uppercase tracking-widest px-4' 
                                    />
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div className='space-y-1.5'>
                                        <label className='text-[8px] font-black uppercase text-muted-foreground/60 ml-1'>Quantity</label>
                                        <Input 
                                            type='number' 
                                            value={item.quantity} 
                                            onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                                            className='h-12 bg-background/50 border-none rounded-xl text-[11px] font-black px-4' 
                                        />
                                    </div>
                                    <div className='space-y-1.5'>
                                        <label className='text-[8px] font-black uppercase text-muted-foreground/60 ml-1'>Rate ({invoice.currency})</label>
                                        <Input 
                                            type='number' 
                                            value={item.rate} 
                                            onChange={(e) => updateLineItem(item.id, 'rate', Number(e.target.value))}
                                            className='h-12 bg-background/50 border-none rounded-xl text-[11px] font-black px-4' 
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                 </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key='step3' initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className='space-y-8'>
                <div className='space-y-8'>
                  <div className='p-6 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] flex items-start gap-4'>
                    <div className='size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0'><ShieldCheck className='size-5 text-amber-600' /></div>
                    <div>
                        <p className='text-[11px] font-black uppercase tracking-widest text-amber-700'>Payment Security</p>
                        <p className='text-[10px] font-bold text-amber-700/60 mt-1 uppercase leading-relaxed'>TRAC DOES NOT SAVE OR SHARE YOUR BANK DETAILS. THIS IS ONLY FOR THE INVOICE.</p>
                    </div>
                  </div>

                  <div className='space-y-6'>
                    <div className='flex items-center gap-3'>
                        <div className='size-8 rounded-xl bg-indigo-500/10 flex items-center justify-center'><CreditCard size={16} className='text-indigo-600' /></div>
                        <span className='text-[11px] font-black uppercase tracking-[0.2em] text-foreground'>How to pay?</span>
                    </div>
                    <Textarea 
                        placeholder='ENTER YOUR BANK NAME, ACCOUNT NUMBER, ETC.'
                        value={invoice.paymentInfo} 
                        onChange={(e) => updateInvoice('paymentInfo', e.target.value)} 
                        className='bg-secondary/30 border-none rounded-[2rem] text-[11px] font-mono font-bold uppercase tracking-widest p-6 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[200px] resize-none shadow-inner' 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key='step4' initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className='space-y-8'>
                 <div className='space-y-10'>
                    <div className='space-y-6'>
                        <div className='flex items-center gap-3'>
                            <div className='size-8 rounded-xl bg-rose-500/10 flex items-center justify-center'><SignatureIcon size={16} className='text-rose-600' /></div>
                            <span className='text-[11px] font-black uppercase tracking-[0.2em] text-foreground'>Sign Here</span>
                        </div>
                        {invoice.signature ? (
                            <div className='relative group'>
                                <Input 
                                    placeholder='YOUR FULL NAME' 
                                    value={invoice.signature} 
                                    onChange={(e) => updateInvoice('signature', e.target.value)} 
                                    className='h-16 bg-secondary/30 border-none rounded-2xl text-lg font-cursive italic tracking-widest px-6 focus-visible:ring-2 focus-visible:ring-blue-500/20'
                                    style={{ fontFamily: 'Dancing Script, cursive' }}
                                />
                                <button onClick={() => updateInvoice('signature', '')} className='absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all'><X size={16}/></button>
                            </div>
                        ) : (
                            <Button 
                                variant='outline' 
                                onClick={() => updateInvoice('signature', userData?.name || user?.displayName || 'Authorized Signatory')}
                                className='w-full h-32 border-dashed border-2 border-border/40 rounded-[2rem] flex flex-col gap-3 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all group'
                            >
                                <div className='size-12 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform'><Plus size={24} className='text-muted-foreground group-hover:text-blue-600 transition-colors' /></div>
                                <span className='text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-blue-600 transition-colors'>Sign This Invoice</span>
                            </Button>
                        )}
                        <p className='text-[10px] font-bold text-muted-foreground uppercase text-center italic opacity-60'>THIS SIGNATURE CONSTITUTES A LEGALLY BINDING ACCEPTANCE OF THE DOCUMENT TERMS.</p>
                    </div>

                    <div className='space-y-6 pt-8 border-t border-border/40'>
                        <div className='flex items-center gap-3'>
                            <div className='size-8 rounded-xl bg-slate-500/10 flex items-center justify-center'><NotebookPen size={16} className='text-slate-600' /></div>
                            <span className='text-[11px] font-black uppercase tracking-[0.2em] text-foreground'>Notes</span>
                        </div>
                        <Textarea 
                            placeholder='ANYTHING ELSE THE CLIENT SHOULD KNOW?'
                            value={invoice.notes} 
                            onChange={(e) => updateInvoice('notes', e.target.value)} 
                            className='bg-secondary/30 border-none rounded-[2rem] text-[11px] font-bold uppercase tracking-widest p-6 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[120px] resize-none shadow-inner' 
                        />
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className='p-8 border-t border-border/40 bg-background/80 backdrop-blur-md sticky bottom-0 z-10'>
          <div className='flex items-center justify-between gap-4'>
             {currentStep > 0 ? (
                <Button variant='ghost' onClick={() => setCurrentStep(s => s - 1)} className='flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest'>Back</Button>
             ) : (
                <div className='flex-1' />
             ) }
             
             {currentStep < STEPS.length - 1 ? (
                <Button onClick={() => setCurrentStep(s => s + 1)} className='flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/30 transition-all active:scale-95'>Next</Button>
             ) : (
                <Button onClick={handleSave} disabled={isSaving} className='flex-1 h-14 bg-foreground text-background hover:bg-foreground/90 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50'>
                    {isSaving ? <Loader2 className='animate-spin' /> : (invoiceId ? 'Update' : 'Send')}
                </Button>
             )}
          </div>
        </div>
      </div>

      {/* Right side: Preview Visualization */}
      <div className='flex-1 bg-slate-100 dark:bg-slate-900 md:overflow-y-auto p-4 md:p-12 custom-scrollbar transition-all flex flex-col items-center'>
        {/* PDF Header Controls */}
        <div className='w-full max-w-[800px] mb-8 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-border/40 shadow-xl flex items-center justify-between shrink-0'>
            <div className='flex items-center gap-3'>
                <div className='size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white'><FileText size={20} /></div>
                <div>
                    <h3 className='text-[11px] font-black uppercase tracking-widest'>Preview</h3>
                    <p className='text-[10px] font-bold text-muted-foreground uppercase'>{pages.length} Pages • {invoice.currency} {subtotal.toLocaleString()}</p>
                </div>
            </div>
            <div className='flex gap-2'>
                <Button variant='outline' size='sm' onClick={handleDownload} disabled={isDownloading} className='rounded-xl h-10 px-4 text-[10px] font-black uppercase border-border/60'>
                    {isDownloading ? <Loader2 className='animate-spin mr-2' size={14} /> : <Download size={14} className='mr-2' />}
                    Save PDF
                </Button>
                <Button variant='outline' size='sm' className='rounded-xl h-10 px-4 text-[10px] font-black uppercase border-border/60'><Printer size={14} className='mr-2' /> Print</Button>
            </div>
        </div>

        <div ref={invoiceRef} className='flex flex-col gap-12 items-center pb-20 w-full max-w-[800px]'>
            {pages.map((pageItems, pageIdx) => (
                <motion.div 
                    key={pageIdx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: pageIdx * 0.1 }}
                    className='invoice-page w-full bg-white dark:bg-slate-950 shadow-[0_40px_100px_rgba(0,0,0,0.1)] rounded-sm aspect-[1/1.4142] p-12 md:p-16 flex flex-col text-slate-800 dark:text-slate-200 relative overflow-hidden shrink-0'
                >
                    {/* Watermark/Background decoration */}
                    <div className='absolute -top-20 -right-20 size-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none' />
                    
                    {/* Header - Only on First Page */}
                    {pageIdx === 0 && (
                        <>
                            <div className='flex justify-between items-start mb-10 relative z-10'>
                                <div className='space-y-4'>
                                    {brandingLogo ? (
                                        <img src={brandingLogo} className='h-12 object-contain' alt='Branding Logo' />
                                    ) : (
                                        <div className='h-12 w-24 bg-slate-100 dark:bg-slate-900/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800'>
                                            <ImageIcon className='text-slate-300' size={20} />
                                        </div>
                                    )}
                                    <div className='space-y-1'>
                                        <h1 className='text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white'>INVOICE</h1>
                                        <p className='text-xs font-bold text-blue-600/60 tracking-[0.2em]'>#{invoice.invoiceNumber}</p>
                                    </div>
                                </div>
                                <div className='text-right space-y-6'>
                                    <div className='space-y-1'>
                                        <p className='text-[9px] font-black uppercase tracking-widest text-slate-400'>Amount Outstanding</p>
                                        <p className='text-3xl font-black text-slate-900 dark:text-white'>{invoice.currency} {subtotal.toLocaleString()}</p>
                                    </div>
                                    <div className='flex gap-6 justify-end'>
                                        <div className='text-right border-r border-slate-100 dark:border-slate-800 pr-6'>
                                            <p className='text-[8px] font-black uppercase tracking-widest text-slate-400'>Issuance Date</p>
                                            <p className='text-[10px] font-bold text-slate-700 dark:text-slate-300'>{invoice.issueDate ? format(new Date(invoice.issueDate), 'MMM d, yyyy') : '-'}</p>
                                        </div>
                                        <div className='text-right'>
                                            <p className='text-[8px] font-black uppercase tracking-widest text-slate-400'>Due Date</p>
                                            <p className='text-[10px] font-bold text-rose-500'>{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Parties Grid */}
                            <div className='grid grid-cols-2 gap-8 mb-10 relative z-10 bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800'>
                                <div className='space-y-2'>
                                    <p className='text-[9px] font-black uppercase tracking-[0.3em] text-blue-600'>FROM</p>
                                    <div className='space-y-0.5'>
                                        <p className='text-xs font-black uppercase text-slate-900 dark:text-white'>{invoice.from?.name || 'Company Name'}</p>
                                        <p className='text-[10px] font-medium opacity-60 max-w-[200px] leading-tight'>{invoice.from?.address || 'Business Address'}</p>
                                        <p className='text-[10px] font-bold opacity-80 mt-2'>{invoice.from?.email}</p>
                                        <p className='text-[10px] font-bold opacity-80'>{invoice.from?.phone}</p>                                    </div>
                                </div>
                                <div className='space-y-2 text-right'>
                                    <p className='text-[9px] font-black uppercase tracking-[0.3em] text-purple-600'>BILL TO</p>
                                    <div className='space-y-0.5'>
                                        <p className='text-xs font-black uppercase text-slate-900 dark:text-white'>{invoice.to?.name || 'Client Name'}</p>
                                        <p className='text-[10px] font-black uppercase text-blue-600'>{invoice.to?.organization}</p>
                                        <p className='text-[10px] font-medium opacity-60 ml-auto max-w-[200px] leading-tight'>{invoice.to?.address || 'Billing Address'}</p>                                        <p className='text-[10px] font-bold opacity-80 mt-2'>{invoice.to?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Continued Page Header */}
                    {pageIdx > 0 && (
                        <div className='flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4 opacity-60'>
                            <div>
                                <p className='text-[10px] font-black uppercase text-slate-400'>Invoice #{invoice.invoiceNumber}</p>
                                <p className='text-[9px] font-bold text-slate-400 uppercase'>Continued - Page {pageIdx + 1}</p>
                            </div>
                            <div className='text-right'>
                                <p className='text-[10px] font-black uppercase text-slate-900 dark:text-white'>{invoice.from?.name}</p>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className='flex-1 relative z-10'>
                        {pageItems.length > 0 ? (
                            <table className='w-full text-left'>
                                <thead>
                                    <tr className='border-b-2 border-slate-900 dark:border-white'>
                                        <th className='py-4 text-[9px] font-black uppercase tracking-[0.2em]'>Service Description</th>
                                        <th className='py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] w-20'>QTY</th>
                                        <th className='py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] w-28'>Rate</th>
                                        <th className='py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] w-28'>Amount</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 dark:divide-slate-800/50'>
                                    {pageItems.map((item) => (
                                        <tr key={item.id} className='group'>
                                            <td className='py-5 pr-4'>
                                                <p className='text-[12px] font-black uppercase text-slate-900 dark:text-white leading-tight'>{item.description || 'Professional Services'}</p>
                                            </td>
                                            <td className='py-5 text-center text-[11px] font-bold text-slate-500'>{item.quantity}</td>
                                            <td className='py-5 text-right text-[11px] font-bold text-slate-500'>{invoice.currency} {Number(item.rate).toLocaleString()}</td>
                                            <td className='py-5 text-right text-[12px] font-black text-slate-900 dark:text-white'>{invoice.currency} {(item.quantity * item.rate).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className='h-20 flex items-center justify-center border-b border-dashed border-slate-100 dark:border-slate-800 opacity-20'>
                                <p className='text-[10px] font-black uppercase tracking-widest'>Document Continuation</p>
                            </div>
                        )}
                    </div>

                    {/* Summary/Footer - Only on Last Page */}
                    {pageIdx === pages.length - 1 && (
                        <div className='mt-8 pt-8 border-t-2 border-slate-900 dark:border-white relative z-10'>
                            <div className='flex justify-between gap-12'>
                                <div className='flex-1 space-y-8'>
                                    <div className='space-y-3'>
                                        <div className='flex items-center gap-2'><div className='size-1.5 rounded-full bg-blue-600' /><p className='text-[9px] font-black uppercase tracking-[0.2em] text-slate-400'>Payment Instructions</p></div>
                                        <p className='text-[10px] font-mono font-bold whitespace-pre-wrap leading-relaxed opacity-70 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner'>
                                            {invoice.paymentInfo || 'Remittance details pending.'}
                                        </p>
                                    </div>
                                    <div className='space-y-3'>
                                        <div className='flex items-center gap-2'><div className='size-1.5 rounded-full bg-slate-400' /><p className='text-[9px] font-black uppercase tracking-[0.2em] text-slate-400'>General Terms & Conditions</p></div>
                                        <p className='text-[10px] font-bold italic opacity-50 max-w-[380px] leading-relaxed'>{invoice.notes}</p>
                                    </div>
                                </div>
                                <div className='w-56 space-y-8 text-right'>
                                    <div className='space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800'>
                                        <div className='flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400'>
                                            <span>Subtotal</span>
                                            <span>{invoice.currency} {subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className='flex justify-between text-lg font-black uppercase border-t border-slate-200 dark:border-slate-800 pt-3 text-blue-600'>
                                            <span>Total</span>
                                            <span>{invoice.currency} {subtotal.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className='pt-6'>
                                        <div className='inline-block border-b-2 border-slate-900 dark:border-white min-w-[180px] text-center pb-1'>
                                            <p className='text-xl font-signature italic tracking-[0.1em] text-slate-900 dark:text-white'>
                                                {invoice.signature || ''}
                                            </p>
                                        </div>
                                        <p className='text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2'>Authorized Acceptance</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Page Numbers */}
                    <div className='mt-16 flex items-center justify-end opacity-30 relative z-10'>
                        <p className='text-[10px] font-black uppercase tracking-[0.2em]'>PAGE {pageIdx + 1} OF {pages.length}</p>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}
