"use client";

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  DollarSign, 
  BookMarked, 
  History, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight,
  Plus,
  ArrowRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePos } from "@/hooks/use-pos";
import { useRouter } from "next/navigation";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PosDashboardContent() {
  const router = useRouter();
  const { loading, salesHistory, products, customers, updateProductStock } = usePos();

  // --- Calculations ---
  
  const stats = useMemo(() => {
    if (loading.history || loading.products) return null;

    const totalRevenue = salesHistory.reduce((sum, sale) => sum + sale.grandTotal, 0);
    
    const today = new Date().toDateString();
    const todaySales = salesHistory.filter(sale => new Date(sale.createdAt).toDateString() === today);
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.grandTotal, 0);
    
    const atv = todaySales.length > 0 ? todayRevenue / todaySales.length : 0;
    
    const lowStockProducts = products.filter(p => p.stockQuantity < 10);
    
    // Profit Calculation (Approximate since costPrice isn't snapshotted in items)
    const totalProfit = salesHistory.reduce((acc, sale) => {
        const saleProfit = sale.items.reduce((itemAcc, item) => {
            const product = products.find(p => p.id === item.productId);
            const cost = product?.costPrice || 0;
            return itemAcc + ((item.unitPrice * (1 - item.discount / 100)) - cost) * item.quantity;
        }, 0);
        return acc + saleProfit;
    }, 0);

    return {
        totalRevenue,
        todayRevenue,
        atv,
        lowStockCount: lowStockProducts.length,
        totalProfit,
        lowStockProducts: lowStockProducts.slice(0, 5) // Top 5 critical
    };
  }, [salesHistory, products, loading]);

  // --- Chart Data ---
  const chartData = useMemo(() => {
    // Last 7 days sales
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toDateString();
    }).reverse();

    return last7Days.map(date => {
        const daySales = salesHistory.filter(s => new Date(s.createdAt).toDateString() === date);
        return {
            name: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
            revenue: daySales.reduce((sum, s) => sum + s.grandTotal, 0),
            count: daySales.length
        };
    });
  }, [salesHistory]);

  const handleQuickRestock = async (productId: string) => {
    try {
        const success = await updateProductStock(productId, 50); // Add 50 units
        if (success) toast.success("Stock updated successfully");
    } catch (e) {
        toast.error("Failed to update stock");
    }
  };

  const overviewStats = [
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue.toFixed(2) || '0.00'}`,
      description: "Lifetime earnings",
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Today's Sales",
      value: `$${stats?.todayRevenue.toFixed(2) || '0.00'}`,
      description: "Current day performance",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
        title: "Net Profit",
        value: `$${stats?.totalProfit.toFixed(2) || '0.00'}`,
        description: "Revenue minus costs",
        icon: TrendingUp,
        color: "text-purple-600",
        bgColor: "bg-purple-500/10",
    },
    {
      title: "Low Stock Alerts",
      value: stats?.lowStockCount || 0,
      description: "Items needing refill",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">POS Hub</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Live store performance and inventory pulse</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="font-black uppercase tracking-widest text-[10px] h-10 gap-2 shadow-sm"
            onClick={() => router.push('/pos/checkout')}
          >
            <Plus className="h-4 w-4" />
            New Sale
          </Button>
          <Button
            variant="outline"
            className="font-black uppercase tracking-widest text-[10px] h-10 gap-2 shadow-sm"
            onClick={() => router.push('/pos/history')}
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading.history ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl bg-muted/50" />)
        ) : (
            overviewStats.map((stat, index) => (
            <Card key={index} className={cn("border-0 shadow-sm transition-all duration-300 hover:shadow-md", stat.bgColor)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
                </CardHeader>
                <CardContent>
                <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 opacity-70">
                    {stat.description}
                </p>
                </CardContent>
            </Card>
            ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Revenue Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {loading.history ? (
                <Skeleton className="h-full w-full rounded-lg" />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fontWeight: 'bold'}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fontWeight: 'bold'}}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={4} 
                            dot={{ r: 4, strokeWidth: 2, fill: 'white' }} 
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Pulse */}
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Low Stock Pulse
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-tighter" onClick={() => router.push('/pos/inventory')}>View All</Button>
          </CardHeader>
          <CardContent>
            {loading.products ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
            ) : stats?.lowStockProducts.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-center gap-3 opacity-50">
                    <BookMarked className="h-10 w-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Inventory Healthy</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {stats?.lowStockProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 group hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{product.name}</span>
                                <span className="text-[9px] font-bold text-red-500">{product.stockQuantity} remaining</span>
                            </div>
                            <Button 
                                size="sm" 
                                className="h-8 text-[9px] font-black uppercase tracking-widest gap-1 bg-primary/10 text-primary hover:bg-primary hover:text-white border-0"
                                onClick={() => handleQuickRestock(product.id)}
                            >
                                <Plus className="h-3 w-3" /> Refill
                            </Button>
                        </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-tighter gap-1" onClick={() => router.push('/pos/history')}>
                    Full Log <ArrowRight className="h-3 w-3" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {salesHistory.slice(-5).reverse().map(sale => {
                        const customer = customers.find(c => c.id === sale.customerId);
                        return (
                            <div key={sale.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs">
                                        {sale.paymentMethod?.[0] || 'C'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase tracking-tight">
                                            {customer?.name || "Walk-in Customer"}
                                        </span>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                                            {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.cashierName || 'Admin'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-black tracking-tighter text-foreground">${sale.grandTotal.toFixed(2)}</span>
                                    <span className="text-[8px] font-black uppercase text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded leading-none mt-1">Paid</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>

        {/* Top Movers Today */}
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    Top Movers Today
                </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
                {loading.history ? (
                    <Skeleton className="h-full w-full rounded-lg" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.slice(-3)}>
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fontWeight: 'bold'}} 
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                cursor={{fill: '#88888810'}}
                            />
                            <Bar 
                                dataKey="revenue" 
                                fill="hsl(var(--primary))" 
                                radius={[6, 6, 0, 0]} 
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
