"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePos, PosTable, SaleItem } from '@/hooks/use-pos';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Users, 
    Utensils, 
    Receipt, 
    CheckCircle2, 
    Clock, 
    Plus,
    Map as MapIcon,
    Trash2,
    Info,
    LayoutDashboard,
    X,
    Play,
    Edit3,
    ShoppingCart,
    ChevronDown,
    Printer,
    AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * RESTAURANT FLOOR PLAN - "WORKER FRIENDLY"
 */

const TableTimer = ({ startTime }: { startTime?: string | null }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startTime) {
      setElapsed('');
      return;
    }
    
    const interval = setInterval(() => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(`${mins}m ${secs}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  return (
    <div className="flex items-center gap-1 text-[10px] font-black uppercase bg-black/10 px-2 py-0.5 rounded-full">
      <Clock className="h-3 w-3" />
      {elapsed}
    </div>
  );
};

const OrderBubble = ({ items }: { items: SaleItem[] }) => {
    if (items.length === 0) return null;
    
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => sum + i.lineItemTotal, 0);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div 
                    className="absolute -top-1 -left-1 bg-primary text-white p-2 rounded-2xl shadow-lg border-2 border-white dark:border-slate-900 cursor-pointer animate-in zoom-in duration-300 z-20 group-hover:scale-110 transition-transform"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black leading-none">{totalQty}</span>
                        <span className="text-[7px] font-bold uppercase opacity-80 leading-none mt-0.5">Items</span>
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 rounded-2xl overflow-hidden border-border bg-card/95 backdrop-blur-xl shadow-2xl">
                <div className="p-3 bg-primary/10 border-b border-border">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Current Order</p>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-border/50">
                    {items.map((item, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center hover:bg-muted/30 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold">{item.name}</span>
                                <span className="text-[10px] text-muted-foreground">Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</span>
                            </div>
                            <span className="text-xs font-black">${item.lineItemTotal.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-muted/50 border-t border-border flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">Grand Total</span>
                    <span className="text-sm font-black text-primary">${totalPrice.toFixed(2)}</span>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default function FloorsPage() {
  const router = useRouter();
  const { tables, config, loading, activeTickets, addTable, updateTable, deleteTable, selectTable, loadTicket, getEntityForInvoice } = usePos();
  const [activeFloor, setActiveFloor] = useState(config.floors[0] || 'Main Floor');
  
  const [editingTable, setEditingTable] = useState<PosTable | null>(null);
  const [editFormData, setEditFormData] = useState({ number: '', capacity: 4 });

  useEffect(() => {
    if (!activeFloor && config.floors.length > 0) {
        setActiveFloor(config.floors[0]);
    }
  }, [config.floors, activeFloor]);

  const filteredTables = useMemo(() => {
    return tables.filter(t => t.floor === activeFloor);
  }, [tables, activeFloor]);

  const handleTableClick = async (table: PosTable) => {
    if (table.status === 'free') {
        selectTable(table.id);
        router.push(`/pos/checkout`);
    } else if (table.currentTicketId) {
        await loadTicket(table.currentTicketId);
        selectTable(table.id);
        router.push(`/pos/checkout`);
    } else { // Fallback for eating/bill status without a loaded ticket
        selectTable(table.id);
        router.push(`/pos/checkout`);
    }
  };

  const handleAddTable = async () => {
    const nextNumber = tables.length > 0 
      ? (Math.max(...tables.map(t => parseInt(t.number) || 0)) + 1).toString()
      : "1";
      
    try {
        await addTable({
            number: nextNumber,
            capacity: 4,
            floor: activeFloor,
        });
        toast.success("New Table Added!");
    } catch (e) {
        toast.error("Failed to add table");
    }
  };

  const handleOpenEdit = (e: React.MouseEvent, table: PosTable) => {
    e.stopPropagation();
    setEditingTable(table);
    setEditFormData({ number: table.number, capacity: table.capacity });
  };

  const handleSaveEdit = async () => {
    if (!editingTable) return;
    try {
        await updateTable(editingTable.id, {
            number: editFormData.number,
            capacity: editFormData.capacity
        });
        toast.success("Table updated!");
        setEditingTable(null);
    } catch (e) {
        toast.error("Failed to update table");
    }
  };

  const handleDelete = async () => {
    if (!editingTable) return;
    if (confirm(`Are you sure you want to delete Table ${editingTable.number}?`)) {
        try {
            await deleteTable(editingTable.id);
            toast.success("Table deleted");
            setEditingTable(null);
        } catch (e) {
            toast.error("Failed to delete table");
        }
    }
  };

  const handleUpdateStatus = async (e: React.MouseEvent, tableId: string, status: PosTable['status']) => {
    e.stopPropagation();
    try {
        await updateTable(tableId, { status });
        toast.success(`Table is now ${status.toUpperCase()}`);
    } catch (e) {
        toast.error("Failed to change status");
    }
  };

  const getStatusColor = (status: PosTable['status']) => {
    switch (status) {
      case 'free': return 'bg-green-500/10 border-green-500/30 text-green-700';
      case 'eating': return 'bg-orange-500/10 border-orange-500/30 text-orange-700';
      case 'bill': return 'bg-blue-500/10 border-blue-500/30 text-blue-700';
      default: return 'bg-slate-100';
    }
  };

  const getStatusText = (status: PosTable['status']) => {
    switch (status) {
      case 'free': return 'Empty';
      case 'eating': return 'Sitting';
      case 'bill': return 'Check Out';
    }
  };

  if (loading.tables) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
            <div className="text-center space-y-4">
                <Utensils className="h-12 w-12 text-primary animate-bounce mx-auto" />
                <p className="font-black uppercase tracking-[0.2em] text-xs">Opening Floor Plan...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-foreground space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <MapIcon className="h-10 w-10 text-primary" />
                    Tables
                </h1>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Touch a table to see order</p>
            </div>
            
            <div className="flex flex-wrap bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-border shadow-sm">
                {config.floors.map(floor => (
                    <Button 
                        key={floor}
                        variant={activeFloor === floor ? 'default' : 'ghost'}
                        onClick={() => setActiveFloor(floor)}
                        className={cn(
                            "rounded-xl px-6 h-12 font-black uppercase tracking-widest text-xs transition-all",
                            activeFloor === floor && "shadow-lg scale-105"
                        )}
                    >
                        {floor}
                    </Button>
                ))}
            </div>
        </div>

        {/* Color Key */}
        <div className="flex flex-wrap gap-4 px-2">
            <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Green = Empty</span>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-700">Orange = Sitting</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Blue = Paying</span>
            </div>
        </div>

        {/* Tables Display */}
        {filteredTables.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-border p-12 text-center space-y-4">
                <Info className="h-12 w-12 text-muted-foreground/30" />
                <div className="space-y-2">
                    <p className="text-xl font-black uppercase tracking-tighter">No Tables on {activeFloor}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Click below to start setting up</p>
                </div>
                <Button onClick={handleAddTable} className="font-black uppercase tracking-widest text-xs h-12 px-8 shadow-lg gap-2">
                    <Plus className="h-5 w-5" /> Add First Table
                </Button>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-24">
                {filteredTables.map((table) => {
                    const ticket = activeTickets.find(t => t.id === table.currentTicketId);
                    const items = ticket?.items || [];

                    return (
                        <Card 
                            key={table.id}
                            className={cn(
                                "group cursor-pointer transition-all duration-300 border-2 hover:shadow-2xl active:scale-95 overflow-hidden flex flex-col h-64 relative",
                                getStatusColor(table.status),
                                table.status === 'free' ? "hover:border-green-500" : 
                                table.status === 'eating' ? "hover:border-orange-500" : "hover:border-blue-500 shadow-blue-500/10"
                            )}
                            onClick={() => handleTableClick(table)}
                        >
                            <CardContent className="p-0 flex flex-col h-full">
                                {items.length > 0 && <OrderBubble items={items} />}
                                
                                {/* Top Bar */}
                                <div className="bg-white/50 dark:bg-black/20 p-4 flex justify-between items-center border-b border-inherit relative">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Table</span>
                                        <span className="text-4xl font-black tracking-tighter -mt-1">{table.number}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => handleOpenEdit(e, table)}
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <div className="flex items-center gap-1.5 opacity-60 mt-1">
                                            <Users className="h-4 w-4" />
                                            <span className="text-xs font-black">{table.capacity}</span>
                                        </div>
                                        <TableTimer startTime={table.lastStatusChange} />
                                    </div>
                                </div>

                                {/* Middle State Area */}
                                <div className="flex-grow flex flex-col items-center justify-center gap-3 p-4">
                                    {table.status === 'free' && <CheckCircle2 className="h-12 w-12 opacity-20" />}
                                    {table.status === 'eating' && <Utensils className="h-12 w-12 animate-pulse" />}
                                    {table.status === 'bill' && <Receipt className="h-12 w-12" />}
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">{getStatusText(table.status)}</span>
                                    
                                    {/* Quick Punch Button */}
                                    {table.status === 'eating' && (
                                        <Button 
                                            size="sm" 
                                            className="h-7 text-[9px] font-black uppercase tracking-widest rounded-full px-4 gap-2 shadow-md animate-in slide-in-from-bottom-2 duration-500"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTableClick(table); // Go to checkout to start order
                                            }}
                                        >
                                            <Play className="h-3 w-3" /> Punch Order
                                        </Button>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 border-t border-inherit divide-x divide-inherit h-16">
                                    {table.status === 'free' ? (
                                        <Button 
                                            variant="ghost" 
                                            className="h-full w-full rounded-none font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 hover:text-white col-span-2 gap-2"
                                            onClick={(e) => handleUpdateStatus(e, table.id, 'eating')}
                                        >
                                            <Play className="h-4 w-4" />
                                            Sit Guest
                                        </Button>
                                    ) : (
                                        <>
                                            <Button 
                                                variant="ghost" 
                                                className="h-full w-full rounded-none font-black uppercase text-[10px] tracking-widest hover:bg-green-500 hover:text-white"
                                                onClick={(e) => handleUpdateStatus(e, table.id, 'free')}
                                            >
                                                <X className="h-4 w-4" />
                                                Clear
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                className={cn(
                                                    "h-full w-full rounded-none font-black uppercase text-[10px] tracking-widest flex flex-col items-center justify-center gap-1",
                                                    table.status === 'bill' ? "bg-blue-600 text-white hover:bg-blue-700" : "hover:bg-blue-500 hover:text-white"
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (table.status === 'bill') {
                                                        // If already in bill mode, check for items and navigate
                                                        const ticket = activeTickets.find(t => t.id === table.currentTicketId);
                                                        if (ticket && ticket.items.length > 0) {
                                                            router.push(`/pos/invoice/${ticket.id}?context=ticket`); // Navigate to invoice for preview
                                                        } else {
                                                            selectTable(table.id); // Select table in checkout
                                                            router.push('/pos/checkout'); // Go to checkout to start order
                                                        }
                                                    } else {
                                                        handleUpdateStatus(e, table.id, 'bill');
                                                    }
                                                }}
                                            >
                                                <Receipt className="h-4 w-4" />
                                                {table.status === 'bill' ? 'View Bill' : 'Bill'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Quick Add Table */}
                <Card 
                    className="border-2 border-dashed border-slate-300 dark:border-slate-800 bg-transparent flex flex-col items-center justify-center h-64 cursor-pointer hover:bg-white hover:border-primary/50 transition-all opacity-40 hover:opacity-100 group shadow-none"
                    onClick={handleAddTable}
                >
                    <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Plus className="h-8 w-8 text-slate-400 group-hover:text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest mt-4">New Table</span>
                </Card>
            </div>
        )}

        {/* Edit Table Dialog */}
        <Dialog open={!!editingTable} onOpenChange={(open) => !open && setEditingTable(null)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter">Configure Table</DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
                        Update table number and seating capacity
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="number" className="text-[10px] font-black uppercase tracking-widest ml-1">Table Number</Label>
                        <Input
                            id="number"
                            value={editFormData.number}
                            onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })}
                            className="font-bold h-12"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="capacity" className="text-[10px] font-black uppercase tracking-widest ml-1">Seating Capacity</Label>
                        <Input
                            id="capacity"
                            type="number"
                            value={editFormData.capacity}
                            onChange={(e) => setEditFormData({ ...editFormData, capacity: parseInt(e.target.value) || 0 })}
                            className="font-bold h-12"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={handleDelete} className="text-red-500 font-black uppercase tracking-widest text-[10px] h-12">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditingTable(null)} className="font-black uppercase tracking-widest text-[10px] h-12">Cancel</Button>
                        <Button onClick={handleSaveEdit} className="font-black uppercase tracking-widest text-[10px] h-12">Save Changes</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 flex gap-4">
            <Button 
                onClick={() => router.push('/pos/dashboard')}
                className="rounded-full h-16 w-16 shadow-2xl bg-slate-900 hover:bg-primary transition-all active:scale-90 flex items-center justify-center"
            >
                <LayoutDashboard className="h-8 w-8 text-white" />
            </Button>
        </div>
    </div>
  );
}