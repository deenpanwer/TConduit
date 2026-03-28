"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePos, SaleItem, SaleTransaction } from '@/hooks/use-pos';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Search, ShoppingCart, Tag, History, Percent, Receipt, ExternalLink, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// --- Compact Numpad Component ---
interface NumpadProps {
  onPress: (key: string) => void;
  onPay: () => void;
  activeMode: 'Qty' | 'Disc' | 'Rate';
  isPayMode: boolean;
  disabled?: boolean;
}

const Numpad: React.FC<NumpadProps> = ({ onPress, onPay, activeMode, isPayMode, disabled }) => {
  const keys = ['1', '2', '3', 'Qty', '4', '5', '6', 'Disc', '7', '8', '9', 'Rate', 'Del', '0', '.', 'Pay'];
  
  return (
    <div className="grid grid-cols-4 gap-1.5 h-full w-full">
      {keys.map((key) => {
        const isModeKey = ['Qty', 'Disc', 'Rate'].includes(key);
        const isActive = isModeKey && activeMode === key && !isPayMode;
        const isPayKey = key === 'Pay';
        const displayKey = isPayKey ? (isPayMode ? 'Confirm' : 'Pay') : key;
        
        return (
          <Button
            key={key}
            variant={isPayKey ? 'default' : isActive ? 'default' : 'outline'}
            size="sm"
            className={cn(
                "text-base font-bold h-full transition-all duration-200 py-0",
                isPayKey && "bg-green-600 hover:bg-green-700 text-white border-0",
                isPayKey && isPayMode && "bg-orange-600 hover:bg-orange-700 animate-pulse",
                isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 z-10",
                !isModeKey && !isPayKey && "hover:bg-secondary border-border"
            )}
            onClick={() => (isPayKey ? onPay() : onPress(key))}
            disabled={disabled}
          >
            {key === 'Del' ? <Trash2 className="h-5 w-5" /> : displayKey}
          </Button>
        );
      })}
    </div>
  );
};

