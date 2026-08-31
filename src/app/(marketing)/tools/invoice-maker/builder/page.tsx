'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Plus, Minus, FileText, CheckCircle2, User, Building,
  CreditCard, Layout, Signature as SignatureIcon,
  Image as ImageIcon, Loader2, X, Upload, Package,
  Eye, EyeOff, Edit3, Download, Printer, Smartphone, Monitor,
  NotebookPen, ArrowLeft
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
import { exportInvoiceToCompressedPDF, printInvoiceDocument } from '@/lib/invoice-pdf-service';
import { 
  FreeInvoiceData, 
  FreeLineItem, 
  getFreeInvoiceById, 
  saveFreeInvoice 
} from '@/lib/free-invoices';
import { FreePCInvoiceCanvas } from '@/components/tools/invoice-maker/FreePCInvoiceCanvas';
import { FreeMobileInvoiceCanvas } from '@/components/tools/invoice-maker/FreeMobileInvoiceCanvas';

const CURRENCIES = [
  { label: 'PKR - Pakistani Rupee', value: 'PKR' },
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
  { label: 'AED - UAE Dirham', value: 'AED' },
  { label: 'CAD - Canadian Dollar', value: 'CAD' },
  { label: 'AUD - Australian Dollar', value: 'AUD' },
  { label: 'SAR - Saudi Riyal', value: 'SAR' },
  { label: 'INR - Indian Rupee', value: 'INR' },
];

const STEPS = [
  { id: 'from-to', label: 'People', icon: User },
  { id: 'details', label: 'General', icon: FileText },
  { id: 'items', label: 'Items', icon: Package },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'summary', label: 'Sign & Notes', icon: Layout },
];

function FreeInvoiceBuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('id');

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [brandingLogo, setBrandingLogo] = useState<string | null>(null);
  const [showPreviewOnMobile, setShowPreviewOnMobile] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const [customFileName, setCustomFileName] = useState('');

  const [invoice, setInvoice] = useState<FreeInvoiceData>({
    id: '',
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'USD',
    from: {
      name: '',
      email: '',
      address: '',
      phone: '',
      branding: '',
    },
    to: {
      name: '',
      email: '',
      address: '',
      organization: '',
    },
    items: [
      { id: '1', description: 'Web Design & Development', quantity: 1, rate: 1200 },
      { id: '2', description: 'SEO & Performance Optimization', quantity: 1, rate: 450 }
    ],
    paymentInfo: 'Bank Name: Silicon Valley Bank\nAccount Name: Acme Corp\nAccount Number: 9876543210\nRouting / Swift: SVBUSA11',
    notes: 'Payment is due within 7 days of invoice date. Thank you for your business!',
    signature: 'John Doe',
    hiddenFields: {},
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  const subtotal = useMemo(() => {
    return invoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  }, [invoice.items]);

  useEffect(() => {
    if (editId && !hasInitializedRef.current) {
      const existing = getFreeInvoiceById(editId);
      if (existing) {
        setInvoice(existing);
        if (existing.from?.branding) setBrandingLogo(existing.from.branding);
        hasInitializedRef.current = true;
      }
    }
  }, [editId]);

  const updateInvoice = (field: string, value: any) => {
    setInvoice((prev) => {
      const next = { ...prev };
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        (next as any)[parent] = { ...(next as any)[parent], [child]: value };
      } else {
        (next as any)[field] = value;
      }
      return next;
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo image must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBrandingLogo(result);
        updateInvoice('from.branding', result);
        toast.success('Logo uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setBrandingLogo(null);
    updateInvoice('from.branding', '');
  };

  const toggleFieldVisibility = (fieldKey: string) => {
    setInvoice((prev) => {
      const hidden = { ...(prev.hiddenFields || {}) };
      hidden[fieldKey] = !hidden[fieldKey];
      return { ...prev, hiddenFields: hidden };
    });
  };

  const renderToggleVisibility = (fieldKey: string) => {
    const isHidden = invoice.hiddenFields?.[fieldKey];
    return (
      <button
        type="button"
        onClick={() => toggleFieldVisibility(fieldKey)}
        className={cn(
          "size-6 flex items-center justify-center rounded-lg transition-all",
          isHidden 
            ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" 
            : "text-muted-foreground/40 hover:text-foreground hover:bg-secondary/80"
        )}
        title={isHidden ? "Field is hidden from PDF" : "Hide field from PDF"}
      >
        {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    );
  };

  const addLineItem = () => {
    const newItem: FreeLineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
    };
    setInvoice((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeLineItem = (id: string) => {
    if (invoice.items.length <= 1) {
      toast.error('Invoice must contain at least one line item.');
      return;
    }
    setInvoice((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
  };

  const updateLineItem = (id: string, field: keyof FreeLineItem, value: any) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      const saved = saveFreeInvoice({
        ...invoice,
        id: editId || undefined,
        from: {
          ...invoice.from,
          branding: brandingLogo || undefined
        }
      });
      setInvoice(saved);
      toast.success('Invoice saved locally to your device!');
      router.push('/tools/invoice-maker');
    } catch (err: any) {
      toast.error(`Failed to save invoice: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const defaultFileName = (invoice.to.name || invoice.to.organization) 
    ? `Invoice_${(invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9-_]/g, '_')}_${(invoice.to.name || invoice.to.organization || '').trim().replace(/[^a-zA-Z0-9-_]/g, '_')}`
    : `Invoice_${(invoice.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9-_]/g, '_')}`;

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);
    try {
      const pages = Array.from(invoiceRef.current.querySelectorAll('.invoice-page')) as HTMLElement[];
      const activeName = (customFileName.trim() || defaultFileName).replace(/[^a-zA-Z0-9-_ ]/g, '_').trim();
      const finalPdfName = activeName.endsWith('.pdf') ? activeName : `${activeName}.pdf`;
      await exportInvoiceToCompressedPDF(pages, finalPdfName);
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const activeName = (customFileName.trim() || defaultFileName).replace(/[^a-zA-Z0-9-_ ]/g, '_').trim();
    printInvoiceDocument(activeName);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Left side: Form Input Section */}
      <div className="w-full md:w-[480px] lg:w-[520px] shrink-0 border-r border-border/40 flex flex-col h-full bg-card/60 backdrop-blur-xl z-20">
        {/* Header */}
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/tools/invoice-maker">
              <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-secondary">
                <ArrowLeft size={16} />
              </Button>
            </Link>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Free Invoice Builder</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreviewOnMobile(!showPreviewOnMobile)}
              className="text-[10px] font-black uppercase tracking-widest h-9 rounded-xl"
            >
              {showPreviewOnMobile ? <Monitor size={14} className="mr-1.5" /> : <Smartphone size={14} className="mr-1.5" />}
              {showPreviewOnMobile ? 'Edit Form' : 'Preview'}
            </Button>
          </div>
        </div>

        {/* Step Tabs Navigation */}
        <div className="flex border-b border-border/40 bg-secondary/20 p-1.5 gap-1 overflow-x-auto custom-scrollbar shrink-0">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === idx;
            const isDone = currentStep > idx;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  'flex-1 min-w-[75px] py-2.5 px-2 rounded-xl flex flex-col items-center gap-1 transition-all text-center relative',
                  isActive ? 'bg-background shadow-md text-foreground' : 'text-muted-foreground/60 hover:text-foreground'
                )}
              >
                <div className="flex items-center justify-center size-6">
                  {isDone ? <CheckCircle2 size={15} className="text-blue-500" /> : <Icon size={15} className={cn(isActive ? 'text-blue-600' : '')} />}
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider truncate w-full">{step.label}</span>
                {isActive && (
                  <motion.div layoutId="freeActiveTab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Form Content - Step Panels */}
        <div className={cn("flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6", showPreviewOnMobile && "hidden md:block")}>
          <AnimatePresence mode="wait">
            {/* Step 0: People */}
            {currentStep === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                {/* Business Info */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center"><Building size={16} className="text-blue-600" /></div>
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Your Business</span>
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground/60">Company Logo</label>
                      {renderToggleVisibility('from.branding')}
                    </div>
                    {brandingLogo ? (
                      <div className="relative group p-3 bg-secondary/30 rounded-2xl border border-border/40 flex items-center justify-between">
                        <img src={brandingLogo} alt="Logo preview" className="h-10 max-w-[140px] object-contain rounded-lg" />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="size-8 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                          title="Remove logo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-border/40 hover:border-blue-500/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-secondary/10 hover:bg-blue-500/5 transition-all">
                        <Upload size={18} className="text-muted-foreground/60" />
                        <span className="text-[10px] font-bold text-muted-foreground">Click to upload logo (PNG, JPG, SVG)</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground/60">Business Name</label>
                        {renderToggleVisibility('from.name')}
                      </div>
                      <Input placeholder="e.g. Acme Studio LLC" value={invoice.from.name} onChange={(e) => updateInvoice('from.name', e.target.value)} className="h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[9px] font-black uppercase text-muted-foreground/60">Email</label>
                          {renderToggleVisibility('from.email')}
                        </div>
                        <Input placeholder="billing@acme.com" value={invoice.from.email} onChange={(e) => updateInvoice('from.email', e.target.value)} className="h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[9px] font-black uppercase text-muted-foreground/60">Phone</label>
                          {renderToggleVisibility('from.phone')}
                        </div>
                        <Input placeholder="+1 234 567 890" value={invoice.from.phone} onChange={(e) => updateInvoice('from.phone', e.target.value)} className="h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground/60">Business Address</label>
                        {renderToggleVisibility('from.address')}
                      </div>
                      <Textarea placeholder="123 Innovation Way, Suite 400, San Francisco, CA" value={invoice.from.address} onChange={(e) => updateInvoice('from.address', e.target.value)} className="bg-secondary/30 border-none rounded-2xl text-[11px] font-bold tracking-widest p-5 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[90px] resize-none" />
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="space-y-6 pt-8 border-t border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-purple-500/10 flex items-center justify-center"><User size={16} className="text-purple-600" /></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Client Info</span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground/60">Client Contact Person</label>
                        {renderToggleVisibility('to.name')}
                      </div>
                      <Input placeholder="e.g. Sarah Connor" value={invoice.to.name} onChange={(e) => updateInvoice('to.name', e.target.value)} className="h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground/60">Company Name</label>
                        {renderToggleVisibility('to.organization')}
                      </div>
                      <Input placeholder="e.g. Cyberdyne Systems" value={invoice.to.organization} onChange={(e) => updateInvoice('to.organization', e.target.value)} className="h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground/60">Client Email</label>
                        {renderToggleVisibility('to.email')}
                      </div>
                      <Input placeholder="client@company.com" value={invoice.to.email} onChange={(e) => updateInvoice('to.email', e.target.value)} className="h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-black tracking-widest px-5" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground/60">Client Billing Address</label>
                        {renderToggleVisibility('to.address')}
                      </div>
                      <Textarea placeholder="456 Tech Park, New York, NY" value={invoice.to.address} onChange={(e) => updateInvoice('to.address', e.target.value)} className="bg-secondary/30 border-none rounded-2xl text-[11px] font-bold tracking-widest p-5 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[90px] resize-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: General Info */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-orange-500/10 flex items-center justify-center"><FileText size={16} className="text-orange-600" /></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Invoice Details</span>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-medium text-muted-foreground/60 ml-1">Invoice Number</label>
                      <Input value={invoice.invoiceNumber} onChange={(e) => updateInvoice('invoiceNumber', e.target.value)} className="h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-medium px-5" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-medium text-muted-foreground/60 ml-1">Currency</label>
                      <Select value={invoice.currency} onValueChange={(val) => updateInvoice('currency', val)}>
                        <SelectTrigger className="h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-medium px-5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto">
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.value} value={c.value} className="text-[10px] p-3 rounded-xl">{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] font-medium text-muted-foreground/60">Issue Date</label>
                        {renderToggleVisibility('issueDate')}
                      </div>
                      <Input type="date" value={invoice.issueDate} onChange={(e) => updateInvoice('issueDate', e.target.value)} className="h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-medium px-5" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] font-medium text-muted-foreground/60">Due Date</label>
                        {renderToggleVisibility('dueDate')}
                      </div>
                      <Input type="date" value={invoice.dueDate} onChange={(e) => updateInvoice('dueDate', e.target.value)} className="h-14 bg-secondary/30 border-none rounded-2xl text-[11px] font-medium px-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Line Items */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Package size={16} className="text-emerald-600" /></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Line Items</span>
                  </div>
                  <Button onClick={addLineItem} size="sm" variant="outline" className="h-10 rounded-xl text-[10px] font-black uppercase border-blue-500/20 text-blue-600 hover:bg-blue-500/5 px-4">
                    <Plus size={14} className="mr-2" /> Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {invoice.items.map((item, idx) => (
                    <motion.div layout key={item.id} className="p-6 bg-secondary/20 rounded-[2rem] border border-border/40 relative group">
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-90"
                        title="Remove item"
                      >
                        <Minus size={14} />
                      </button>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-muted-foreground/60 ml-1">Description #{idx + 1}</label>
                          <Input
                            placeholder="What work was performed?"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            className="h-12 bg-background/50 border-none rounded-xl text-[11px] font-bold tracking-widest px-4"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase text-muted-foreground/60 ml-1">Quantity</label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                              className="h-12 bg-background/50 border-none rounded-xl text-[11px] font-black px-4"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase text-muted-foreground/60 ml-1">Rate ({invoice.currency})</label>
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateLineItem(item.id, 'rate', Number(e.target.value))}
                              className="h-12 bg-background/50 border-none rounded-xl text-[11px] font-black px-4"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment Instructions */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-indigo-500/10 flex items-center justify-center"><CreditCard size={16} className="text-indigo-600" /></div>
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Remittance Info</span>
                    </div>
                    {renderToggleVisibility('paymentInfo')}
                  </div>
                  <Textarea
                    placeholder="Enter bank name, account number, swift code, etc."
                    value={invoice.paymentInfo}
                    onChange={(e) => updateInvoice('paymentInfo', e.target.value)}
                    className="bg-secondary/30 border-none rounded-[2rem] text-[11px] font-mono font-bold tracking-widest p-6 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[220px] resize-none shadow-inner leading-relaxed"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 4: Signature & Notes */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="space-y-10">
                  {/* Signature */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-rose-500/10 flex items-center justify-center"><SignatureIcon size={16} className="text-rose-600" /></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Authorized Signature</span>
                      </div>
                      {renderToggleVisibility('signature')}
                    </div>
                    {invoice.signature ? (
                      <div className="relative group">
                        <Input
                          placeholder="Your Full Name"
                          value={invoice.signature}
                          onChange={(e) => updateInvoice('signature', e.target.value)}
                          className="h-16 bg-secondary/30 border-none rounded-2xl text-lg font-cursive italic tracking-widest px-6 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                          style={{ fontFamily: 'Dancing Script, cursive' }}
                        />
                        <button
                          type="button"
                          onClick={() => updateInvoice('signature', '')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => updateInvoice('signature', invoice.from.name || 'Authorized Signatory')}
                        className="w-full h-28 border-dashed border-2 border-border/40 rounded-[2rem] flex flex-col gap-3 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all group"
                      >
                        <div className="size-10 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={20} className="text-muted-foreground group-hover:text-blue-600 transition-colors" /></div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-blue-600 transition-colors">Add Digital Signature</span>
                      </Button>
                    )}
                    <p className="text-[10px] font-bold text-muted-foreground uppercase text-center italic opacity-60">This signature provides a professional authorized sign-off on your exported PDF.</p>
                  </div>

                  {/* Notes / Terms */}
                  <div className="space-y-6 pt-8 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-slate-500/10 flex items-center justify-center"><NotebookPen size={16} className="text-slate-600" /></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Terms & Notes</span>
                      </div>
                      {renderToggleVisibility('notes')}
                    </div>
                    <Textarea
                      placeholder="Payment terms, late fee policy, or thank you note..."
                      value={invoice.notes}
                      onChange={(e) => updateInvoice('notes', e.target.value)}
                      className="bg-secondary/30 border-none rounded-[2rem] text-[11px] font-bold tracking-widest p-6 focus-visible:ring-2 focus-visible:ring-blue-500/20 min-h-[120px] resize-none shadow-inner leading-relaxed"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border/40 bg-background/80 backdrop-blur-md sticky bottom-0 z-10 shrink-0">
          <div className="flex items-center justify-between gap-4">
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={() => setCurrentStep((s) => s - 1)} className="flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest">
                Back
              </Button>
            ) : (
              <div className="flex-1" />
            )}

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={() => setCurrentStep((s) => s + 1)} className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/30 transition-all active:scale-95">
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-14 bg-foreground text-background hover:bg-foreground/90 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" /> : (editId ? 'Update Invoice' : 'Save Invoice')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Preview Visualization */}
      <div
        ref={previewContainerRef}
        className={cn(
          "w-full flex-1 bg-slate-100 dark:bg-slate-900 overflow-y-auto overflow-x-auto p-2 sm:p-4 md:px-4 md:py-6 transition-all flex flex-col items-center border-t md:border-t-0 border-border/40 min-w-0 custom-scrollbar",
          !showPreviewOnMobile && "hidden md:flex"
        )}
      >
        {/* PDF Header Controls */}
        <div className="w-full max-w-[800px] mb-6 bg-white dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-border/40 shadow-xl flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20"><FileText size={20} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground shrink-0">Live Preview</h3>
                <span className="text-muted-foreground/40 font-bold">•</span>
                <div className="relative flex items-center group max-w-[300px] flex-1">
                  <input
                    type="text"
                    value={customFileName !== '' ? customFileName : defaultFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    placeholder="Invoice filename"
                    className="text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus:bg-black/10 dark:focus:bg-white/15 px-2.5 py-1 rounded-lg border border-transparent hover:border-border/60 focus:border-blue-500 outline-none transition-all w-full pr-12"
                    title="Click to customize download filename"
                  />
                  <span className="absolute right-6 text-[10px] text-muted-foreground font-semibold pointer-events-none">.pdf</span>
                  <Edit3 size={11} className="absolute right-2 text-muted-foreground/60 group-hover:text-blue-500 transition-colors pointer-events-none" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase truncate mt-0.5">Total: {invoice.currency} {subtotal.toLocaleString()} • Auto A4 Split</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading} className="rounded-xl h-10 px-4 text-[10px] font-black uppercase border-border/60 hover:bg-secondary/80">
              {isDownloading ? <Loader2 className="animate-spin mr-2" size={14} /> : <Download size={14} className="mr-2" />}
              Save PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl h-10 px-4 text-[10px] font-black uppercase border-border/60 hover:bg-secondary/80">
              <Printer size={14} className="mr-2" /> Print
            </Button>
          </div>
        </div>

        {/* Mobile View Canvas */}
        <div className="block md:hidden w-full max-w-lg mt-4">
          <FreeMobileInvoiceCanvas invoice={invoice} subtotal={subtotal} brandingLogo={brandingLogo} />
        </div>
        {/* PC View Canvas (Full preview, auto-scaled, scrollable, non-cropped) */}
        <div className="hidden md:block w-full max-w-[840px]">
          <FreePCInvoiceCanvas
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

export default function FreeInvoiceBuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    }>
      <FreeInvoiceBuilderContent />
    </Suspense>
  );
}
