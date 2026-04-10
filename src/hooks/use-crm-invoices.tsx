'use client';

import { useCRMModule } from "./use-crm-module";
import { ModuleConfig } from "./use-crm";

const DEFAULT_INVOICE_CONFIG: ModuleConfig = {
  name: "Invoices",
  description: "Professional invoices for your clients and deals.",
  fields: [
    { id: 'inv1', key: 'invoiceNumber', label: 'Invoice #', type: 'text', isSystem: true, isVisible: true, order: 0 },
    { id: 'inv2', key: 'clientName', label: 'Client', type: 'text', isSystem: true, isVisible: true, order: 1 },
    { id: 'inv3', key: 'amount', label: 'Amount', type: 'currency', isSystem: true, isVisible: true, order: 2 },
    { id: 'inv4', key: 'status', label: 'Status', type: 'select', isSystem: true, isVisible: true, order: 3, options: [
      { label: 'Draft', value: 'draft', color: 'gray' },
      { label: 'Sent', value: 'sent', color: 'blue' },
      { label: 'Paid', value: 'paid', color: 'green' },
      { label: 'Overdue', value: 'overdue', color: 'red' },
      { label: 'Cancelled', value: 'cancelled', color: 'gray' },
    ]},
    { id: 'inv5', key: 'dueDate', label: 'Due Date', type: 'date', isSystem: true, isVisible: true, order: 4 },
    { id: 'inv6', key: 'relatedTo', label: 'Related To', type: 'text', isSystem: true, isVisible: true, order: 5 },
  ],
  views: [
    { id: 'invv1', name: 'All Invoices', type: 'list', visibleFields: ['inv1', 'inv2', 'inv3', 'inv4', 'inv5', 'inv6'] },
  ]
};

export function useCRMInvoices() {
  return useCRMModule('invoices', DEFAULT_INVOICE_CONFIG);
}
