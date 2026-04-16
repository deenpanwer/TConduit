"use client";

import React, { useState, useMemo } from 'react';
import { usePos, Product } from '@/hooks/use-pos';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
    PlusCircle, 
    LayoutGrid, 
    List, 
    Search, 
    ArrowUpDown, 
    MoreHorizontal, 
    Edit, 
    Trash2, 
    AlertCircle,
    ArrowUpRight,
} from 'lucide-react';
import { AddItemForm } from '@/components/forms/add-item-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function InventoryPage() {
  const { products, loading, addProduct, deleteProduct } = usePos();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortBy] = useState<keyof Product | 'lowStock'>('name');

  // --- Filtering & Sorting ---
  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortKey === 'lowStock') {
        result.sort((a, b) => a.stockQuantity - b.stockQuantity);
    } else {
        result.sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (typeof valA === 'string' && typeof valB === 'string') {
                return valA.localeCompare(valB);
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return valA - valB;
            }
            return 0;
        });
    }

    return result;
  }, [products, searchQuery, sortKey]);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this product permanently?")) {
        await deleteProduct(id);
        toast.success("Product deleted");
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen text-foreground">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Inventory</h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Manage stock and product catalog</p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search SKU or Name..." 
                        className="pl-10 bg-white dark:bg-slate-900 border-border font-bold h-11"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex bg-white dark:bg-slate-900 border border-border p-1 rounded-lg">
                    <Button 
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className="h-9 w-9" 
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className="h-9 w-9" 
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-black uppercase tracking-widest text-[10px] h-11 gap-2 shadow-lg">
                            <PlusCircle className="h-4 w-4" />
                            Add Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black uppercase tracking-tighter">New Product</DialogTitle>
                        </DialogHeader>
                        <AddItemForm 
                            onSubmit={async (data) => { 
                                try {
                                    // 1. Create product first and return the ID
                                    const productId = await addProduct({
                                        name: data.name,
                                        sku: data.sku,
                                        basePrice: data.basePrice,
                                        costPrice: data.costPrice,
                                        stockQuantity: data.stockQuantity,
                                        taxRate: data.taxRate,
                                        imageUrl: data.imageUrl || '' // Start with URL if provided
                                    });

                                    setIsDialogOpen(false); 
                                    toast.success("Product created in catalog");
                                    return productId; // Crucial: return ID for AddItemForm image upload
                                } catch (e) {
                                    toast.error("Failed to create product");
                                    throw e;
                                }
                            }} 
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-border shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Items</p>
                <p className="text-2xl font-black">{products.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-border shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-black text-red-500">{products.filter(p => p.stockQuantity < 10).length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-border shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Value</p>
                <p className="text-2xl font-black text-green-600">
                    ${products.reduce((acc, p) => acc + (p.stockQuantity * p.costPrice), 0).toFixed(2)}
                </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-border shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categories</p>
                <p className="text-2xl font-black text-blue-500">{new Set(products.map(p => p.category)).size}</p>
            </div>
        </div>

        {/* Sorting Toggles */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <Button 
                variant="outline" 
                size="sm" 
                className={cn("text-[10px] font-black uppercase tracking-widest h-8 px-4", sortKey === 'name' && "bg-primary text-white border-primary")}
                onClick={() => setSortBy('name')}
            >
                Name A-Z
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                className={cn("text-[10px] font-black uppercase tracking-widest h-8 px-4", sortKey === 'stockQuantity' && "bg-primary text-white border-primary")}
                onClick={() => setSortBy('stockQuantity')}
            >
                Stock High-Low
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                className={cn("text-[10px] font-black uppercase tracking-widest h-8 px-4", sortKey === 'lowStock' && "bg-red-500 text-white border-red-500")}
                onClick={() => setSortBy('lowStock')}
            >
                Critically Low
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                className={cn("text-[10px] font-black uppercase tracking-widest h-8 px-4", sortKey === 'basePrice' && "bg-primary text-white border-primary")}
                onClick={() => setSortBy('basePrice')}
            >
                Price
            </Button>
        </div>

        {/* Content Area */}
        <div className="min-h-[60vh]">
            {loading.products ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p className="animate-pulse font-black uppercase tracking-[0.2em]">Syncing Catalog...</p>
                </div>
            ) : filteredAndSortedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-border opacity-50">
                    <Search className="h-12 w-12 mb-4" />
                    <p className="font-black uppercase tracking-widest">No Products Found</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredAndSortedProducts.map(product => (
                        <Card key={product.id} className="flex flex-col group border-0 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-border">
                            {product.stockQuantity < 10 && (
                                <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase">
                                    Low Stock
                                </div>
                            )}
                            <div className="aspect-square overflow-hidden bg-muted/20">
                                <img 
                                    src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                />
                            </div>
                            <CardContent className="p-3 flex flex-col flex-grow">
                                <h3 className="font-black text-[11px] truncate uppercase leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                                <p className="text-[9px] font-bold text-muted-foreground mt-0.5 tracking-tighter">{product.sku}</p>
                                
                                <div className="mt-auto pt-3 flex items-end justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-xs font-black text-primary leading-none">${product.basePrice.toFixed(2)}</p>
                                    </div>
                                    <div className={cn(
                                        "text-[9px] font-black px-1.5 py-0.5 rounded",
                                        product.stockQuantity < 10 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                    )}>
                                        {product.stockQuantity}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-0 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
                    <Table>
                        <TableHeader className="bg-muted/50 border-b border-border">
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 w-[80px]">Image</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Product / SKU</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Category</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 text-right">Cost</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 text-right text-primary">Price</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 text-center">Stock</TableHead>
                                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] py-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedProducts.map((product) => (
                                <TableRow key={product.id} className="hover:bg-muted/20 transition-colors border-border group">
                                    <TableCell>
                                        <div className="h-10 w-10 rounded border border-border overflow-hidden bg-muted/10">
                                            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-slate-100">{product.name}</span>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{product.sku}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-secondary/50 px-2 py-1 rounded border border-border">
                                            {product.category || 'Uncategorized'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-xs text-muted-foreground">${product.costPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-black text-xs text-primary">${product.basePrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase",
                                            product.stockQuantity < 10 ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-green-500/10 text-green-600 border border-green-500/20"
                                        )}>
                                            {product.stockQuantity < 10 && <AlertCircle className="h-3 w-3" />}
                                            {product.stockQuantity}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 font-bold uppercase text-[10px] tracking-widest">
                                                <DropdownMenuItem className="gap-2"><Edit className="h-3.5 w-3.5" /> Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => handleDelete(product.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    </div>
  );
}
