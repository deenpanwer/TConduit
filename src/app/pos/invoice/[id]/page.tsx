"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePos, SaleTransaction, PosTicket } from '@/hooks/use-pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Printer, ArrowLeft, CheckCircle2, UserPlus, UserCheck, Phone, User, ShoppingCart, Receipt, Utensils, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * @file invoice/page.tsx
 * @description Dynamic POS Receipt/Bill Preview Page.
 * Displays either a finalized Sale Transaction or a Pro-forma Bill for an active ticket.
 */

export default function InvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { salesHistory, customers, addCustomer, linkCustomerToTicket, config, getEntityForInvoice, selectTable, activeTickets, tables } = usePos();
  const invoiceId = params.id as string;
  const printRef = useRef<HTMLDivElement>(null);
  
  const [entityData, setEntityData] = useState<{ data: SaleTransaction | PosTicket | null, type: 'sale' | 'ticket' | 'notFound' } | null>(null);
  const [quickCustomer, setQuickCustomer] = useState({ name: '', phone: '' });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  useEffect(() => {
    const fetchEntity = async () => {
      const result = await getEntityForInvoice(invoiceId);
      setEntityData(result);
    };
    fetchEntity();
  }, [invoiceId, getEntityForInvoice]);

  // If data is not yet loaded, show skeleton or loading indicator
  if (!entityData) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
            <Utensils className="h-12 w-12 text-primary animate-bounce mx-auto" />
            <p className="font-black uppercase tracking-[0.2em] text-xs">Loading Receipt...</p>
        </div>
      </div>
    );
  }

  const { data, type } = entityData;

  if (!data || type === 'notFound') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground font-medium">Receipt or Active Ticket not found.</p>
        <Button variant="outline" onClick={() => router.push('/pos/checkout')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to POS
        </Button>
      </div>
    );
  }

  const isProForma = type === 'ticket';
  const isSale = type === 'sale';
  
  const customerId = (data as SaleTransaction)?.customerId || (data as PosTicket)?.customerId;
  const customer = customerId ? customers.find(c => c.id === customerId) : null;

  const saleItems = data.items || [];
  const subtotal = saleItems.reduce((sum, item) => sum + item.lineItemTotal, 0);
  const discountAmount = saleItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.discount || 0) / 100), 0);
  const taxRate = (config.defaultTaxRate || 0) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * taxRate;
  const grandTotal = taxableAmount + taxAmount;
  
  const saleCreatedAt = data.createdAt;
  const saleId = data.id;
  const cashierName = isSale ? (data as SaleTransaction).cashierName : data.createdBy?.name;
  const tableId = (data as PosTicket).tableId || (isSale ? (data as SaleTransaction).tableId : null);
  const table = tableId ? tables.find(t => t.id === tableId) : null;

  const handlePrint = () => {
    window.print();
  };

  const handleQuickCustomerAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomer.name || !quickCustomer.phone) {
        toast.error("Please provide both name and phone number.");
        return;
    }
    setIsAddingCustomer(true);
    try {
        const newCustomerId = await addCustomer({ name: quickCustomer.name, phoneNumber: quickCustomer.phone });
        if (newCustomerId && isProForma) {
            await linkCustomerToTicket(saleId, newCustomerId);
            const result = await getEntityForInvoice(invoiceId);
            setEntityData(result);
            toast.success("Customer added and linked!");
        } else if (newCustomerId) {
            toast.success("Customer added successfully!");
        } else {
            toast.error("Failed to add customer.");
        }
        setQuickCustomer({ name: '', phone: '' });
    } catch (error) {
        toast.error("Failed to add customer.");
    } finally {
        setIsAddingCustomer(false);
    }
  };

  const handleProceedToPayment = () => {
    if (isProForma && tableId) {
      selectTable(tableId); // Set the table context for checkout
      router.push(`/pos/checkout`); // Navigate to checkout
    } else if (isSale) {
      router.push(`/pos/checkout`); // Already finalized, maybe go back to POS or dashboard
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 dark:bg-slate-950 flex flex-col md:flex-row gap-8 justify-center items-start">
      <div className="flex-grow max-w-md w-full">
          {/* Action Bar */}
          <div className="mb-6 flex justify-between items-center print:hidden">
            <Button variant="ghost" onClick={() => router.push('/pos/floors')} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Floor Plan
            </Button>
            <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 shadow-md">
              <Printer className="mr-2 h-4 w-4" />
              Print {isProForma ? 'Bill' : 'Receipt'}
            </Button>
          </div>

          {/* Success Message (only for finalized sales) */}
          {isSale && (
            <div className="mb-6 text-center print:hidden animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Transaction Complete</h2>
                <p className="text-slate-500 text-sm">Ref: #{saleId?.slice(-6).toUpperCase()}</p>
            </div>
          )}

          {/* Receipt/Bill Container */}
          <div 
            ref={printRef}
            className="mx-auto bg-white shadow-2xl w-full max-w-[380px] p-6 sm:p-8 print:shadow-none print:p-0 print:w-full text-black"
            style={{ 
                fontFamily: "'Courier New', Courier, monospace",
                color: '#000000' 
            }}
          >
            {/* --- RECEIPT HEADER --- */}
            <div className="text-center mb-6 space-y-1">
              <h1 className="text-2xl font-black tracking-tighter uppercase mb-1 leading-none">{config.storeName || 'TRAC STORE #001'}</h1>
              <p className="text-xs font-bold uppercase">{config.storeAddress || '123 Business Rd, Tech City'}</p>
              <p className="text-xs font-bold uppercase">Tel: {config.storePhone || '+1 (555) 000-0000'}</p>
              <div className="pt-4 pb-2">
                <div className="border-y border-black py-1.5">
                    <p className="text-xs font-black tracking-[0.2em] uppercase text-center">{isProForma ? "Pro-forma Bill" : "Official Receipt"}</p>
                </div>
              </div>
            </div>

            {/* --- TRANSACTION INFO --- */}
            <div className="text-[12px] space-y-1 mb-6 font-bold uppercase tracking-tight">
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span>Date</span>
                <span className="text-right">{new Date(saleCreatedAt).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span>Order ID</span>
                <span className="text-right">#{saleId?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span>Cashier</span>
                <span className="text-right">{cashierName || 'System Admin'}</span>
              </div>
              {table && (
                <div className="flex justify-between border-b border-black/10 pb-1">
                  <span>Table</span>
                  <span className="text-right">{table.number} ({table.floor})</span>
                </div>
              )}
              <div className="flex justify-between border-b border-black/10 pb-1">
                  <span>Customer</span>
                  <span className="text-right truncate max-w-[150px]">{customer?.name || "Walk-in Customer"}</span>
              </div>
            </div>

            {/* --- ITEM TABLE --- */}
            <div className="mb-6">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-black text-left">
                    <th className="py-2 font-black uppercase">Item</th>
                    <th className="py-2 text-right font-black uppercase">Qty</th>
                    <th className="py-2 text-right font-black uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20">
                  {saleItems.map(item => (
                    <tr key={item.id} className="align-top">
                      <td className="py-3 pr-2">
                        <p className="font-black uppercase leading-tight mb-1">{item.name}</p>
                        <p className="text-[11px] font-bold">
                          {item.quantity} x ${item.unitPrice.toFixed(2)}
                          {item.discount > 0 && ` (-${item.discount}%)`}
                        </p>
                      </td>
                      <td className="py-3 text-right font-black">{item.quantity}</td>
                      <td className="py-3 text-right font-black">${item.lineItemTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- TOTALS --- */}
            <div className="border-t-2 border-black pt-3 space-y-1 text-[12px] mb-8 uppercase font-black">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black pt-2 mt-2 border-t-2 border-double border-black">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
              
              {isSale && (
                  <div className="pt-4 space-y-1">
                      <div className="flex justify-between italic normal-case font-bold">
                          <span>Amount Paid</span>
                          <span>${((data as SaleTransaction).amountPaid || (data as SaleTransaction).grandTotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between italic normal-case font-black text-orange-600 border-t border-black/10 pt-1">
                          <span>Change to Return</span>
                          <span>${((data as SaleTransaction).changeAmount || 0).toFixed(2)}</span>
                      </div>
                  </div>
              )}

              <div className="pt-4 flex justify-between items-center italic normal-case font-bold">
                  <span>Payment: {(data as SaleTransaction).paymentMethod || 'Cash'}</span>
                  {isSale && (
                    <span className="text-[10px] font-black uppercase border border-black px-1">Paid in Full</span>
                  )}
              </div>
            </div>

            {/* --- FOOTER / BRANDING --- */}
            <div className="text-center space-y-5 pt-4 border-t border-black">
              <div className="space-y-1">
                <p className="text-[12px] font-black uppercase tracking-wider">Thank you for your business!</p>
                <p className="text-[11px] font-bold">Please keep this receipt for your records.</p>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold">Powered by</span>
                    <span className="text-[14px] font-black tracking-tighter">TRAC AI</span>
                </div>
                <p className="text-[9px] font-black tracking-[.2em] uppercase">Intelligence for POS</p>
              </div>
              
              <div className="pt-2 h-12 w-full bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_5px)] opacity-100 mx-auto" style={{ width: '85%' }}></div>
              <p className="text-[10px] font-black tracking-widest">{saleId?.toUpperCase()}</p>
            </div>
          </div>
      </div>

      {/* Right Sidebar: Quick CRM Actions / Next Steps (Hidden during print) */}
      <div className="w-full max-w-xs space-y-6 print:hidden">
          {(!customer && !isAddingCustomer) ? (
              <Card className="border-border bg-card shadow-lg">
                  <CardHeader className="pb-3 px-6 pt-6">
                      <div className="flex items-center gap-2 text-primary font-black uppercase tracking-tighter text-sm">
                          <UserPlus className="h-4 w-4" />
                          Quick Add Customer
                      </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                      <form onSubmit={handleQuickCustomerAdd} className="space-y-4">
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                              <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                  <Input 
                                      placeholder="John Doe" 
                                      className="pl-10 h-10 text-xs font-bold bg-muted/20 border-border"
                                      value={quickCustomer.name}
                                      onChange={(e) => setQuickCustomer({...quickCustomer, name: e.target.value})}
                                  />
                              </div>
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label>
                              <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                  <Input 
                                      placeholder="+1 (555) 000-0000" 
                                      className="pl-10 h-10 text-xs font-bold bg-muted/20 border-border"
                                      value={quickCustomer.phone}
                                      onChange={(e) => setQuickCustomer({...quickCustomer, phone: e.target.value})}
                                  />
                              </div>
                          </div>
                          <Button 
                              type="submit" 
                              className="w-full h-10 font-black uppercase tracking-widest text-[10px] mt-2 gap-2"
                              disabled={isAddingCustomer}
                          >
                              {isAddingCustomer ? "Adding..." : <><UserPlus className="h-4 w-4" /> Add to CRM</>}
                          </Button>
                      </form>
                  </CardContent>
              </Card>
          ) : (
              <Card className={cn(
                  "shadow-lg border-2",
                  customer ? "border-green-500/20 bg-green-500/5" : "border-border bg-card"
              )}>
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", customer ? "bg-green-500/20" : "bg-slate-200")}>
                          {customer ? <UserCheck className="h-6 w-6 text-green-600" /> : <UserPlus className="h-6 w-6 text-muted-foreground" />}
                      </div>
                      <div className="space-y-1">
                          <h3 className="font-black text-sm uppercase tracking-tighter">{customer?.name || "Walk-in"}</h3>
                          <p className="text-xs font-bold text-slate-600">{customer?.phoneNumber}</p>
                      </div>
                      {customer && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 text-[10px] font-black uppercase tracking-widest h-8"
                            onClick={() => router.push('/pos/customers')}
                          >
                              View Profile
                          </Button>
                      )}
                  </CardContent>
              </Card>
          )}

          {/* Actions */}
          <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Next Actions</h4>
              <div className="space-y-2">
                  <Button 
                    className="w-full justify-start h-11 text-xs font-bold gap-3 bg-white hover:bg-slate-50 text-slate-900 border-slate-200 border shadow-sm"
                    onClick={() => router.push('/pos/checkout')}
                  >
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      New Transaction
                  </Button>
                  <Button 
                    className="w-full justify-start h-11 text-xs font-bold gap-3 bg-white hover:bg-slate-50 text-slate-900 border-slate-200 border shadow-sm"
                    onClick={() => router.push('/pos/customers')}
                  >
                      <User className="h-4 w-4 text-primary" />
                      Manage Customers
                  </Button>
              </div>
          </div>
      </div>

      {/* Global CSS for Printing */}
      <style jsx global>{`
        @media print {
          body { background: white !important; padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact; }
          .print\:hidden { display: none !important; }
          * { color: black !important; text-shadow: none !important; box-shadow: none !important; }
          @page { margin: 0; size: 80mm auto; }
        }
      `}</style>
    </div>
  );
}