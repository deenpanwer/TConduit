"use client";

import React, { useState } from 'react';
import { usePos } from '@/hooks/use-pos';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Settings, 
    Store, 
    Percent, 
    Database, 
    Save, 
    Trash2, 
    Download, 
    Upload,
    Info,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { config, setConfig } = usePos();
  
  const [localConfig, setLocalConfig] = useState({
    storeName: config.storeName || '',
    storeAddress: config.storeAddress || '',
    storePhone: config.storePhone || '',
    defaultTaxRate: config.defaultTaxRate || 8,
  });

  const handleSave = () => {
    setConfig({
        ...localConfig,
        defaultTaxRate: Number(localConfig.defaultTaxRate)
    });
    toast.success("Settings saved successfully!");
  };

  const handleResetData = () => {
    if (confirm("CRITICAL: This will wipe all local data (products, sales, customers). This cannot be undone. Proceed?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const handleExport = () => {
    const data = {
        products: localStorage.getItem('pos_products'),
        customers: localStorage.getItem('pos_customers'),
        history: localStorage.getItem('pos_sales_history'),
        config: localStorage.getItem('pos_config')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Backup exported!");
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-foreground space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-border">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" />
                    System Configuration
                </h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Manage store identity and core logic</p>
            </div>
            <Button onClick={handleSave} className="font-black uppercase tracking-widest text-xs h-12 px-8 gap-2 shadow-lg">
                <Save className="h-4 w-4" />
                Save Changes
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Store Information */}
            <div className="lg:col-span-2 space-y-8">
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-border/50">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Store className="h-4 w-4 text-primary" />
                            Store Identity
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold">These details will appear on all printed receipts</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Store Name</Label>
                                <Input 
                                    value={localConfig.storeName}
                                    onChange={(e) => setLocalConfig({...localConfig, storeName: e.target.value})}
                                    className="font-bold bg-muted/20 border-border h-11" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Store Phone</Label>
                                <Input 
                                    value={localConfig.storePhone}
                                    onChange={(e) => setLocalConfig({...localConfig, storePhone: e.target.value})}
                                    className="font-bold bg-muted/20 border-border h-11" 
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Store Address</Label>
                                <Input 
                                    value={localConfig.storeAddress}
                                    onChange={(e) => setLocalConfig({...localConfig, storeAddress: e.target.value})}
                                    className="font-bold bg-muted/20 border-border h-11" 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-border/50">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Percent className="h-4 w-4 text-primary" />
                            Financial Rules
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold">Global tax and discount configurations</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="max-w-xs space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Default Tax Rate (%)</Label>
                            <div className="relative">
                                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="number"
                                    value={localConfig.defaultTaxRate}
                                    onChange={(e) => setLocalConfig({...localConfig, defaultTaxRate: Number(e.target.value)})}
                                    className="font-black text-xl bg-muted/20 border-border h-12 pr-10" 
                                />
                            </div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-2 italic flex items-center gap-1">
                                <Info className="h-3 w-3" /> This rate is applied automatically to all new sales.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar Settings */}
            <div className="space-y-8">
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-border/50 bg-muted/30">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Database className="h-4 w-4 text-primary" />
                            Data Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Button 
                                variant="outline" 
                                className="w-full justify-start h-11 font-black uppercase tracking-widest text-[10px] gap-3"
                                onClick={handleExport}
                            >
                                <Download className="h-4 w-4 text-blue-500" />
                                Export Backup (.json)
                            </Button>
                            <Button 
                                variant="outline" 
                                className="w-full justify-start h-11 font-black uppercase tracking-widest text-[10px] gap-3"
                                onClick={() => toast.info("Import feature coming soon!")}
                            >
                                <Upload className="h-4 w-4 text-purple-500" />
                                Import Data
                            </Button>
                        </div>
                        <Separator />
                        <Button 
                            variant="destructive" 
                            className="w-full justify-start h-11 font-black uppercase tracking-widest text-[10px] gap-3"
                            onClick={handleResetData}
                        >
                            <Trash2 className="h-4 w-4" />
                            Factory Reset System
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-slate-900 text-white dark:bg-primary dark:text-white overflow-hidden relative">
                    <ShieldCheck className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 rotate-12" />
                    <CardHeader>
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em]">Security Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[10px] font-bold opacity-80 uppercase leading-relaxed">
                            Your POS is currently running in Local Mode. All data is encrypted and stored on this device only. 
                        </p>
                        <div className="flex items-center gap-2 mt-4">
                            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest">System Operational</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
