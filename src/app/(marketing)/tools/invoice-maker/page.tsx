'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/home/Navbar';
import { Footer } from '@/components/home/Footer';
import {
  Plus, Search, Filter, ArrowUpDown, FileText,
  Edit2, Trash, Copy, Calendar, Building, DollarSign,
  CheckCircle2, ShieldCheck, Sparkles, Download, MoreHorizontal,
  ArrowRight, Clock, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FreeInvoiceData,
  getFreeInvoices,
  deleteFreeInvoice,
  duplicateFreeInvoice,
  updateFreeInvoiceStatus
} from '@/lib/free-invoices';

export default function FreeInvoiceMakerPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<FreeInvoiceData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const loadInvoices = () => {
    const list = getFreeInvoices();
    setInvoices(list);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => {
        const number = (i.invoiceNumber || '').toLowerCase();
        const client = (i.to?.name || '').toLowerCase();
        const org = (i.to?.organization || '').toLowerCase();
        return number.includes(q) || client.includes(q) || org.includes(q);
      });
    }

    if (filterStatus) {
      result = result.filter((i) => i.status === filterStatus);
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
      if (sortBy === 'oldest') return (a.updatedAt || a.createdAt) - (b.updatedAt || b.createdAt);
      if (sortBy === 'amount') {
        const totalA = a.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
        const totalB = b.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
        return totalB - totalA;
      }
      return 0;
    });

    return result;
  }, [invoices, searchQuery, filterStatus, sortBy]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteFreeInvoice(id);
      loadInvoices();
      toast.success('Invoice deleted.');
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned = duplicateFreeInvoice(id);
    if (cloned) {
      loadInvoices();
      toast.success('Invoice duplicated!');
    }
  };

  const handleStatusChange = (id: string, newStatus: FreeInvoiceData['status']) => {
    updateFreeInvoiceStatus(id, newStatus);
    loadInvoices();
    toast.success(`Status updated to ${newStatus}`);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden flex flex-col justify-between">
      <Navbar />

      {/* Background glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full opacity-50" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-32 pb-24 max-w-7xl relative z-10 flex-1 flex flex-col">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight text-foreground">
              Free Invoice <span className="text-blue-600">Generator</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              Create, customize, and export professional high-resolution PDF invoices instantly. All documents remain securely on your device.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => router.push('/tools/invoice-maker/builder')}
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest px-8 shadow-xl shadow-blue-500/20 transition-all active:scale-95 group"
            >
              <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Content Section */}
        {isLoaded && invoices.length === 0 ? (
          /* Empty State Hero */
          <div className="my-auto py-12">
            <Card className="p-8 sm:p-14 rounded-[2.5rem] border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden text-center max-w-4xl mx-auto">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <FileText size={180} />
              </div>

              <div className="max-w-xl mx-auto space-y-6 relative z-10">
                <div className="size-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 mx-auto shadow-inner">
                  <FileText size={40} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-foreground">
                    No Invoices Created Yet
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Generate your first invoice in seconds with automated multi-page splitting, custom branding logo upload, digital signature, and instant compressed PDF export.
                  </p>
                </div>

                {/* Feature Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-secondary/40 border border-border/40 text-center">
                    <p className="text-[10px] font-black uppercase text-blue-600">Free Forever</p>
                    <p className="text-[9px] text-muted-foreground font-bold">No hidden costs</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/40 border border-border/40 text-center">
                    <p className="text-[10px] font-black uppercase text-purple-600">High-Res A4</p>
                    <p className="text-[9px] text-muted-foreground font-bold">Pixel-perfect PDF</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/40 border border-border/40 text-center">
                    <p className="text-[10px] font-black uppercase text-emerald-600">Local Privacy</p>
                    <p className="text-[9px] text-muted-foreground font-bold">Device-only data</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/40 border border-border/40 text-center">
                    <p className="text-[10px] font-black uppercase text-orange-600">Print Ready</p>
                    <p className="text-[9px] text-muted-foreground font-bold">1-Click printing</p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => router.push('/tools/invoice-maker/builder')}
                    size="lg"
                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest px-10 shadow-2xl shadow-blue-500/30 transition-all active:scale-95 group"
                  >
                    Create Your First Invoice
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1.5 transition-transform" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* Ledger Table */
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-secondary/30 p-4 rounded-3xl border border-border/40 shadow-inner">
              <div className="relative flex-1 max-w-xl group w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
                <Input
                  placeholder="SEARCH BY INVOICE # OR CLIENT NAME..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-background/70 border-border/40 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm">
                      <ArrowUpDown size={14} className="mr-2 text-blue-500" />
                      Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Highest Amount'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl">
                    <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy('newest')}>Newest First</DropdownMenuItem>
                    <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy('oldest')}>Oldest First</DropdownMenuItem>
                    <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy('amount')}>Highest Amount</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm">
                      <Filter size={14} className="mr-2 text-blue-500" /> Status: {filterStatus || 'All'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl">
                    <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setFilterStatus(null)}>All Statuses</DropdownMenuItem>
                    <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setFilterStatus('draft')}>Draft</DropdownMenuItem>
                    <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setFilterStatus('sent')}>Sent</DropdownMenuItem>
                    <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setFilterStatus('paid')}>Paid</DropdownMenuItem>
                    <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setFilterStatus('overdue')}>Overdue</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-card/40 backdrop-blur-xl rounded-[2rem] border border-border/40 overflow-y-auto overflow-x-auto shadow-2xl custom-scrollbar min-h-[400px]">
              <table className="w-full caption-bottom text-sm border-collapse">
                <TableHeader className="bg-card sticky top-0 z-10 border-b border-border/40">
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 pl-8 sticky top-0 bg-card z-10">Invoice Info</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest sticky top-0 bg-card z-10">Client</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest sticky top-0 bg-card z-10">Amount</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center sticky top-0 bg-card z-10">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest sticky top-0 bg-card z-10">Dates</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-8 sticky top-0 bg-card z-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredInvoices.map((inv) => {
                      const totalAmount = inv.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
                      return (
                        <TableRow
                          key={inv.id}
                          className="group border-b border-border/20 hover:bg-blue-500/[0.02] transition-colors h-[72px] cursor-pointer"
                          onClick={() => router.push(`/tools/invoice-maker/builder?id=${inv.id}`)}
                        >
                          <TableCell className="pl-8">
                            <div className="flex flex-col">
                              <span className="text-xs font-black uppercase tracking-tighter text-blue-600">{inv.invoiceNumber}</span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase">{inv.from?.name || 'My Business'}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-secondary/50 flex items-center justify-center border border-border/40">
                                <Building size={14} className="text-muted-foreground" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase">{inv.to?.name || 'Unnamed Client'}</span>
                                <span className="text-[9px] font-medium text-muted-foreground uppercase">{inv.to?.organization || '-'}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-black tracking-tight">{inv.currency} {totalAmount.toLocaleString()}</span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase italic">{inv.items.length} Line Items</span>
                            </div>
                          </TableCell>

                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={inv.status || 'draft'}
                              onValueChange={(val) => handleStatusChange(inv.id, val as FreeInvoiceData['status'])}
                            >
                              <SelectTrigger className={cn(
                                "h-7 w-28 text-[9px] font-black uppercase tracking-wider rounded-full border px-2 py-0 mx-auto transition-all bg-transparent",
                                inv.status === 'paid' ? 'text-green-600 border-green-500/20 hover:bg-green-500/10' :
                                inv.status === 'sent' ? 'text-blue-600 border-blue-500/20 hover:bg-blue-500/10' :
                                inv.status === 'rejected' ? 'text-red-600 border-red-500/20 hover:bg-red-500/10' :
                                inv.status === 'overdue' ? 'text-orange-600 border-orange-500/20 hover:bg-orange-500/10' :
                                'text-gray-500/60 border-gray-500/20 hover:bg-gray-500/10'
                              )}>
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent className="bg-card/95 border-border/40 backdrop-blur-xl">
                                <SelectItem value="draft" className="text-[10px] font-bold uppercase tracking-wider">Draft</SelectItem>
                                <SelectItem value="sent" className="text-[10px] font-bold uppercase tracking-wider">Sent</SelectItem>
                                <SelectItem value="paid" className="text-[10px] font-bold uppercase tracking-wider">Paid</SelectItem>
                                <SelectItem value="overdue" className="text-[10px] font-bold uppercase tracking-wider">Overdue</SelectItem>
                                <SelectItem value="rejected" className="text-[10px] font-bold uppercase tracking-wider">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase">
                                <Calendar size={10} className="text-blue-500" />
                                Issued: {inv.issueDate ? format(new Date(inv.issueDate), 'MMM d, yyyy') : '-'}
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase">
                                <Calendar size={10} className="text-red-500" />
                                Due: {inv.dueDate ? format(new Date(inv.dueDate), 'MMM d, yyyy') : '-'}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-right pr-8">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-secondary transition-all">
                                  <MoreHorizontal size={18} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border bg-card/95 backdrop-blur-xl shadow-2xl">
                                <DropdownMenuItem
                                  className="text-[10px] font-black uppercase tracking-widest p-3 rounded-xl gap-3"
                                  onClick={() => router.push(`/tools/invoice-maker/builder?id=${inv.id}`)}
                                >
                                  <Edit2 size={14} className="text-blue-500" /> Edit Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-[10px] font-black uppercase tracking-widest p-3 rounded-xl gap-3"
                                  onClick={(e) => handleDuplicate(inv.id, e)}
                                >
                                  <Copy size={14} className="text-indigo-500" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2 bg-border/20" />
                                <DropdownMenuItem
                                  className="text-[10px] font-black uppercase tracking-widest p-3 rounded-xl gap-3 text-red-500 focus:bg-red-500/10 focus:text-red-500"
                                  onClick={(e) => handleDelete(inv.id, e)}
                                >
                                  <Trash size={14} /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </AnimatePresence>

                  {filteredInvoices.length === 0 && invoices.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="size-16 rounded-3xl bg-muted/20 flex items-center justify-center border border-dashed border-border/40">
                            <FileText className="text-muted-foreground/30" size={32} />
                          </div>
                          <p className="text-xs font-bold text-muted-foreground uppercase italic">No invoices match your search or filter criteria.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
