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
  EyeOff,
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
import { MobileInvoiceCanvas } from '@/components/crm/invoices/MobileInvoiceCanvas';
import { PCInvoiceCanvas } from '@/components/crm/invoices/PCInvoiceCanvas';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { exportInvoiceToCompressedPDF, printInvoiceDocument } from '@/lib/invoice-pdf-service';

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
  relatedToId?: string;
  relatedToType?: 'lead' | 'deal';
  hiddenFields?: Record<string, boolean>;
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
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const [customFileName, setCustomFileName] = useState('');

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
    hiddenFields: {},
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
    if (invoiceId && !hasInitializedRef.current) {
      const existing = allInvoices.find(i => i.id === invoiceId);
      if (existing) {
        setInvoice(existing.data as InvoiceData);
        if (existing.data.branding) setBrandingLogo(existing.data.branding);
        hasInitializedRef.current = true;
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
      
      // Deep-clone each nested level to ensure immutable updates
      const newPrev = { ...prev } as any;
      let current = newPrev;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = current[keys[i]] ? { ...current[keys[i]] } : {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newPrev;
    });
  };

  const renderToggleVisibility = (fieldKey: string) => {
    const isHidden = !!invoice.hiddenFields?.[fieldKey];
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const nextHidden = { ...invoice.hiddenFields, [fieldKey]: !isHidden };
          updateInvoice('hiddenFields', nextHidden);
        }}
        className={cn(
          "p-1 hover:bg-secondary/80 rounded transition-all text-xs flex items-center gap-1",
          isHidden ? "text-red-500" : "text-muted-foreground hover:text-foreground"
        )}
        title={isHidden ? "Show field on invoice" : "Hide field from invoice"}
      >
        {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
        <span className="text-[8px] font-bold uppercase tracking-wider">
          {isHidden ? "Hidden" : "Visible"}
        </span>
      </button>
    );
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
        clientName: invoice.to.name || invoice.to.organization,
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

    try {
      let invoicePages = Array.from(document.querySelectorAll('.invoice-page')) as HTMLElement[];
      
      // Filter to only include active/visible pages in the viewport (prevents mobile/desktop duplicate capture)
      invoicePages = invoicePages.filter(el => {
        if (el.id.startsWith('pdf-export-clone')) return false;
        let current: HTMLElement | null = el;
        while (current && current !== document.body) {
          const style = window.getComputedStyle(current);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
          }
          current = current.parentElement;
        }
        return true;
      });

      if (invoicePages.length === 0) {
        toast.error('Failed to find invoice content to export.');
        return;
      }

      const defaultFileName = (invoice.to.name || invoice.to.organization) 
        ? `Invoice_${(invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9-_]/g, '_')}_${(invoice.to.name || invoice.to.organization || '').trim().replace(/[^a-zA-Z0-9-_]/g, '_')}`
        : `Invoice_${(invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9-_]/g, '_')}`;

      const activeName = (customFileName.trim() || defaultFileName).replace(/[^a-zA-Z0-9-_ ]/g, '_').trim();
      const finalPdfName = activeName.endsWith('.pdf') ? activeName : `${activeName}.pdf`;

      await exportInvoiceToCompressedPDF(invoicePages, finalPdfName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const defaultFileName = (invoice.to.name || invoice.to.organization) 
      ? `Invoice_${(invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9-_]/g, '_')}_${(invoice.to.name || invoice.to.organization || '').trim().replace(/[^a-zA-Z0-9-_]/g, '_')}`
      : `Invoice_${(invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9-_]/g, '_')}`;

    const activeName = (customFileName.trim() || defaultFileName).replace(/[^a-zA-Z0-9-_ ]/g, '_').trim();
    printInvoiceDocument(activeName.replace('.pdf', ''));
  };

  const pages = useMemo(() => {
    const items = [...invoice.items];
    const p: LineItem[][] = [];
    
    // A4 Aspect Ratio is ~1:1.414. For a width of 800px, height is ~1131px.
    const PAGE_HEIGHT = 1131;
    const PADDING = 120; // Total vertical padding (p-12 md:p-16)
    const SAFE_ZONE = PAGE_HEIGHT - PADDING;

    // Height estimates in pixels (Refined for compact layout)
    const FIRST_PAGE_HEADER = 400; // Logo, Title, Amount, Dates, Parties Grid
    const SUBSEQUENT_PAGE_HEADER = 100; // Continued header
    const FOOTER_HEIGHT = 380; // Payment Info, Notes, Total, Signature
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
    <div className='flex flex-col md:flex-row min-h-screen md:h-screen bg-background overflow-y-auto md:overflow-y-hidden'>
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
        <Button 
          variant='ghost' 
          size='sm' 
          onClick={() => previewContainerRef.current?.scrollIntoView({ behavior: 'smooth' })} 
          className='rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-500/5'
        >
          Preview
        </Button>
      </div>

      {/* Left side: Form Steps (Compact & Sleek) */}
      <div className='w-full md:w-[350px] lg:w-[370px] xl:w-[390px] border-r border-border/40 flex flex-col bg-card/50 backdrop-blur-xl shrink-0'>
        <div className='p-4 px-6 border-b border-border/40 hidden md:flex items-center justify-between bg-background/50'>
          <Button variant='ghost' size='sm' onClick={() => router.back()} className='rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary/50'><ChevronLeft size={14} className='mr-2' /> Back</Button>
          <h2 className='text-sm font-black uppercase tracking-tighter'>Invoice <span className='text-blue-600'>Builder</span></h2>
        </div>

        {/* Step Progress */}
        <div className='p-2.5 px-3 flex gap-1.5 border-b border-border/40 bg-muted/10 overflow-x-auto no-scrollbar scroll-smooth'>
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-w-[52px] h-14 rounded-xl transition-all gap-0.5',
                currentStep === idx ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105' : 'hover:bg-secondary/50 text-muted-foreground'
              )}
            >
              <step.icon size={16} strokeWidth={2.5} />
              <span className='text-[8px] font-black uppercase tracking-widest'>{step.label}</span>
            </button>
          ))}
        </div>

        <div className='flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar space-y-8'>
          <AnimatePresence mode='wait'>
            {currentStep === 0 && (
              <motion.div key='step0' initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className='space-y-8'>
                <div className='space-y-6'>
                  <div className='flex items-center gap-3'>
                    <div className='size-8 rounded-xl bg-blue-500/10 flex items-center justify-center'><Building size={16} className='text-blue-600' /></div>
                    <span className='text-[11px] font-black uppercase tracking-[0.2em] text-foreground'>Your Business</span>
                  </div>
                  
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between ml-1'>
                        <label className='text-[9px] font-black uppercase text-muted-foreground/60'>Company Logo</label>
                        {renderToggleVisibility('from.branding')}
                    </div>
                    <div className='relative group'>
                      <div className='size-24 rounded-3xl border-2 border-dashed border-border/60 flex items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all overflow-hidden group shadow-inner'>
                          {brandingLogo ? (
                              <div className='relative w-full h-full'>
                                  <img src={brandingLogo} className='w-full h-full object-cover' alt='Logo preview' />
                                  <button type='button' onClick={(e) => { e.stopPropagation(); setBrandingLogo(null); }} className='absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity'><X size={20} /></button>
                              </div>
                          ) : (
                              <label className='flex flex-col items-center gap-1.5 cursor-pointer w-full h-full justify-center'>
                                  <Upload size={20} className='text-muted-foreground group-hover:text-blue-500 transition-colors' />
                                  <span className='text-[9px] font-black uppercase text-muted-foreground'>Upload Logo</span>
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
                  </div>

                  <div className='space-y-4'>
                    <div className='space-y-1.5'>
                        <div className='flex items-center justify-between ml-1'>
                            <label className='text-[9px] font-black uppercase text-muted-foreground/60'>Business Name</label>
                            {renderToggleVisibility('from.name')}
                        </div>
                        <Input placeholder='e.g. Acme Corp' value={invoice.from.name} onChange={(e) => updateInvoice('from.name', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all' />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-1.5'>
                            <div className='flex items-center justify-between ml-1'>
                                <label className='text-[9px] font-black uppercase text-muted-foreground/60'>Email</label>
                                {renderToggleVisibility('from.email')}
                            </div>
                            <Input placeholder='hello@trac.ai' value={invoice.from.email} onChange={(e) => updateInvoice('from.email', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5' />
                        </div>
                        <div className='space-y-1.5'>
                            <div className='flex items-center justify-between ml-1'>
                                <label className='text-[9px] font-black uppercase text-muted-foreground/60'>Phone</label>
                                {renderToggleVisibility('from.phone')}
                            </div>
                            <Input placeholder='+1 234 567' value={invoice.from.phone} onChange={(e) => updateInvoice('from.phone', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5' />
                        </div>
                    </div>
                    <div className='space-y-1.5'>
                        <div className='flex items-center justify-between ml-1'>
                            <label className='text-[9px] font-black uppercase text-muted-foreground/60'>Address</label>
                            {renderToggleVisibility('from.address')}
                        </div>
                        <Textarea placeholder='Where are you located?' value={invoice.from.address} onChange={(e) => updateInvoice('from.address', e.target.value)} className='bg-secondary/30 border-none rounded-2xl text-[11px] font-bold tracking-widest p-5 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[100px] resize-none' />
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
                        <div className='flex items-center justify-between ml-1'>
                            <label className='text-[9px] font-black uppercase text-muted-foreground/60'>Client Name</label>
                            {renderToggleVisibility('to.name')}
                        </div>
                        <Input placeholder='Who are you billing?' value={invoice.to.name} onChange={(e) => updateInvoice('to.name', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5' />
                    </div>
                    <div className='space-y-1.5'>
                        <div className='flex items-center justify-between ml-1'>
                            <label className='text-[9px] font-black uppercase text-muted-foreground/60'>Company Name</label>
                            {renderToggleVisibility('to.organization')}
                        </div>
                        <Input placeholder='Client business name' value={invoice.to.organization} onChange={(e) => updateInvoice('to.organization', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5' />
                    </div>
                    <div className='space-y-1.5'>
                        <div className='flex items-center justify-between ml-1'>
                            <label className='text-[9px] font-black uppercase text-muted-foreground/60'>Client Email</label>
                            {renderToggleVisibility('to.email')}
                        </div>
                        <Input placeholder='client@email.com' value={invoice.to.email} onChange={(e) => updateInvoice('to.email', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5' />
                    </div>
                    <div className='space-y-1.5'>
                        <div className='flex items-center justify-between ml-1'>
                            <label className='text-[9px] font-black uppercase text-muted-foreground/60'>Client Address</label>
                            {renderToggleVisibility('to.address')}
                        </div>
                        <Textarea placeholder='Client billing address' value={invoice.to.address} onChange={(e) => updateInvoice('to.address', e.target.value)} className='bg-secondary/30 border-none rounded-2xl text-[11px] font-bold tracking-widest p-5 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[100px] resize-none' />
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
                        <label className='text-[9px] font-medium text-muted-foreground/60 ml-1'>Invoice #</label>
                        <Input value={invoice.invoiceNumber} onChange={(e) => updateInvoice('invoiceNumber', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-medium px-5' />
                    </div>
                    <div className='space-y-1.5'>
                        <label className='text-[9px] font-medium text-muted-foreground/60 ml-1'>Currency</label>
                        <Select value={invoice.currency} onValueChange={(val) => updateInvoice('currency', val)}>
                            <SelectTrigger className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-medium px-5'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className='bg-card border-border rounded-2xl shadow-2xl p-2'>
                                {CURRENCIES.map(c => <SelectItem key={c.value} value={c.value} className='text-[10px] p-3 rounded-xl'>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-1.5'>
                        <div className='flex items-center justify-between ml-1'>
                            <label className='text-[9px] font-medium text-muted-foreground/60'>Invoice Date</label>
                            {renderToggleVisibility('issueDate')}
                        </div>
                        <Input type='date' value={invoice.issueDate} onChange={(e) => updateInvoice('issueDate', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-medium px-5' />
                    </div>
                    <div className='space-y-1.5'>
                        <div className='flex items-center justify-between ml-1'>
                            <label className='text-[9px] font-medium text-muted-foreground/60'>Due Date</label>
                            {renderToggleVisibility('dueDate')}
                        </div>
                        <Input type='date' value={invoice.dueDate} onChange={(e) => updateInvoice('dueDate', e.target.value)} className='h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-medium px-5' />
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
                                        placeholder='What work was done?' 
                                        value={item.description} 
                                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                        className='h-12 bg-background/50 border-none rounded-xl text-[11px] font-bold tracking-widest px-4' 
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
                  <div className='space-y-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <div className='size-8 rounded-xl bg-indigo-500/10 flex items-center justify-center'><CreditCard size={16} className='text-indigo-600' /></div>
                            <span className='text-[11px] font-black uppercase tracking-[0.2em] text-foreground'>How to pay?</span>
                        </div>
                        {renderToggleVisibility('paymentInfo')}
                    </div>
                    <Textarea 
                        placeholder='Enter bank name, account number, etc.'
                        value={invoice.paymentInfo} 
                        onChange={(e) => updateInvoice('paymentInfo', e.target.value)} 
                        className='bg-secondary/30 border-none rounded-[2rem] text-[11px] font-mono font-bold tracking-widest p-6 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[200px] resize-none shadow-inner' 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key='step4' initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className='space-y-8'>
                  <div className='space-y-10'>
                    <div className='space-y-6'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                <div className='size-8 rounded-xl bg-rose-500/10 flex items-center justify-center'><SignatureIcon size={16} className='text-rose-600' /></div>
                                <span className='text-[11px] font-black uppercase tracking-[0.2em] text-foreground'>Sign Here</span>
                            </div>
                            {renderToggleVisibility('signature')}
                        </div>
                        {invoice.signature ? (
                            <div className='relative group'>
                                <Input 
                                    placeholder='Your Full Name' 
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
                        <p className='text-[10px] font-bold text-muted-foreground uppercase text-center italic opacity-60'>This signature constitutes a legally binding acceptance of the document terms.</p>
                    </div>

                    <div className='space-y-6 pt-8 border-t border-border/40'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                <div className='size-8 rounded-xl bg-slate-500/10 flex items-center justify-center'><NotebookPen size={16} className='text-slate-600' /></div>
                                <span className='text-[11px] font-black uppercase tracking-[0.2em] text-foreground'>Notes</span>
                            </div>
                            {renderToggleVisibility('notes')}
                        </div>
                        <Textarea 
                            placeholder='Anything else the client should know?'
                            value={invoice.notes} 
                            onChange={(e) => updateInvoice('notes', e.target.value)} 
                            className='bg-secondary/30 border-none rounded-[2rem] text-[11px] font-bold tracking-widest p-6 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[120px] resize-none shadow-inner' 
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

      {/* Right side: Preview Visualization (Scrollable & Auto-fitting) */}
      <div 
        ref={previewContainerRef}
        className='w-full flex-1 bg-slate-100 dark:bg-slate-900 overflow-y-auto overflow-x-auto p-2 sm:p-4 md:px-4 md:py-6 transition-all flex flex-col items-center border-t md:border-t-0 border-border/40 min-w-0 custom-scrollbar'
      >
        {/* PDF Header Controls */}
        <div className='w-full max-w-[800px] mb-6 bg-white dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-border/40 shadow-xl flex items-center justify-between shrink-0 gap-3'>
            <div className='flex items-center gap-3 min-w-0 flex-1'>
                <div className='size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20'><FileText size={20} /></div>
                <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-1.5 flex-wrap'>
                        <h3 className='text-[11px] font-black uppercase tracking-widest text-foreground shrink-0'>Preview</h3>
                        <span className='text-muted-foreground/40 font-bold'>•</span>
                        <div className='relative flex items-center group max-w-[300px] flex-1'>
                            <input 
                                type='text'
                                value={customFileName !== '' ? customFileName : (
                                    (invoice.to.name || invoice.to.organization) 
                                      ? `Invoice_${(invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9-_]/g, '_')}_${(invoice.to.name || invoice.to.organization || '').trim().replace(/[^a-zA-Z0-9-_]/g, '_')}`
                                      : `Invoice_${(invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9-_]/g, '_')}`
                                )}
                                onChange={(e) => setCustomFileName(e.target.value)}
                                placeholder='Invoice filename'
                                className='text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/15 px-2.5 py-1 rounded-lg border border-transparent hover:border-border/60 focus:border-blue-500 outline-none transition-all w-full pr-12'
                                title='Click to rename download file'
                            />
                            <span className='absolute right-6 text-[10px] text-muted-foreground font-semibold pointer-events-none'>.pdf</span>
                            <Edit3 size={11} className='absolute right-2 text-muted-foreground/60 group-hover:text-blue-500 transition-colors pointer-events-none' />
                        </div>
                    </div>
                    <p className='text-[10px] font-bold text-muted-foreground uppercase truncate mt-0.5'>{pages.length} Pages • {invoice.currency} {subtotal.toLocaleString()}</p>
                </div>
            </div>
            <div className='flex gap-2 shrink-0'>
                <Button variant='outline' size='sm' onClick={handleDownload} disabled={isDownloading} className='rounded-xl h-10 px-4 text-[10px] font-black uppercase border-border/60 hover:bg-secondary/80'>
                    {isDownloading ? <Loader2 className='animate-spin mr-2' size={14} /> : <Download size={14} className='mr-2' />}
                    Save PDF
                </Button>
                <Button variant='outline' size='sm' onClick={handlePrint} className='rounded-xl h-10 px-4 text-[10px] font-black uppercase border-border/60 hover:bg-secondary/80'><Printer size={14} className='mr-2' /> Print</Button>
            </div>
        </div>

        {/* Mobile View Canvas */}
        <div className='block md:hidden w-full max-w-lg mt-4'>
            <MobileInvoiceCanvas invoice={invoice} subtotal={subtotal} brandingLogo={brandingLogo} />
        </div>
        {/* PC View Canvas (Full preview, auto-scaled, scrollable, non-cropped) */}
        <div className='hidden md:block w-full max-w-[840px]'>
            <PCInvoiceCanvas 
                invoice={invoice} 
                subtotal={subtotal} 
                brandingLogo={brandingLogo} 
                invoiceRef={invoiceRef} 
            />
        </div>
      </div>
    </div>
  );
}
