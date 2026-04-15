"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePos, PosTable, SaleItem, Product } from '@/hooks/use-pos';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Users, Utensils, Receipt, CheckCircle2, Clock, Plus, Map as MapIcon, 
    Trash2, Info, LayoutDashboard, X, Play, Edit3, ShoppingCart, 
    ChevronDown, Printer, AlertCircle, Image as ImageIcon, Volume2
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * RESTAURANT FLOOR PLAN - "WORKER FRIENDLY"
 */

// New: A more advanced Timer that shows hours, minutes, and seconds
const TableTimer = ({ startTime }: { startTime?: string | null }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startTime) {
      setElapsed('0m 0s'); // Default to 0 if no start time
      return;
    }
    
    const interval = setInterval(() => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((now - start) / 1000)); // Ensure no negative values
      
      const hours = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      
      if (hours > 0) {
        setElapsed(`${hours}h ${mins}m`);
      } else {
        setElapsed(`${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null; // Don't render if timer shouldn't be running

  return (
    <div className="flex items-center gap-1.5 text-white text-[10px] font-black uppercase bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
      <Clock className="h-3 w-3" />
      <span>{elapsed}</span>
    </div>
  );
};

// Improved: OrderBubble with product images
const OrderBubble = ({ items, products }: { items: SaleItem[]; products: Product[] }) => {
    if (items.length === 0) return null;
    
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const grandTotal = items.reduce((sum, i) => sum + i.lineItemTotal, 0);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button 
                    className="absolute -top-3 -left-3 bg-primary text-white w-14 h-14 rounded-full shadow-lg border-4 border-white dark:border-slate-900 cursor-pointer animate-in zoom-in duration-300 z-20 group-hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-lg font-black leading-none">{totalQty}</span>
                        <span className="text-[8px] font-bold uppercase opacity-80 leading-none mt-0.5">Items</span>
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 rounded-2xl overflow-hidden border-border bg-card/95 backdrop-blur-xl shadow-2xl">
                <div className="p-4 bg-primary/10 border-b border-border">
                    <p className="text-xs font-black uppercase tracking-widest text-primary">Current Order</p>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
                    {items.map((item) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                            <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                <img 
                                  src={product?.imageUrl || 'https://placehold.co/400'} 
                                  alt={item.name} 
                                  className="h-10 w-10 rounded-md object-cover flex-shrink-0 bg-muted/20"
                                />
                                <div className="flex-grow">
                                    <span className="text-sm font-bold truncate">{item.name}</span>
                                    <span className="text-[10px] text-muted-foreground block">Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</span>
                                </div>
                                <span className="text-sm font-black">${item.lineItemTotal.toFixed(2)}</span>
                            </div>
                        )
                    })}
                </div>
                <div className="p-3 bg-muted/50 border-t border-border flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest">Grand Total</span>
                    <span className="text-base font-black text-primary">${grandTotal.toFixed(2)}</span>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default function FloorsPage() {
  const router = useRouter();
  const { 
    tables, config, loading, activeTickets, products, addTable, updateTable, deleteTable, 
    selectTable, loadTicket, getEntityForInvoice, uploadTableImage, getTTSForTable 
  } = usePos();
  const [activeFloor, setActiveFloor] = useState(config.floors[0] || 'Main Floor');
  
  // State for the edit/create dialog
  const [editingTable, setEditingTable] = useState<PosTable | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [editFormData, setEditFormData] = useState({ number: '', capacity: 4, floor: activeFloor });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!activeFloor && config.floors.length > 0) {
        setActiveFloor(config.floors[0]);
    }
    // Ensure formData floor is in sync with activeFloor
    setEditFormData(prev => ({...prev, floor: activeFloor}));
  }, [config.floors, activeFloor]);

  const filteredTables = useMemo(() => {
    return tables.filter(t => t.floor === activeFloor).sort((a,b) => parseInt(a.number) - parseInt(b.number));
  }, [tables, activeFloor]);

  const handleTableClick = async (table: PosTable) => {
    // Centralized logic to take user to checkout for a specific table
    selectTable(table.id);
    if (table.currentTicketId) {
      await loadTicket(table.currentTicketId);
    }
    router.push(`/pos/checkout`);
  };

  const handleOpenEditDialog = (table: PosTable | null, isCreating = false) => {
    setIsNew(isCreating);
    if (isCreating) {
        const nextNumber = tables.length > 0 
            ? (Math.max(...tables.map(t => parseInt(t.number) || 0)) + 1).toString()
            : "1";
        setEditingTable(null);
        setEditFormData({ number: nextNumber, capacity: 4, floor: activeFloor });
        setImagePreview(null);
    } else if (table) {
        setEditingTable(table);
        setEditFormData({ number: table.number, capacity: table.capacity, floor: table.floor });
        setImagePreview(table.imageUrl || null);
    }
    setImageFile(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };

  const handleSaveTable = async () => {
    if (isNew) { // Creating a new table
        try {
            const tableId = await addTable({ ...editFormData });
            if (imageFile && tableId) {
                await uploadTableImage(tableId, imageFile);
            }
            toast.success(`Table ${editFormData.number} created!`);
        } catch (e) {
            toast.error("Failed to create table");
            console.error(e);
        }
    } else if (editingTable) { // Updating an existing table
        try {
            await updateTable(editingTable.id, { ...editFormData });
            if (imageFile) {
                await uploadTableImage(editingTable.id, imageFile);
            }
            toast.success(`Table ${editFormData.number} updated!`);
        } catch (e) {
            toast.error("Failed to update table");
            console.error(e);
        }
    }
    setEditingTable(null); // Close dialog
  };

  const handleDelete = async () => {
    if (!editingTable) return;
    if (confirm(`Are you sure you want to delete Table ${editingTable.number}? This cannot be undone.`)) {
        try {
            await deleteTable(editingTable.id);
            toast.success("Table deleted successfully");
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
        toast.success(`Table status changed to ${status.toUpperCase()}`);
    } catch (e) {
        toast.error("Failed to change status");
    }
  };

  const handleTTS = (e: React.MouseEvent, table: PosTable) => {
      e.stopPropagation();
      const text = getTTSForTable(table);
      const utterance = new SpeechSynthesisUtterance(text);
      // Language is implicitly handled by the text content (English vs. Hindi)
      speechSynthesis.speak(utterance);
  };

  const getStatusInfo = (status: PosTable['status']) => {
    switch (status) {
      case 'free': return { text: 'Available', icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-green-400' };
      case 'eating': return { text: 'Seated', icon: <Utensils className="h-5 w-5" />, color: 'text-orange-400' };
      case 'bill': return { text: 'Billing', icon: <Receipt className="h-5 w-5" />, color: 'text-blue-400' };
      default: return { text: 'Unknown', icon: <Info className="h-5 w-5" />, color: 'text-gray-400' };
    }
  };

  if (loading.tables || loading.products) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
            <div className="text-center space-y-4">
                <Utensils className="h-12 w-12 text-primary animate-bounce mx-auto" />
                <p className="font-black uppercase tracking-[0.2em] text-xs">Loading Restaurant...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-100 dark:bg-slate-950 min-h-screen text-foreground space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <MapIcon className="h-10 w-10 text-primary" />
                    Floor Plan
                </h1>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Touch a table to start or manage an order</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-border shadow-sm">
                    {config.floors.map(floor => (
                        <Button key={floor} variant={activeFloor === floor ? 'default' : 'ghost'}
                            onClick={() => setActiveFloor(floor)}
                            className={cn("rounded-xl px-6 h-12 font-black uppercase tracking-widest text-xs transition-all", activeFloor === floor && "shadow-lg")}>
                            {floor}
                        </Button>
                    ))}
                </div>
                <Button onClick={() => handleOpenEditDialog(null, true)} className="h-14 w-14 rounded-2xl shadow-lg gap-2">
                    <Plus className="h-6 w-6" />
                </Button>
            </div>
        </div>

        {/* Tables Display */}
        {filteredTables.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-border p-12 text-center space-y-4">
                <Info className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-xl font-black uppercase tracking-tighter">No Tables on {activeFloor}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Click the '+' button to add the first table</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredTables.map((table) => {
                    const ticket = activeTickets.find(t => t.id === table.currentTicketId);
                    const items = ticket?.items || [];
                    const statusInfo = getStatusInfo(table.status);

                    return (
                        <Card 
                            key={table.id}
                            className={cn(
                                "group transition-all duration-300 border-2 rounded-2xl overflow-hidden shadow-lg h-80 flex flex-col relative isolate",
                                "bg-slate-800 border-transparent hover:border-primary",
                            )}
                            onClick={() => handleTableClick(table)}
                        >
                            {/* Background Image */}
                            <img src={table.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?&auto=format&fit=crop&w=800'} alt={`Table ${table.number}`} className="absolute inset-0 w-full h-full object-cover -z-10 opacity-30 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-black/80 via-black/40 to-transparent -z-10" />

                            <CardContent className="p-4 flex flex-col h-full text-white">
                                {items.length > 0 && <OrderBubble items={items} products={products} />}
                                
                                {/* Top Row: Table Number & Edit/TTS Buttons */}
                                <div className="flex justify-between items-start">
                                    <span className="text-5xl font-black tracking-tighter">{table.number}</span>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/20 hover:bg-white/20" onClick={(e) => {e.stopPropagation(); handleOpenEditDialog(table, false);}}>
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/20 hover:bg-white/20" onClick={(e) => handleTTS(e, table)}>
                                            <Volume2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-auto space-y-3">
                                    {/* Status Indicator & Timer */}
                                    <div className="flex justify-between items-center">
                                        <div className={cn("flex items-center gap-2 font-bold uppercase text-xs tracking-widest", statusInfo.color)}>
                                            {statusInfo.icon}{statusInfo.text}
                                        </div>
                                        {table.status !== 'free' && <TableTimer startTime={table.lastStatusChange} />}
                                    </div>
                                    
                                    {/* Capacity */}
                                    <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
                                        <Users className="h-4 w-4" />
                                        <span>{table.capacity} Guests</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-2">
                                        {table.status === 'free' ? (
                                            <Button className="w-full h-12 font-black uppercase text-sm bg-green-500 hover:bg-green-600 text-white gap-2" onClick={(e) => handleUpdateStatus(e, table.id, 'eating')}>
                                                <Play className="h-5 w-5" /> Sit Guests
                                            </Button>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button variant="outline" className="h-12 font-black uppercase text-xs bg-transparent border-slate-600 hover:bg-slate-700 text-white" onClick={(e) => handleUpdateStatus(e, table.id, 'free')}>
                                                    <X className="h-4 w-4 mr-1" /> Clear
                                                </Button>
                                                <Button className="h-12 font-black uppercase text-xs bg-primary hover:bg-primary/90 gap-2" onClick={() => handleTableClick(table)}>
                                                    <Receipt className="h-4 w-4" /> {table.status === 'bill' ? 'Pay Bill' : 'Add/Pay'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )}

        {/* Edit/Create Table Dialog */}
        <Dialog open={!!editingTable || isNew} onOpenChange={(open) => !open && (setEditingTable(null), setIsNew(false))}>
            <DialogContent className="sm:max-w-md bg-card">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter">{isNew ? 'Create New Table' : `Configure Table ${editingTable?.number}`}</DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Update table info, seating, and appearance</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Image Upload */}
                    <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Table Image</Label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                {imagePreview ? <img src={imagePreview} alt="Table preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full text-muted-foreground/30 p-6"/>}
                            </div>
                            <Input id="image-upload" type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                            <Label htmlFor="image-upload" className="cursor-pointer text-primary font-bold text-sm hover:underline">Choose Image...</Label>
                        </div>
                    </div>
                    {/* Form Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label htmlFor="number">Table Number</Label><Input id="number" value={editFormData.number} onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })} /></div>
                        <div className="grid gap-2"><Label htmlFor="capacity">Capacity</Label><Input id="capacity" type="number" value={editFormData.capacity} onChange={(e) => setEditFormData({ ...editFormData, capacity: parseInt(e.target.value) || 0 })} /></div>
                    </div>
                    <div className="grid gap-2"><Label htmlFor="floor">Floor</Label><Input id="floor" value={editFormData.floor} onChange={(e) => setEditFormData({ ...editFormData, floor: e.target.value })} /></div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    {!isNew && <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>}
                    <div className="flex-grow" />
                    <Button variant="outline" onClick={() => {setEditingTable(null); setIsNew(false);}}>Cancel</Button>
                    <Button onClick={handleSaveTable}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Floating Action Button to return to main POS dashboard */}
        <div className="fixed bottom-8 right-8">
            <Button onClick={() => router.push('/pos/dashboard')} className="rounded-full h-16 w-16 shadow-2xl bg-slate-900 hover:bg-primary transition-all active:scale-90">
                <LayoutDashboard className="h-8 w-8 text-white" />
            </Button>
        </div>
    </div>
  );
}