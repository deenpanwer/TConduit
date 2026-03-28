"use client";

import React, { useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePos } from '@/hooks/use-pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Printer, ArrowLeft, CheckCircle2, UserPlus, UserCheck, Phone, User, ShoppingCart, Receipt } from 'lucide-react';
import { toast } from 'sonner';

/**
 * @file invoice/page.tsx
 * @description Professional POS Receipt Page.
 * Optimized for high-contrast screen readability and 80mm thermal printers.
 */

export default function InvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { salesHistory, customers, addCustomer, config } = usePos();
  const { id } = params;
  const printRef = useRef<HTMLDivElement>(null);
  
  const [quickCustomer, setQuickCustomer] = useState({ name: '', phone: '' });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const sale = salesHistory.find(s => s.id === id);

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground font-medium">Sale not found.</p>
        <Button variant="outline" onClick={() => router.push('/pos/checkout')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to POS
        </Button>
      </div>
    );
  }

  const customer = customers.find(c => c.id === sale.customerId);

  const handleQuickCustomerAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomer.name || !quickCustomer.phone) {
        toast.error("Please provide both name and phone number.");
        return;
    }

    setIsAddingCustomer(true);
    try {
        const newCustomer = await addCustomer({
            name: quickCustomer.name,
            phoneNumber: quickCustomer.phone,
        });
        
        if (newCustomer) {
            toast.success("Customer added successfully!");
            setQuickCustomer({ name: '', phone: '' });
            // In a real app, we'd also link the sale to this customer ID here
        }
    } catch (error) {
        toast.error("Failed to add customer.");
    } finally {
        setIsAddingCustomer(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 dark:bg-slate-950 flex flex-col md:flex-row gap-8 justify-center items-start">
      <div className="flex-grow max-w-md w-full">
          {/* Action Bar (Hidden during print) */}
          <div className="mb-6 flex justify-between items-center print:hidden">
            <Button variant="ghost" onClick={() => router.push('/pos/checkout')} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to POS
            </Button>
            <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 shadow-md">
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </div>

          {/* Success Message (Hidden during print) */}
          <div className="mb-6 text-center print:hidden animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Payment Successful</h2>
              <p className="text-slate-500 text-sm">Transaction #{sale.id.slice(-6).toUpperCase()}</p>
          </div>

          {/* Physical Receipt Container */}
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
                    <p className="text-xs font-black tracking-[0.2em] uppercase text-center">Official Receipt</p>
                </div>
              </div>
            </div>

            {/* --- TRANSACTION INFO --- */}
            <div className="text-[12px] space-y-1 mb-6 font-bold uppercase tracking-tight">
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span>Date</span>
                <span className="text-right">{new Date(sale.createdAt).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span>Order ID</span>
                <span className="text-right">#{sale.id.toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span>Cashier</span>
                <span className="text-right">{sale.cashierName || 'System Admin'}</span>
              </div>
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
                  {sale.items.map(item => (
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
                <span>${sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-${sale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span>${sale.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black pt-2 mt-2 border-t-2 border-double border-black">
                <span>Total</span>
                <span>${sale.grandTotal.toFixed(2)}</span>
              </div>
              
              <div className="pt-4 space-y-1">
                  <div className="flex justify-between italic normal-case font-bold">
                      <span>Amount Paid</span>
                      <span>${(sale.amountPaid || sale.grandTotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between italic normal-case font-black text-orange-600 border-t border-black/10 pt-1">
                      <span>Change to Return</span>
                      <span>${(sale.changeAmount || 0).toFixed(2)}</span>
                  </div>
              </div>

              <div className="pt-4 flex justify-between items-center italic normal-case font-bold">
                  <span>Payment: {sale.paymentMethod || 'Cash'}</span>
                  <span className="text-[10px] font-black uppercase border border-black px-1">Paid in Full</span>
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
              <p className="text-[10px] font-bold tracking-widest">{sale.id.toUpperCase()}</p>
            </div>
          </div>
      </div>

      {/* Right Sidebar: Quick CRM Actions (Hidden during print) */}
      <div className="w-full max-w-xs space-y-6 print:hidden">
          {!customer ? (
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
                      <p className="text-[9px] text-muted-foreground text-center mt-4 uppercase font-bold tracking-widest leading-relaxed">
                          Quick add only stores name and phone. Use Customers page for full profiles.
                      </p>
                  </CardContent>
              </Card>
          ) : (
              <Card className="border-green-500/20 bg-green-500/5 shadow-lg border-2">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <UserCheck className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="space-y-1">
                          <h3 className="font-black text-sm uppercase tracking-tighter">Customer Linked</h3>
                          <p className="text-xs font-bold text-slate-600">{customer.name}</p>
                          <p className="text-[10px] text-slate-400">{customer.phoneNumber}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 text-[10px] font-black uppercase tracking-widest h-8"
                        onClick={() => router.push('/pos/customers')}
                      >
                          View Full Profile
                      </Button>
                  </CardContent>
              </Card>
          )}

          <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Next Steps</h4>
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
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          * {
            color: black !important;
            text-shadow: none !important;
            box-shadow: none !important;
          }
          @page {
            margin: 0;
            size: 80mm auto; /* Specific to thermal printers */
          }
        }
      `}</style>
    </div>
  );
}
