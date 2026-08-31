'use client';

export interface FreeLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface FreeInvoiceData {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  from: {
    name: string;
    email: string;
    address: string;
    phone: string;
    branding?: string; // Base64 data URL or image link
  };
  to: {
    name: string;
    email: string;
    address: string;
    organization: string;
  };
  items: FreeLineItem[];
  paymentInfo: string;
  notes: string;
  signature?: string;
  hiddenFields?: Record<string, boolean>;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'trac_free_tools_invoices_v1';

export function getFreeInvoices(): FreeInvoiceData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load free invoices from localStorage:', err);
    return [];
  }
}

export function getFreeInvoiceById(id: string): FreeInvoiceData | null {
  const invoices = getFreeInvoices();
  return invoices.find((inv) => inv.id === id) || null;
}

export function saveFreeInvoice(invoice: Omit<FreeInvoiceData, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): FreeInvoiceData {
  const invoices = getFreeInvoices();
  const now = Date.now();

  let targetInvoice: FreeInvoiceData;

  if (invoice.id) {
    const existingIndex = invoices.findIndex((i) => i.id === invoice.id);
    if (existingIndex >= 0) {
      targetInvoice = {
        ...invoices[existingIndex],
        ...invoice,
        id: invoice.id,
        updatedAt: now,
      };
      invoices[existingIndex] = targetInvoice;
    } else {
      targetInvoice = {
        ...invoice,
        id: invoice.id,
        createdAt: now,
        updatedAt: now,
      };
      invoices.unshift(targetInvoice);
    }
  } else {
    const newId = `free_inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    targetInvoice = {
      ...invoice,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    invoices.unshift(targetInvoice);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.error('Failed to save free invoice to localStorage:', err);
  }

  return targetInvoice;
}

export function deleteFreeInvoice(id: string): boolean {
  const invoices = getFreeInvoices();
  const filtered = invoices.filter((inv) => inv.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Failed to delete free invoice from localStorage:', err);
    return false;
  }
}

export function duplicateFreeInvoice(id: string): FreeInvoiceData | null {
  const original = getFreeInvoiceById(id);
  if (!original) return null;

  const duplicated: Omit<FreeInvoiceData, 'id' | 'createdAt' | 'updatedAt'> = {
    ...original,
    invoiceNumber: `${original.invoiceNumber}-COPY`,
    status: 'draft',
  };

  return saveFreeInvoice(duplicated);
}

export function updateFreeInvoiceStatus(id: string, status: FreeInvoiceData['status']): boolean {
  const invoices = getFreeInvoices();
  const target = invoices.find((inv) => inv.id === id);
  if (!target) return false;

  target.status = status;
  target.updatedAt = Date.now();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    return true;
  } catch (err) {
    console.error('Failed to update free invoice status:', err);
    return false;
  }
}
