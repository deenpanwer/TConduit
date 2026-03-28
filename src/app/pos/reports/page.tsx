"use client";

import React, { useMemo } from 'react';
import { usePos, SaleTransaction, Product, Customer } from '@/hooks/use-pos';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
    TrendingUp, 
    Package, 
    Users, 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownRight, 
    Calendar,
    FileText,
    PieChart as PieChartIcon,
    ArrowRight
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const router = useRouter();
  const { salesHistory, products, customers, loading } = usePos();

  // --- Financial Analytics ---
  const financials = useMemo(() => {
    const totalRevenue = salesHistory.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalTax = salesHistory.reduce((sum, s) => sum + s.taxAmount, 0);
    
    const totalCost = salesHistory.reduce((acc, sale) => {
        const saleCost = sale.items.reduce((itemAcc, item) => {
            const product = products.find(p => p.id === item.productId);
            return itemAcc + (product?.costPrice || 0) * item.quantity;
        }, 0);
        return acc + saleCost;
    }, 0);

    const grossProfit = totalRevenue - totalTax - totalCost;
    const margin = totalRevenue > 0 ? (grossProfit / (totalRevenue - totalTax)) * 100 : 0;

    return { totalRevenue, totalTax, totalCost, grossProfit, margin };
  }, [salesHistory, products]);

  // --- Inventory Valuation ---
  const inventoryValuation = useMemo(() => {
    return products.reduce((acc, p) => ({
        retail: acc.retail + (p.basePrice * p.stockQuantity),
        cost: acc.retail + (p.costPrice * p.stockQuantity)
    }), { retail: 0, cost: 0 });
  }, [products]);

  // --- Top Customers ---
  const topCustomers = useMemo(() => {
    const customerSpend: Record<string, number> = {};
    salesHistory.forEach(sale => {
        if (sale.customerId) {
            customerSpend[sale.customerId] = (customerSpend[sale.customerId] || 0) + sale.grandTotal;
        }
    });

    return Object.entries(customerSpend)
        .map(([id, spend]) => ({
            name: customers.find(c => c.id === id)?.name || 'Unknown',
            spend
        }))
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5);
  }, [salesHistory, customers]);

  // --- Category Distribution ---
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
        const cat = p.category || 'Other';
        counts[cat] = (counts[cat] || 0) + p.stockQuantity;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [products]);

  return (
    <div className="p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-foreground">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Strategic Intelligence</h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Deep-dive financial and operational analytics</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest h-10 gap-2 border-border shadow-sm">
                    <Calendar className="h-4 w-4" />
                    Last 30 Days
                </Button>
                <Button className="text-[10px] font-black uppercase tracking-widest h-10 gap-2 shadow-lg">
                    <FileText className="h-4 w-4" />
                    Export PDF
                </Button>
            </div>
        </div>

        <Tabs defaultValue="financials" className="space-y-8">
            <div className="flex justify-center md:justify-start">
                <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-border flex gap-1 shadow-sm h-auto">
                    <TabsTrigger value="financials" className="data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-lg transition-all">Financials</TabsTrigger>
                    <TabsTrigger value="inventory" className="data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-lg transition-all">Inventory Insights</TabsTrigger>
                    <TabsTrigger value="customers" className="data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-lg transition-all">Customer CRM</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="financials" className="space-y-8 animate-in fade-in duration-500">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-sm bg-blue-600 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Gross Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black tracking-tighter">${financials.totalRevenue.toFixed(2)}</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold">
                                <ArrowUpRight className="h-3 w-3" /> 12.5% vs last month
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-emerald-600 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Net Profit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black tracking-tighter">${financials.grossProfit.toFixed(2)}</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold">
                                <TrendingUp className="h-3 w-3" /> Healthy Margin
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Avg. Margin</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black tracking-tighter">{financials.margin.toFixed(1)}%</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold">
                                Profitability Index
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-amber-500 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Tax Liability</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black tracking-tighter">${financials.totalTax.toFixed(2)}</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-black/60">
                                Estimated Q1 Tax
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                Profitability over Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[]}> {/* Data would be grouped sales */}
                                    <defs>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                                    <XAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                Revenue by Payment Method
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Cash', value: salesHistory.filter(s => s.paymentMethod === 'Cash').reduce((acc, s) => acc + s.grandTotal, 0) },
                                            { name: 'Card', value: salesHistory.filter(s => s.paymentMethod === 'Card').reduce((acc, s) => acc + s.grandTotal, 0) },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {COLORS.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="inventory" className="animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Category Distribution (Stock Level)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888820" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black'}} width={100} />
                                    <Tooltip cursor={{fill: '#88888810'}} />
                                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Inventory Financial Value</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-12 py-10">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Asset Value (Retail)</p>
                                <p className="text-5xl font-black text-primary tracking-tighter">${inventoryValuation.retail.toFixed(2)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-2xl bg-muted/30 border border-border">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Cost Base</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-slate-100">${inventoryValuation.cost.toFixed(2)}</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-muted/30 border border-border text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Potential Net Profit</p>
                                    <p className="text-xl font-black text-green-600">${(inventoryValuation.retail - inventoryValuation.cost).toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="customers" className="animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 border-0 shadow-xl bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Top Customers by Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topCustomers.map((cust, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-black">{idx + 1}</div>
                                            <div>
                                                <p className="font-black text-xs uppercase tracking-tight">{cust.name}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground">VIP Tier Level</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg text-primary tracking-tighter">${cust.spend.toFixed(2)}</p>
                                            <p className="text-[9px] font-black uppercase text-muted-foreground">Lifetime Value</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 flex flex-col justify-center items-center p-10 text-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                            <p className="text-4xl font-black tracking-tighter text-primary">{customers.length}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Total CRM Database</p>
                        </div>
                        <Button variant="outline" className="w-full font-black uppercase tracking-widest text-[10px] h-12 gap-2" onClick={() => router.push('/pos/customers')}>
                            Go to CRM Profile Manager
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
