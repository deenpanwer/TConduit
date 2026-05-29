"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePos, SaleTransaction, PosTicket, Product } from '@/hooks/use-pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { 
    Printer, ArrowLeft, CheckCircle2, UserPlus, UserCheck, Phone, User, 
    ShoppingCart, Receipt, Utensils, Clock, Info, CreditCard 
} from 'lucide-react';
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
  const { 
    products, // Need products to get image URLs
    customers, addCustomer, linkCustomerToTicket, config, 
    getEntityForInvoice, selectTable, tables 
  } = usePos();
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
    if (invoiceId) fetchEntity();
  }, [invoiceId, getEntityForInvoice]);

  const isProForma = entityData?.type === 'ticket';
  const isSale = entityData?.type === 'sale';
  const showImagesOnBill = config?.showProductImagesOnInvoice;

  const data = entityData?.data;
  const type = entityData?.type;

  const customerId = (data as SaleTransaction)?.customerId || (data as PosTicket)?.customerId;
  const customer = customerId ? customers.find(c => c.id === customerId) : null;

  const saleItems = data?.items || [];
  const subtotal = useMemo(() => saleItems.reduce((sum, item) => sum + (item.lineItemTotal || 0), 0), [saleItems]);
  const discountAmount = useMemo(() => saleItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.discount || 0) / 100), 0), [saleItems]);
  const taxRate = useMemo(() => (config?.defaultTaxRate || 0) / 100, [config?.defaultTaxRate]);
  const taxableAmount = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
  const taxAmount = useMemo(() => taxableAmount * taxRate, [taxableAmount, taxRate]);
  const grandTotal = useMemo(() => taxableAmount + taxAmount, [taxableAmount, taxAmount]);
  
  const saleCreatedAt = data?.createdAt;
  const saleId = data?.id;
  const cashierName = isSale ? (data as SaleTransaction)?.cashierName : data?.createdBy?.name;
  const tableId = (data as PosTicket)?.tableId || (isSale ? (data as SaleTransaction)?.tableId : null);
  const table = tableId ? tables.find(t => t.id === tableId) : null;

  // Loading state while fetching the invoice data
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

  // Handle case where no data is found for the given ID
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

  const handlePrint = () => {
    // A more robust print method
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      printWindow?.document.write('<html><head><title>Print</title>');
      printWindow?.document.write('<style>@media print { @page { size: 80mm auto; margin: 0; } body { -webkit-print-color-adjust: exact; margin: 0; padding: 0;} * { color: black !important; text-shadow: none !important; box-shadow: none !important; } .print-only { display: block; } .no-print { display: none; } }</style>');
      printWindow?.document.write('</head><body>');
      printWindow?.document.write(printContent.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      printWindow?.print();
    }
  };

  const handleQuickCustomerAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomer.name) {
        toast.error("Please provide a customer name.");
        return;
    }
    setIsAddingCustomer(true);
    try {
        const newCustomerId = await addCustomer({ name: quickCustomer.name, phoneNumber: quickCustomer.phone });
        if (newCustomerId && isProForma) {
            await linkCustomerToTicket(saleId, newCustomerId);
            const result = await getEntityForInvoice(invoiceId); // Refresh data
            setEntityData(result);
            toast.success("Customer added and linked to bill!");
        } else {
            toast.error("Failed to add or link customer.");
        }
        setQuickCustomer({ name: '', phone: '' });
    } catch (error) {
        toast.error("An error occurred while adding the customer.");
    } finally {
        setIsAddingCustomer(false);
    }
  };

  const handleProceedToPayment = () => {
    if (isProForma && tableId) {
      selectTable(tableId); // Set the correct table context
      router.push(`/pos/checkout`); // Navigate to checkout to finalize
    } else {
      // For finalized sales, maybe go back to the dashboard or history
      router.push(`/pos/dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 justify-center items-start">
      <div className="w-full md:max-w-xl">
          {/* Action Bar (hidden on print) */}
          <div className="mb-6 flex justify-between items-center print:hidden">
            <Button variant="ghost" onClick={() => router.back()} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 shadow-md">
              <Printer className="mr-2 h-4 w-4" /> Print {isProForma ? 'Bill' : 'Receipt'}
            </Button>
          </div>

          {/* Status Header */}
          {isSale && (
            <Card className="mb-6 text-center print:hidden bg-green-500/10 border-green-500/20">
              <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Transaction Complete</h2>
                  <p className="text-slate-500 text-sm">Ref: #{saleId?.slice(-6).toUpperCase()}</p>
              </CardContent>
            </Card>
          )}
          {isProForma && (
             <Card className="mb-6 text-center print:hidden bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-6">
                  <Info className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">This is a Pro-Forma Bill</h2>
                  <p className="text-slate-500 text-sm">Finalize the payment to generate an official receipt.</p>
              </CardContent>
            </Card>
          )}

          {/* Receipt/Bill Container */}
          <div ref={printRef} className="mx-auto bg-white shadow-2xl rounded-lg overflow-hidden print:shadow-none print:rounded-none text-black">
            <div className="p-6 sm:p-8">
                {/* --- HEADER --- */}
                <div className="text-center mb-6 space-y-1">
                    <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">{config.storeName}</h1>
                    <p className="text-xs font-bold uppercase">{config.storeAddress}</p>
                    <p className="text-xs font-bold uppercase">Tel: {config.storePhone}</p>
                    <div className="pt-4 pb-2">
                        <div className="border-y border-dashed border-black py-2">
                            <p className="text-sm font-black tracking-[0.2em] uppercase text-center">{isProForma ? "Pro-forma Bill" : "Official Receipt"}</p>
                        </div>
                    </div>
                </div>

                {/* --- TRANSACTION INFO --- */}
                <div className="text-[12px] space-y-1.5 mb-6 font-bold uppercase tracking-tight">
                    <div className="flex justify-between"><span className="text-gray-500">Date:</span><span>{new Date(saleCreatedAt).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Order ID:</span><span>#{saleId?.toUpperCase()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Cashier:</span><span>{cashierName || 'N/A'}</span></div>
                    {table && <div className="flex justify-between"><span className="text-gray-500">Table:</span><span>{table.number} ({table.floor})</span></div>}
                    <div className="flex justify-between"><span className="text-gray-500">Customer:</span><span className="truncate max-w-[150px]">{customer?.name || "Walk-in"}</span></div>
                </div>

                {/* --- ITEM LIST --- */}
                <div className="mb-6">
                  <h3 className="text-xs font-black tracking-widest uppercase text-gray-400 mb-2">Order Summary</h3>
                  <div className="divide-y divide-dashed divide-gray-200">
                      {saleItems.map(item => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                              <div key={item.id} className={cn("py-3 flex items-start gap-4", showImagesOnBill && product?.imageUrl && "items-center")}>
                                  <div className="flex-grow">
                                      <p className="font-black uppercase leading-tight">{item.name}</p>
                                      <p className="text-[11px] font-bold text-gray-600">
                                          {item.quantity} × ${item.unitPrice.toFixed(2)}
                                          {item.discount > 0 && <span className="ml-2 text-red-500">(-{item.discount}%)</span>}
                                      </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="font-black">${item.lineItemTotal.toFixed(2)}</p>
                                  </div>
                                  {showImagesOnBill && product?.imageUrl && (
                                      <img src={product.imageUrl} alt={item.name} className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-gray-100" />
                                  )}
                              </div>
                          );
                      })}
                  </div>
                </div>

                {/* --- TOTALS --- */}
                <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-2 text-sm font-bold">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    {discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>-${discountAmount.toFixed(2)}</span></div>}
                    <div className="flex justify-between"><span className="text-gray-600">Tax ({config.defaultTaxRate}%)</span><span>${taxAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between text-xl font-black pt-2 mt-2 border-t-2 border-double border-black">
                        <span>TOTAL</span><span>${grandTotal.toFixed(2)}</span>
                    </div>
                </div>
                
                {/* --- PAYMENT INFO (ONLY FOR FINALIZED SALES) --- */}
                {isSale && (
                    <div className="border-t-2 border-dashed border-gray-300 mt-6 pt-4 space-y-2 text-sm font-bold">
                        <div className="flex justify-between"><span className="text-gray-600">Amount Paid</span><span>${(data as SaleTransaction).amountPaid.toFixed(2)}</span></div>
                        <div className="flex justify-between text-orange-600"><span className="font-black">Change Due</span><span className="font-black">${(data as SaleTransaction).changeAmount.toFixed(2)}</span></div>
                        <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-gray-600">Payment Method: {(data as SaleTransaction).paymentMethod}</span>
                          <span className="text-xs font-black uppercase bg-green-100 text-green-700 px-2 py-1 rounded">Paid in Full</span>
                        </div>
                    </div>
                )}
            </div>
            {/* --- FOOTER / BRANDING --- */}
            <div className="bg-gray-50 p-6 text-center space-y-2 print:bg-white">
                <p className="text-xs font-bold uppercase tracking-wider">Thank you for your business!</p>
                <p className="text-xs font-bold text-gray-500">Powered by TRAC AI</p>
            </div>
          </div>
      </div>

      {/* Right Sidebar: Quick Actions (hidden on print) */}
      <div className="w-full md:max-w-sm space-y-6 print:hidden">
          {/* Conditional block for pro-forma bills */}
          {isProForma && (
              <Card className="shadow-lg">
                  <CardHeader><h3 className="font-black text-lg">Next Steps</h3></CardHeader>
                  <CardContent>
                      <Button onClick={handleProceedToPayment} className="w-full h-12 font-bold text-base bg-blue-600 hover:bg-blue-700">
                          <CreditCard className="mr-2 h-5 w-5" /> Proceed to Payment
                      </Button>
                      {!customer && (
                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm font-bold text-muted-foreground hover:text-primary">Assign Customer to Bill</summary>
                          <form onSubmit={handleQuickCustomerAdd} className="space-y-4 pt-4 border-t mt-2">
                              <Input placeholder="Customer Name*" value={quickCustomer.name} onChange={(e) => setQuickCustomer({...quickCustomer, name: e.target.value})} />
                              <Input placeholder="Phone Number (Optional)" value={quickCustomer.phone} onChange={(e) => setQuickCustomer({...quickCustomer, phone: e.target.value})} />
                              <Button type="submit" className="w-full" disabled={isAddingCustomer}>{isAddingCustomer ? "Adding..." : "Add & Link Customer"}</Button>
                          </form>
                        </details>
                      )}
                  </CardContent>
              </Card>
          )}
          {customer && (
              <Card className="shadow-lg border-2 border-green-500/20 bg-green-500/5">
                  <CardContent className="p-6 flex items-center gap-4">
                      <UserCheck className="h-8 w-8 text-green-600 flex-shrink-0" />
                      <div>
                          <h3 className="font-black text-sm uppercase tracking-tighter">{customer.name}</h3>
                          <p className="text-xs font-bold text-slate-600">{customer.phoneNumber || 'No phone on file'}</p>
                      </div>
                  </CardContent>
              </Card>
          )}
      </div>

      {/* Global CSS for Printing - Scoped to this page */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print\:hidden { display: none !important; }
          .print\:bg-white { background-color: white !important; }
        }
      `}</style>
    </div>
  );
}
