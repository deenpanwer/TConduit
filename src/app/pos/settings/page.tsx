"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { usePos, PosConfig, PosTable } from '@/hooks/use-pos';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
    Settings, 
    Store, 
    Percent, 
    Database, 
    Save, 
    HelpCircle,
    AlertCircle,
    Utensils,
    Plus,
    X,
    CheckCircle2,
    Circle,
    ShieldCheck,
    Users,
    Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * POS SETTINGS PAGE (BUSINESS OWNER EDITION)
 */

export default function SettingsPage() {
  const { config, setConfig, tables, addTable, deleteTable, updateTable } = usePos();
  const [localConfig, setLocalConfig] = useState<PosConfig>(config);
  const [activeFloorConfig, setActiveFloorConfig] = useState<string | null>(null);

  useEffect(() => {
    setLocalConfig(config);
    if (!activeFloorConfig && config.floors.length > 0) {
        setActiveFloorConfig(config.floors[0]);
    }
  }, [config, activeFloorConfig]);

  const isDirty = useMemo(() => {
    return JSON.stringify(localConfig) !== JSON.stringify(config);
  }, [localConfig, config]);

  const handleSave = async (updatedConfig?: PosConfig) => {
    try {
        const toSave = updatedConfig || localConfig;
        await setConfig(toSave);
        toast.success("Settings synced to cloud!");
    } catch (e) {
        toast.error("Failed to save settings");
    }
  };

  const toggleRestaurantMode = async (enabled: boolean) => {
    const newConfig = { ...localConfig, isRestaurantMode: enabled };
    setLocalConfig(newConfig);
    await handleSave(newConfig);
  };

  const addFloor = () => {
    setLocalConfig({
        ...localConfig,
        floors: [...localConfig.floors, `Area ${localConfig.floors.length + 1}`]
    });
  };

  const removeFloor = (index: number) => {
    const floorName = localConfig.floors[index];
    const hasTables = tables.some(t => t.floor === floorName);
    if (hasTables) {
        toast.error(`Cannot remove ${floorName}. Delete its tables first.`);
        return;
    }
    const newFloors = [...localConfig.floors];
    newFloors.splice(index, 1);
    setLocalConfig({ ...localConfig, floors: newFloors });
  };

  const updateFloorName = (index: number, name: string) => {
    const newFloors = [...localConfig.floors];
    newFloors[index] = name;
    setLocalConfig({ ...localConfig, floors: newFloors });
  };

  const setupSteps = [
    { name: "Shop Name", done: !!localConfig.storeName },
    { name: "Tax Rate", done: true },
    { name: "Shop Location", done: !!localConfig.storeAddress },
    { name: "Restaurant Setup", done: localConfig.isRestaurantMode ? localConfig.floors.length > 0 : true }
  ];

  const floorTables = useMemo(() => {
    return tables.filter(t => t.floor === activeFloorConfig);
  }, [tables, activeFloorConfig]);

  return (
    <div className="p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-foreground space-y-8 pb-32">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <Settings className="h-10 w-10 text-primary" />
                    Shop Setup
                </h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Manage your business profile and rules</p>
            </div>
            
            <div className="flex items-center gap-4">
                {isDirty && (
                    <div className="flex items-center gap-2 text-orange-500 animate-pulse">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Unsaved Changes</span>
                    </div>
                )}
                <Button 
                    onClick={() => handleSave()} 
                    disabled={!isDirty}
                    className={cn(
                        "font-black uppercase tracking-widest text-xs h-14 px-10 gap-2 shadow-xl transition-all",
                        isDirty ? "bg-primary hover:scale-105" : "bg-muted text-muted-foreground grayscale cursor-not-allowed opacity-50"
                    )}
                >
                    <Save className="h-5 w-5" />
                    Sync with Cloud
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
                
                {/* 1. Basic Shop Info */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Store className="h-5 w-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest">General Profile</h2>
                    </div>
                    <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 p-2">
                        <CardContent className="pt-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Shop Name</Label>
                                    <Input 
                                        placeholder="e.g. Trac Coffee Co."
                                        value={localConfig.storeName}
                                        onChange={(e) => setLocalConfig({...localConfig, storeName: e.target.value})}
                                        className="font-black text-lg bg-muted/10 border-border h-14 rounded-xl focus:ring-primary" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Contact Number</Label>
                                    <Input 
                                        placeholder="+1 234 567 890"
                                        value={localConfig.storePhone}
                                        onChange={(e) => setLocalConfig({...localConfig, storePhone: e.target.value})}
                                        className="font-black text-lg bg-muted/10 border-border h-14 rounded-xl" 
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Shop Address</Label>
                                    <Input 
                                        placeholder="123 Business Way, New York, NY"
                                        value={localConfig.storeAddress}
                                        onChange={(e) => setLocalConfig({...localConfig, storeAddress: e.target.value})}
                                        className="font-black text-lg bg-muted/10 border-border h-14 rounded-xl" 
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 2. Restaurant Toggle */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Utensils className="h-5 w-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Hospitality Features</h2>
                    </div>
                    <Card className={cn(
                        "border-0 shadow-lg transition-all duration-500 overflow-hidden relative group",
                        localConfig.isRestaurantMode ? "bg-primary text-white" : "bg-white dark:bg-slate-900"
                    )}>
                        <Utensils className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 rotate-12 pointer-events-none" />
                        <CardHeader className="p-8 relative z-10">
                            <div className="flex justify-between items-center gap-8">
                                <div className="space-y-1">
                                    <CardTitle className="text-2xl font-black uppercase tracking-tighter">
                                        Restaurant Mode
                                    </CardTitle>
                                    <p className={cn(
                                        "text-xs font-bold uppercase tracking-wide",
                                        localConfig.isRestaurantMode ? "text-white/80" : "text-muted-foreground"
                                    )}>
                                        Enable table management, seating maps, and multi-round orders.
                                    </p>
                                </div>
                                <Switch 
                                    id="restaurant-mode"
                                    key={`restaurant-mode-${localConfig.isRestaurantMode}`}
                                    checked={localConfig.isRestaurantMode}
                                    onCheckedChange={(enabled) => {
                                        const newConfig = { ...localConfig, isRestaurantMode: enabled };
                                        setLocalConfig(newConfig);
                                        toggleRestaurantMode(enabled);
                                    }}
                                    className="data-[state=checked]:bg-white data-[state=unchecked]:bg-slate-200"
                                />
                            </div>
                        </CardHeader>
                    </Card>
                </section>

                {/* 3. Restaurant Areas & Table Config */}
                {localConfig.isRestaurantMode && (
                    <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-2 mb-2">
                            <Database className="h-5 w-5 text-primary" />
                            <h2 className="text-sm font-black uppercase tracking-widest">Floor & Table Setup</h2>
                        </div>
                        
                        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 p-2">
                            <CardContent className="pt-8 space-y-8">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Dining Areas</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {localConfig.floors.map((floor, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 bg-muted/30 rounded-xl border border-border group">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary">{idx + 1}</div>
                                                <Input 
                                                    value={floor}
                                                    onChange={(e) => updateFloorName(idx, e.target.value)}
                                                    className="font-black bg-transparent border-none focus-visible:ring-0 text-base p-0 flex-1"
                                                />
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-10 w-10 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeFloor(idx)}
                                                    disabled={localConfig.floors.length <= 1}
                                                >
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button 
                                            variant="outline" 
                                            className="h-14 border-dashed border-2 rounded-xl font-black uppercase tracking-widest text-xs gap-2"
                                            onClick={addFloor}
                                        >
                                            <Plus className="h-5 w-5" /> Add Area
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Table Layout</Label>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Managing tables for:</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {localConfig.floors.map(f => (
                                                <Button 
                                                    key={f} 
                                                    size="sm" 
                                                    variant={activeFloorConfig === f ? 'default' : 'outline'}
                                                    onClick={() => setActiveFloorConfig(f)}
                                                    className="text-[9px] font-black uppercase tracking-widest h-8"
                                                >
                                                    {f}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-muted/10 rounded-2xl border border-border overflow-hidden">
                                        <div className="p-4 grid grid-cols-4 gap-4 bg-muted/30 font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
                                            <span className="col-span-1">Table #</span>
                                            <span className="col-span-2">Seating Capacity</span>
                                            <span className="text-right">Action</span>
                                        </div>
                                        <div className="divide-y divide-border max-h-80 overflow-y-auto">
                                            {floorTables.length === 0 ? (
                                                <div className="p-10 text-center opacity-30 italic text-xs">No tables added to this area yet.</div>
                                            ) : (
                                                floorTables.map(table => (
                                                    <div key={table.id} className="p-4 grid grid-cols-4 gap-4 items-center">
                                                        <Input 
                                                            value={table.number}
                                                            onChange={(e) => updateTable(table.id, { number: e.target.value })}
                                                            className="h-10 font-bold col-span-1"
                                                        />
                                                        <div className="col-span-2 flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-muted-foreground" />
                                                            <Input 
                                                                type="number"
                                                                value={table.capacity}
                                                                onChange={(e) => updateTable(table.id, { capacity: parseInt(e.target.value) || 0 })}
                                                                className="h-10 font-bold"
                                                            />
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-10 w-10 text-red-500"
                                                                onClick={() => deleteTable(table.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="p-4 bg-muted/20">
                                            <Button 
                                                variant="outline" 
                                                className="w-full font-black uppercase tracking-widest text-[10px] h-12 border-dashed gap-2"
                                                onClick={() => {
                                                    const nextNum = floorTables.length > 0 
                                                        ? (Math.max(...floorTables.map(t => parseInt(t.number) || 0)) + 1).toString() 
                                                        : "1";
                                                    addTable({ number: nextNum, capacity: 4, floor: activeFloorConfig || 'Main Floor' });
                                                }}
                                            >
                                                <Plus className="h-4 w-4" /> Add Table to {activeFloorConfig}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* 4. Financials */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Percent className="h-5 w-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Financial Rules</h2>
                    </div>
                    <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 p-8">
                        <div className="max-w-xs space-y-4">
                            <div>
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary">Sales Tax Rate (%)</Label>
                                <div className="relative mt-2">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl text-muted-foreground">%</div>
                                    <Input 
                                        type="number"
                                        value={localConfig.defaultTaxRate}
                                        onChange={(e) => setLocalConfig({...localConfig, defaultTaxRate: Number(e.target.value)})}
                                        className="font-black text-2xl bg-muted/20 border-border h-16 pl-10 rounded-xl" 
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </section>
            </div>

            <div className="space-y-8">
                <Card className="border-0 shadow-xl bg-slate-900 text-white p-2 relative overflow-hidden">
                    <ShieldCheck className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 rotate-12 pointer-events-none" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary">Setup Checklist</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase text-white/50">Complete these to launch</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                        {setupSteps.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                {step.done ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Circle className="h-5 w-5 text-white/20" />
                                )}
                                <span className={cn(
                                    "text-xs font-black uppercase tracking-tight",
                                    step.done ? "text-white" : "text-white/40"
                                )}>
                                    {step.name}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="p-8 bg-primary/5 border-b border-primary/10">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-primary" />
                            Get Help
                        </h3>
                    </div>
                    <CardContent className="p-8 space-y-4">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase leading-relaxed">
                            Confused about a setting? Connect with our 24/7 priority support team on WhatsApp for instant help.
                        </p>
                        <Button 
                            variant="outline" 
                            className="w-full font-black uppercase tracking-widest text-[10px] h-12 gap-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all"
                            onClick={() => {
                                const msg = encodeURIComponent(`Hi! I'm configuring my POS settings for ${localConfig.storeName || 'my shop'} and need some assistance.`);
                                window.open(`https://wa.me/923057631663?text=${msg}`, '_blank');
                            }}
                        >
                            <img src="/whatsapp-real.svg" alt="WA" className="h-4 w-4" />
                            Contact on WhatsApp
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
