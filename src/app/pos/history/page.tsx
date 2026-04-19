"use client";

import React, { useState, useMemo } from 'react';
import { usePos, SaleTransaction } from '@/hooks/use-pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    Search, 
    Calendar, 
    Receipt, 
    Filter, 
    ArrowRight, 
    Download, 
    User, 
    CreditCard, 
    DollarSign,
    Clock,
    ChevronRight,
    ExternalLink,
    FileSpreadsheet
} from 'lucide-react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { useRouter } from 'next/navigation';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

export default function HistoryPage() {
  const router = useRouter();
  const { salesHistory, customers, loading, config } = usePos();
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- Filtering Logic ---
  const filteredHistory = useMemo(() => {
    return [...salesHistory]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter(sale => {
            const customer = customers.find(c => c.id === sale.customerId);
            const searchStr = searchQuery.toLowerCase();
            return (
                sale.id.toLowerCase().includes(searchStr) ||
                (customer && customer.name.toLowerCase().includes(searchStr)) ||
                (sale.cashierName && sale.cashierName.toLowerCase().includes(searchStr))
            );
        });
  }, [salesHistory, customers, searchQuery]);

  // --- Summary Stats ---
  const stats = useMemo(() => {
    const totalRevenue = filteredHistory.reduce((sum, s) => sum + s.grandTotal, 0);
    const avgValue = filteredHistory.length > 0 ? totalRevenue / filteredHistory.length : 0;
    const today = new Date().toDateString();
    const todayCount = filteredHistory.filter(s => new Date(s.createdAt).toDateString() === today).length;

    return { totalRevenue, avgValue, todayCount, totalCount: filteredHistory.length };
  }, [filteredHistory]);

  const handleExportCSV = () => {
    toast.info("Premium Required: Upgrade to Export", {
        description: "Unlock strategic intelligence features to grow your business.",
        action: { label: "Upgrade", onClick: () => router.push('/pricing') }
    });
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-foreground space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <Receipt className="h-8 w-8 text-primary" />
                    Sales Ledger
                </h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Audit and review historical POS transactions</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search ID, Customer, Cashier..." 
                        className="pl-10 bg-white dark:bg-slate-900 border-border font-bold h-11"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest h-11 gap-2 border-border bg-white dark:bg-slate-900 opacity-60" onClick={handleExportCSV}>
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Export
                </Button>
            </div>
        </div>

        {/* Rapid Insights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Volume</p>
                <p className="text-2xl font-black tracking-tighter text-primary">{formatCurrency(stats.totalRevenue, config?.currency)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Avg. Ticket</p>
                <p className="text-2xl font-black tracking-tighter text-emerald-600">{formatCurrency(stats.avgValue, config?.currency)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Sales</p>
                <p className="text-2xl font-black tracking-tighter">{formatNumber(stats.totalCount)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Sales Today</p>
                <p className="text-2xl font-black tracking-tighter text-blue-600">{formatNumber(stats.todayCount)}</p>
            </div>
        </div>

        {/* Transaction Table */}
        <Card className="border-0 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
            <Table>
                <TableHeader className="bg-muted/50 border-b border-border">
                    <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="font-black uppercase tracking-widest text-[10px] py-5">Date / Time</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px] py-5">Transaction ID</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px] py-5">Customer</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px] py-5">Cashier</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px] py-5 text-center">Payment</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px] py-5 text-right">Total</TableHead>
                        <TableHead className="text-right font-black uppercase tracking-widest text-[10px] py-5 w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading.history ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-64 text-center">
                                <p className="animate-pulse font-black uppercase tracking-widest text-muted-foreground">Retrieving Transaction Logs...</p>
                            </TableCell>
                        </TableRow>
                    ) : filteredHistory.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-64 text-center opacity-50">
                                <Clock className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                                <p className="font-black uppercase tracking-widest text-xs">No matching transactions found</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredHistory.map((sale) => {
                            const customer = customers.find(c => c.id === sale.customerId);
                            return (
                                <TableRow key={sale.id} className="hover:bg-muted/20 transition-colors border-border group cursor-pointer" onClick={() => router.push(`/pos/invoice/${sale.id}`)}>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-slate-100">
                                                {new Date(sale.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-[10px] font-black bg-muted px-2 py-1 rounded text-primary">
                                            #{sale.id.slice(-8).toUpperCase()}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black",
                                                customer ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {customer ? customer.name[0] : 'W'}
                                            </div>
                                            <span className="font-bold text-xs uppercase tracking-tight">
                                                {customer?.name || "Walk-in"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground italic">
                                            {sale.cashierName || 'Admin'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border",
                                            sale.paymentMethod === 'Card' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                        )}>
                                            {sale.paymentMethod === 'Card' ? <CreditCard className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                                            {sale.paymentMethod || 'Cash'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <p className="font-black text-sm tracking-tighter text-slate-900 dark:text-slate-100">
                                            {formatCurrency(sale.grandTotal, config?.currency)}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Receipt className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </Card>
    </div>
  );
}