export default function CheckoutPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const {
    products,
    currentSale,
    customers,
    salesHistory,
    loading,
    addItemToSale,
    removeItemFromSale,
    updateItemQuantity,
    updateItemPrice,
    updateItemDiscount,
    completeSale,
  } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [numpadInput, setNumpadInput] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'Qty' | 'Disc' | 'Rate'>('Qty');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isPayMode, setIsPayMode] = useState(false);

  useEffect(() => {
    if (currentSale.items.length > 0 && !selectedItemId) {
      setSelectedItemId(currentSale.items[0].id);
    } else if (currentSale.items.length === 0) {
      setSelectedItemId(null);
    }
  }, [currentSale.items, selectedItemId]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleNumpadPress = useCallback((key: string) => {
    if (['Qty', 'Disc', 'Rate'].includes(key)) {
      setActiveMode(key as 'Qty' | 'Disc' | 'Rate');
      setIsPayMode(false);
      setNumpadInput('');
      return;
    }

    let currentInput = numpadInput;
    if (key === 'Del') {
      currentInput = currentInput.slice(0, -1);
    } else if (key === '.' && currentInput.includes('.')) {
      return;
    } else {
      currentInput += key;
    }
    setNumpadInput(currentInput);

    if (isPayMode) {
        const val = parseFloat(currentInput);
        setAmountPaid(isNaN(val) ? 0 : val);
        return;
    }

    if (selectedItemId) {
      const value = parseFloat(currentInput);
      if (!isNaN(value)) {
        if (activeMode === 'Qty') {
          updateItemQuantity(selectedItemId, Math.floor(value));
        } else if (activeMode === 'Disc') {
          updateItemDiscount(selectedItemId, value);
        } else if (activeMode === 'Rate') {
          updateItemPrice(selectedItemId, value);
        }
      }
    }
  }, [numpadInput, selectedItemId, activeMode, isPayMode, updateItemQuantity, updateItemDiscount, updateItemPrice]);

  const handleCompleteSale = async () => {
    if (!isPayMode) {
        setIsPayMode(true);
        setNumpadInput('');
        setAmountPaid(currentSale.grandTotal); // Default to exact amount
        return;
    }

    if (amountPaid < currentSale.grandTotal) {
        // Option: allow partial payments if needed, but for now let's just complete
        // Or show a warning.
    }

    const cashierName = userData?.displayName || userData?.name || 'System Admin';
    const sale = await completeSale('Cash', 'Paid', amountPaid, cashierName);
    if (sale) {
      router.push(`/pos/invoice/${sale.id}`);
    }
  };

  const handleItemSelection = (item: SaleItem) => {
    setSelectedItemId(item.id);
    setNumpadInput('');
  };
  
  const selectedItem = currentSale.items.find(i => i.id === selectedItemId);

  // Sort history by date descending
  const sortedHistory = useMemo(() => {
    return [...salesHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [salesHistory]);

  return (
    <div className="flex flex-row h-screen bg-background overflow-hidden text-foreground">
      {/* Left Column: Invoice and Numpad */}
      <div className="w-[38%] flex flex-col p-3 gap-3 border-r border-border h-full">
        <Card className="shadow-none flex-grow flex flex-col overflow-hidden border-border bg-card">
          <CardContent className="flex-grow p-0 flex flex-col overflow-hidden">
            <div className="grid grid-cols-5 gap-2 font-bold px-4 py-2 bg-muted/50 border-b text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="col-span-2">Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Rate</span>
              <span className="text-right">Total</span>
            </div>
            
            <ScrollArea className="flex-grow">
              {currentSale.items.length === 0 ? (
                <div className="text-center text-muted-foreground h-48 flex flex-col items-center justify-center gap-2">
                    <ShoppingCart className="h-8 w-8 opacity-20" />
                    <p className="text-xs">Cart is empty</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {currentSale.items.map(item => {
                    const isSelected = selectedItemId === item.id;
                    return (
                      <div 
                        key={item.id} 
                        className={cn(
                            "grid grid-cols-5 gap-2 items-center px-4 py-2.5 cursor-pointer transition-colors relative",
                            isSelected ? 'bg-primary/10' : 'hover:bg-muted/30'
                        )}
                        onClick={() => handleItemSelection(item)}
                      >
                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                        <div className="col-span-2 flex flex-col">
                            <span className="font-bold text-xs truncate">{item.name}</span>
                            {item.discount > 0 && (
                                <span className="text-[9px] font-bold text-red-500 uppercase">
                                    -{item.discount}% DISC
                                </span>
                            )}
                        </div>
                        <span className={cn("text-center text-xs font-semibold", isSelected && activeMode === 'Qty' && "text-primary scale-110")}>
                            {item.quantity}
                        </span>
                        <span className={cn("text-right text-xs font-medium", isSelected && activeMode === 'Rate' && "text-primary scale-110")}>
                            ${item.unitPrice.toFixed(2)}
                        </span>
                        <div className="flex items-center justify-end gap-1">
                            <span className="font-bold text-right text-xs">${(item.quantity * item.unitPrice * (1 - item.discount / 100)).toFixed(2)}</span>
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeItemFromSale(item.id);
                                }}
                            >
                                <Trash2 className="h-3 w-3"/>
                            </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            
            <div className="px-4 py-3 bg-muted/30 border-t border-border space-y-1">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total</span>
                    <span className="text-2xl font-black text-primary tracking-tighter">${currentSale.grandTotal.toFixed(2)}</span>
                </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 p-3 bg-card border-t border-border">
            {/* Minimal Header */}
            <div className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center gap-1 text-primary">
                    {isPayMode ? (
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Payment</span>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded text-[8px]",
                                amountPaid >= currentSale.grandTotal ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                                {amountPaid >= currentSale.grandTotal ? "FULL PAYMENT" : `SHORT: $${(currentSale.grandTotal - amountPaid).toFixed(2)}`}
                            </span>
                        </div>
                    ) : (
                        <>
                            {activeMode === 'Qty' && <Plus className="h-3 w-3" />}
                            {activeMode === 'Disc' && <Percent className="h-3 w-3" />}
                            {activeMode === 'Rate' && <Tag className="h-3 w-3" />}
                            <span>{activeMode === 'Qty' ? 'Quantity' : activeMode === 'Disc' ? 'Discount' : 'Price'}</span>
                        </>
                    )}
                </div>
                {selectedItem && !isPayMode && <span className="truncate max-w-[120px]">Edit: {selectedItem.name}</span>}
                {isPayMode && (
                    <div className="flex gap-2">
                        {[10, 20, 50].map(val => (
                            <button 
                                key={val}
                                onClick={() => {
                                    setAmountPaid(val);
                                    setNumpadInput(val.toString());
                                }}
                                className="bg-secondary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                            >
                                ${val}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="relative w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-[10px] font-black text-primary/40 tracking-tighter">
                        {isPayMode ? "CASH" : activeMode}
                    </span>
                </div>
                <Input 
                    value={numpadInput || (isPayMode ? amountPaid : (selectedItem ? (activeMode === 'Qty' ? selectedItem.quantity : activeMode === 'Disc' ? selectedItem.discount : selectedItem.unitPrice) : '0'))} 
                    readOnly 
                    className={cn(
                        "text-right text-2xl font-black h-12 pl-12 pr-4 border-border bg-background focus-visible:ring-0",
                        isPayMode ? "border-orange-500/50 text-orange-600 bg-orange-50/10" : numpadInput && "border-primary/50 text-primary"
                    )}
                />
            </div>

            {isPayMode && (
                <div className="flex justify-between items-center px-2 py-1.5 bg-secondary/30 rounded border border-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Change to return</span>
                    <span className="text-lg font-black text-orange-600">
                        ${Math.max(0, amountPaid - currentSale.grandTotal).toFixed(2)}
                    </span>
                </div>
            )}
            
            <div className="h-[210px] w-full">
                <Numpad 
                    onPress={handleNumpadPress} 
                    onPay={handleCompleteSale} 
                    activeMode={activeMode}
                    isPayMode={isPayMode}
                    disabled={loading.saving} 
                />
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right Column: Product Search & Grid */}
      <div className="w-[62%] flex flex-col p-3 gap-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 bg-card border-border shadow-sm focus-visible:ring-1 ring-primary"
            />
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 w-11 bg-card border-border shadow-sm">
                <History className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col border-l border-border bg-card">
              <SheetHeader className="p-6 bg-muted/30 border-b">
                <SheetTitle className="flex items-center gap-2 text-primary uppercase font-black tracking-tighter">
                    <History className="h-5 w-5" />
                    Sales History
                </SheetTitle>
                <SheetDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
                  Manage and review past transactions
                </SheetDescription>
              </SheetHeader>
              
              <ScrollArea className="flex-grow">
                {sortedHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-muted-foreground gap-4 opacity-50">
                    <History className="h-12 w-12" />
                    <p className="font-bold text-xs uppercase tracking-widest">No transactions found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {sortedHistory.map((sale) => {
                      const customer = customers.find(c => c.id === sale.customerId);
                      return (
                        <div key={sale.id} className="p-4 hover:bg-muted/30 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                                #{sale.id.slice(-8).toUpperCase()}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span className="text-[10px] font-bold">
                                  {new Date(sale.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black tracking-tighter text-foreground">${sale.grandTotal.toFixed(2)}</p>
                              <span className="text-[9px] font-black uppercase text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
                                {sale.paymentStatus}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Customer</span>
                              <span className="text-xs font-bold">{customer?.name || "Walk-in Customer"}</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-[10px] font-black uppercase tracking-tighter gap-1.5"
                                onClick={() => router.push(`/pos/invoice/${sale.id}`)}
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                Receipt
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-primary"
                                onClick={() => router.push(`/pos/invoice/${sale.id}`)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
        
        <Card className="shadow-none flex-grow border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-8rem)]"> 
              {loading.products ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                  {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
                </div>
              ) : filteredProducts.length === 0 ? (
                  <div className="h-[60vh] flex flex-col items-center justify-center text-muted-foreground gap-3">
                      <Search className="h-10 w-10 opacity-10" />
                      <p className="text-sm font-medium">No results found</p>
                  </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                  {filteredProducts.map(product => (
                    <Card
                      key={product.id}
                      className="flex flex-col cursor-pointer relative overflow-hidden group border-border bg-card shadow-sm hover:ring-1 ring-primary transition-all active:scale-95"
                      onClick={() => addItemToSale(product.id, 1)}
                    >
                       {product.discountedPrice && product.discountedPrice > 0 && (
                            <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow uppercase">
                                Sale
                            </div>
                        )}
                      <div className="aspect-square overflow-hidden bg-muted/10">
                          <img 
                            src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                      </div>
                      <CardContent className="p-2.5 flex flex-col flex-grow">
                        <h3 className="font-bold text-xs truncate leading-tight">{product.name}</h3>
                        <p className="text-[9px] font-bold text-muted-foreground mt-0.5 tracking-tighter uppercase">{product.sku}</p>
                        <div className="mt-auto flex items-end justify-between pt-2">
                            <p className="text-sm font-black text-primary">
                                ${product.discountedPrice ? product.discountedPrice.toFixed(2) : product.basePrice.toFixed(2)}
                            </p>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">{product.stockQuantity} STK</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
