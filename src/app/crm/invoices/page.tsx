"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useCRMInvoices } from "@/hooks/use-crm-invoices";
import { 
  Plus, Search, Filter, Loader2,
  ExternalLink, Eye, Edit2, Trash, FileText,
  ArrowUpDown, Download, MoreHorizontal,
  Calendar, Building, User, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CRMEntity } from "@/hooks/use-crm-module";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function InvoicesPageContent() {
  const { entities: invoices, deleteEntity, loading } = useCRMInvoices();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"number" | "client" | "amount" | "updated">("updated");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    let result = invoices.filter(i => !i.isDeleted);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => {
        const number = (i.data?.invoiceNumber || "").toLowerCase();
        const client = (i.data?.clientName || "").toLowerCase();
        return number.includes(q) || client.includes(q);
      });
    }

    if (filterStatus) {
      result = result.filter(i => i.data?.status === filterStatus);
    }
    
    result.sort((a, b) => {
      if (sortBy === "number") return (a.data?.invoiceNumber || "").localeCompare(b.data?.invoiceNumber || "");
      if (sortBy === "client") return (a.data?.clientName || "").localeCompare(b.data?.clientName || "");
      if (sortBy === "amount") return (Number(b.data?.amount) || 0) - (Number(a.data?.amount) || 0);
      if (sortBy === "updated") {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : Date.now();
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : Date.now();
        return timeB - timeA;
      }
      return 0;
    });
    return result;
  }, [invoices, searchQuery, sortBy, filterStatus]);

  if (loading && invoices.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 flex flex-col h-full min-h-screen relative w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">Finance Control</span><span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" /></div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase font-poppins">Invoices <span className="text-blue-600 italic">Ledger</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => router.push('/crm/invoices/builder')} 
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-blue-500/20 border-none transition-all active:scale-95 group"
          >
            <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-3xl border border-border/20 shadow-inner">
        <div className="relative flex-1 max-w-xl group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={18} />
          <Input 
            autoFocus
            placeholder="SEARCH BY INVOICE # OR CLIENT..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-12 h-12 bg-background/50 border-border/40 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-blue-500/20" 
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm"><ArrowUpDown size={14} className="mr-2 text-blue-500" /> Sort: {sortBy}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border bg-card/95 backdrop-blur-xl">
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("number")}>Invoice Number</DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("client")}>Client Name</DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("amount")}>Total Amount</DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-bold uppercase" onClick={() => setSortBy("updated")}>Recently Updated</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-12 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm"><Filter size={14} className="mr-2 text-blue-500" /> Status: {filterStatus || 'All'}</Button></DropdownMenuTrigger>
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

      <div className="flex-1 bg-card/40 backdrop-blur-xl rounded-[2rem] border border-border/40 overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/40">
              <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 pl-8">Invoice Info</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Client</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest">Dates</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filteredInvoices.map((invoice) => (
                <TableRow 
                    key={invoice.id} 
                    className="group border-b border-border/20 hover:bg-blue-500/[0.02] transition-colors h-[72px] cursor-pointer"
                    onClick={() => router.push(`/crm/invoices/builder?invoiceId=${invoice.id}`)}
                >
                  <TableCell className="pl-8">
                    <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tighter text-blue-600">{invoice.data?.invoiceNumber}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{invoice.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-secondary/50 flex items-center justify-center border border-border/40">
                            <Building size={14} className="text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase">{invoice.data?.clientName}</span>
                            <span className="text-[9px] font-medium text-muted-foreground uppercase">{invoice.data?.to?.organization}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tight">{invoice.data?.currency} {Number(invoice.data?.amount || 0).toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase italic">{invoice.data?.items?.length || 0} Line Items</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        invoice.data?.status === 'paid' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                        invoice.data?.status === 'sent' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                        invoice.data?.status === 'overdue' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                        'bg-gray-500/10 text-gray-600 border-gray-500/20'
                    )}>
                        {invoice.data?.status || 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase">
                            <Calendar size={10} className="text-blue-500" />
                            Issued: {invoice.data?.issueDate ? format(new Date(invoice.data.issueDate), "MMM d, yyyy") : '-'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase">
                            <Calendar size={10} className="text-red-500" />
                            Due: {invoice.data?.dueDate ? format(new Date(invoice.data.dueDate), "MMM d, yyyy") : '-'}
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-secondary transition-all">
                          <MoreHorizontal size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border bg-card/95 backdrop-blur-xl shadow-2xl">
                        <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest p-3 rounded-xl gap-3" onClick={() => router.push(`/crm/invoices/builder?invoiceId=${invoice.id}`)}>
                          <Edit2 size={14} className="text-blue-500" /> Edit Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest p-3 rounded-xl gap-3">
                          <Eye size={14} className="text-blue-500" /> View / Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2 bg-border/20" />
                        {invoice.data?.relatedToId && (
                            <DropdownMenuItem 
                                className="text-[10px] font-black uppercase tracking-widest p-3 rounded-xl gap-3" 
                                onClick={() => router.push(`/crm/${invoice.data.relatedToType}s/${invoice.data.relatedToId}`)}
                            >
                                <ExternalLink size={14} className="text-indigo-500" /> Open Related {invoice.data.relatedToType}
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="my-2 bg-border/20" />
                        <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest p-3 rounded-xl gap-3 text-red-500 focus:bg-red-500/10 focus:text-red-500" onClick={() => deleteEntity(invoice.id)}>
                          <Trash size={14} /> Delete Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </AnimatePresence>
            {filteredInvoices.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <div className="size-16 rounded-3xl bg-muted/20 flex items-center justify-center border border-dashed border-border/40">
                                <FileText className="text-muted-foreground/30" size={32} />
                            </div>
                            <p className="text-xs font-bold text-muted-foreground uppercase italic">No invoices found matching your criteria.</p>
                        </div>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={
        <div className="flex-1 flex items-center justify-center min-h-screen">
            <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
    }>
      <InvoicesPageContent />
    </Suspense>
  );
}