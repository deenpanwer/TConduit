'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  from: {
    name: string;
    email: string;
    address: string;
    phone: string;
    branding?: string;
  };
  to: {
    name: string;
    email: string;
    address: string;
    organization: string;
  };
  items: LineItem[];
  paymentInfo: string;
  notes: string;
  signature?: string;
  relatedToId?: string;
  relatedToType?: 'lead' | 'deal';
  hiddenFields?: Record<string, boolean>;
}

interface PCInvoiceCanvasProps {
  invoice: InvoiceData;
  subtotal: number;
  brandingLogo: string | null;
  invoiceRef?: React.RefObject<HTMLDivElement | null>;
}

export function PCInvoiceCanvas({ invoice, subtotal, brandingLogo, invoiceRef }: PCInvoiceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth;
        if (availableWidth > 0) {
          // Leave 16px of horizontal padding to ensure full visibility
          const targetScale = (availableWidth - 16) / 800;
          setScale(Math.max(0.35, Math.min(1.0, targetScale)));
        }
      }
    };

    updateScale();

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateScale);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const pages = useMemo(() => {
    const items = [...invoice.items];
    const p: LineItem[][] = [];

    const PAGE_HEIGHT = 1131;
    const PADDING = 120;
    const SAFE_ZONE = PAGE_HEIGHT - PADDING;

    const FIRST_PAGE_HEADER = 400;
    const SUBSEQUENT_PAGE_HEADER = 100;
    const FOOTER_HEIGHT = 380;
    const ITEM_BASE_HEIGHT = 50;
    const CHARS_PER_LINE = 60;
    const LINE_HEIGHT = 16;

    let currentPageItems: LineItem[] = [];
    let currentHeight = FIRST_PAGE_HEADER;
    let isFirstPage = true;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const extraLines = Math.max(0, Math.ceil((item.description || '').length / CHARS_PER_LINE) - 1);
      const itemHeight = ITEM_BASE_HEIGHT + extraLines * LINE_HEIGHT;

      const isLastItem = i === items.length - 1;
      const neededHeight = isLastItem ? itemHeight + FOOTER_HEIGHT : itemHeight;

      if (currentHeight + neededHeight > SAFE_ZONE) {
        p.push(currentPageItems);
        currentPageItems = [item];
        currentHeight = SUBSEQUENT_PAGE_HEADER + itemHeight;
        isFirstPage = false;
      } else {
        currentPageItems.push(item);
        currentHeight += itemHeight;
      }
    }

    if (currentPageItems.length > 0 || p.length === 0) {
      p.push(currentPageItems);
    }

    const lastPageItems = p[p.length - 1] || [];
    let lastPageHeight = p.length === 1 ? FIRST_PAGE_HEADER : SUBSEQUENT_PAGE_HEADER;
    for (const item of lastPageItems) {
      const extraLines = Math.max(0, Math.ceil((item.description || '').length / CHARS_PER_LINE) - 1);
      lastPageHeight += ITEM_BASE_HEIGHT + extraLines * LINE_HEIGHT;
    }

    if (lastPageHeight + FOOTER_HEIGHT > SAFE_ZONE && lastPageItems.length > 0) {
      p.push([]);
    }
    return p;
  }, [invoice.items, invoice.notes, invoice.paymentInfo]);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      <div 
        ref={invoiceRef as React.RefObject<HTMLDivElement>} 
        className="flex flex-col gap-8 items-center pb-16 w-full"
      >
        {pages.map((pageItems, pageIdx) => (
          <div 
            key={pageIdx}
            style={{
              width: `${800 * scale}px`,
              height: `${1131 * scale}px`,
            }}
            className="relative shrink-0 mx-auto shadow-2xl rounded-sm transition-all"
          >
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pageIdx * 0.08 }}
              className="invoice-page w-[800px] h-[1131px] bg-white dark:bg-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.12)] rounded-sm p-12 md:p-16 flex flex-col text-slate-800 dark:text-slate-200 absolute top-0 left-0 shrink-0"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Background decoration */}
              <div className="absolute -top-20 -right-20 size-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Header - Only on First Page */}
              {pageIdx === 0 && (
                <>
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="space-y-4">
                      {!invoice.hiddenFields?.['from.branding'] && (
                        brandingLogo ? (
                          <img src={brandingLogo} className="h-12 object-contain" alt="Branding Logo" />
                        ) : (
                          <div className="h-12 w-24 bg-slate-100 dark:bg-slate-900/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <ImageIcon className="text-slate-300" size={20} />
                          </div>
                        )
                      )}
                      <div className="space-y-1">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">INVOICE</h1>
                        <p className="text-xs font-bold text-blue-600/60 tracking-[0.2em]">#{invoice.invoiceNumber}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Amount Outstanding</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{invoice.currency} {subtotal.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-6 justify-end">
                        {!invoice.hiddenFields?.['issueDate'] && (
                          <div className="text-right border-r border-slate-100 dark:border-slate-800 pr-6">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Issuance Date</p>
                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{invoice.issueDate ? format(new Date(invoice.issueDate), 'MMM d, yyyy') : '-'}</p>
                          </div>
                        )}
                        {!invoice.hiddenFields?.['dueDate'] && (
                          <div className="text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Due Date</p>
                            <p className="text-[10px] font-bold text-rose-500">{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '-'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Parties Grid */}
                  <div className="grid grid-cols-2 gap-8 mb-10 relative z-10 bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600">FROM</p>
                      <div className="space-y-0.5">
                        {!invoice.hiddenFields?.['from.name'] && (
                          <p className="text-xs font-black text-slate-900 dark:text-white">{invoice.from.name || 'Company Name'}</p>
                        )}
                        {!invoice.hiddenFields?.['from.address'] && (
                          <p className="text-[10px] font-medium opacity-60 max-w-[200px] leading-tight">{invoice.from.address || 'Business Address'}</p>
                        )}
                        {!invoice.hiddenFields?.['from.email'] && (
                          <p className="text-[10px] font-bold opacity-80 mt-2">{invoice.from.email}</p>
                        )}
                        {!invoice.hiddenFields?.['from.phone'] && (
                          <p className="text-[10px] font-bold opacity-80">{invoice.from.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-600">BILL TO</p>
                      <div className="space-y-0.5">
                        {!invoice.hiddenFields?.['to.name'] && (
                          <p className="text-xs font-black text-slate-900 dark:text-white">{invoice.to.name || 'Client Name'}</p>
                        )}
                        {!invoice.hiddenFields?.['to.organization'] && (
                          <p className="text-[10px] font-black text-blue-600">{invoice.to.organization}</p>
                        )}
                        {!invoice.hiddenFields?.['to.address'] && (
                          <p className="text-[10px] font-medium opacity-60 ml-auto max-w-[200px] leading-tight">{invoice.to.address || 'Billing Address'}</p>
                        )}
                        {!invoice.hiddenFields?.['to.email'] && (
                          <p className="text-[10px] font-bold opacity-80 mt-2">{invoice.to.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Continued Page Header */}
              {pageIdx > 0 && (
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4 opacity-60">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Invoice #{invoice.invoiceNumber}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Continued - Page {pageIdx + 1}</p>
                  </div>
                  {!invoice.hiddenFields?.['from.name'] && (
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-900 dark:text-white">{invoice.from.name}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Table */}
              <div className="flex-1 relative z-10">
                {pageItems.length > 0 ? (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-900 dark:border-white">
                        <th className="py-4 text-[9px] font-black uppercase tracking-[0.2em]">Service Description</th>
                        <th className="py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] w-20">QTY</th>
                        <th className="py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] w-28">Rate</th>
                        <th className="py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {pageItems.map((item) => (
                        <tr key={item.id} className="group">
                          <td className="py-5 pr-4">
                            <p className="text-[12px] font-black text-slate-900 dark:text-white leading-tight">{item.description || 'Professional Services'}</p>
                          </td>
                          <td className="py-5 text-center text-[11px] font-bold text-slate-500">{item.quantity}</td>
                          <td className="py-5 text-right text-[11px] font-bold text-slate-500">{invoice.currency} {Number(item.rate).toLocaleString()}</td>
                          <td className="py-5 text-right text-[12px] font-black text-slate-900 dark:text-white">{invoice.currency} {(item.quantity * item.rate).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-20 flex items-center justify-center border-b border-dashed border-slate-100 dark:border-slate-800 opacity-20">
                    <p className="text-[10px] font-black uppercase tracking-widest">Document Continuation</p>
                  </div>
                )}
              </div>

              {/* Summary/Footer - Only on Last Page */}
              {pageIdx === pages.length - 1 && (
                <div className="mt-8 pt-8 border-t-2 border-slate-900 dark:border-white relative z-10">
                  <div className="flex justify-between gap-12">
                    <div className="flex-1 space-y-8">
                      {!invoice.hiddenFields?.['paymentInfo'] && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-blue-600" />
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Instructions</p>
                          </div>
                          <p className="text-[10px] font-mono font-bold whitespace-pre-wrap leading-relaxed opacity-70 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner">
                            {invoice.paymentInfo || 'Remittance details pending.'}
                          </p>
                        </div>
                      )}
                      {!invoice.hiddenFields?.['notes'] && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-slate-400" />
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">General Terms & Conditions</p>
                          </div>
                          <p className="text-[10px] font-bold italic opacity-50 max-w-[380px] leading-relaxed">{invoice.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="w-56 space-y-8 text-right">
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                          <span>Subtotal</span>
                          <span>{invoice.currency} {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black uppercase border-t border-slate-200 dark:border-slate-800 pt-3 text-blue-600">
                          <span>Total</span>
                          <span>{invoice.currency} {subtotal.toLocaleString()}</span>
                        </div>
                      </div>

                      {!invoice.hiddenFields?.['signature'] && (
                        <div className="pt-6">
                          <div className="inline-block border-b-2 border-slate-900 dark:border-white min-w-[180px] text-center pb-1">
                            <p className="text-xl font-signature italic tracking-[0.1em] text-slate-900 dark:text-white">
                              {invoice.signature || ''}
                            </p>
                          </div>
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Authorized Acceptance</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Page Numbers */}
              <div className="mt-16 flex items-center justify-end opacity-30 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">PAGE {pageIdx + 1} OF {pages.length}</p>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
