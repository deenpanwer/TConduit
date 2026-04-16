
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import { useCRM } from '@/hooks/use-crm';

// --- Types & Interfaces ---

export interface HistoryEntry {
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: any;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  basePrice: number;
  discountedPrice?: number;
  costPrice: number;
  taxRate: number; 
  stockQuantity: number;
  category?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { uid: string; name: string; };
  updatedBy?: { uid: string; name: string; };
  orgId?: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number; 
  lineItemTotal: number;
}

export interface SaleTransaction {
  id: string;
  createdAt: string;
  customerId?: string | null;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  cashierName?: string;
  tableId?: string | null;
  ticketId?: string | null;
  tableStartTime?: string;
  createdBy: { uid: string; name: string; };
  history: HistoryEntry[];
  orgId?: string;
}

export interface PosTable {
  id: string;
  number: string;
  floor: string;
  capacity: number;
  status: 'free' | 'eating' | 'bill';
  currentTicketId: string | null;
  lastStatusChange?: string | null; 
  imageUrl?: string;
  createdAt: string;
  createdBy: { uid: string; name: string; };
  history: HistoryEntry[];
  orgId?: string;
}

export interface PosTicket {
  id: string;
  tableId: string | null;
  customerId?: string | null;
  items: SaleItem[];
  status: 'active' | 'billed' | 'paid';
  createdAt: string;
  updatedAt: string;
  createdBy: { uid: string; name: string; };
  history: HistoryEntry[];
  orgId?: string;
}

export interface PosConfig {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  defaultTaxRate: number;
  isRestaurantMode: boolean; 
  floors: string[]; 
  showProductImagesOnInvoice: boolean;
  updatedAt?: string;
  updatedBy?: { uid: string; name: string; };
  id?: string;
}

export interface PosContextType {
  products: Product[];
  customers: any[]; 
  salesHistory: SaleTransaction[];
  tables: PosTable[];
  activeTickets: PosTicket[];
  config: PosConfig;
  currentSale: {
    items: SaleItem[];
    customerId: string | null;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
    tableId: string | null;
  };
  loading: {
    products: boolean;
    customers: boolean;
    history: boolean;
    tables: boolean;
    saving: boolean;
  };
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => Promise<string>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  uploadProductImage: (productId: string, fileOrBase64: File | string, onProgress?: (p: number) => void) => Promise<string>;
  addCustomer: (data: { name: string; phoneNumber?: string; email?: string }) => Promise<string | null>;
  linkCustomerToTicket: (ticketId: string, customerId: string) => Promise<void>;
  addItemToSale: (productId: string, quantity: number) => void;
  removeItemFromSale: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemPrice: (itemId: string, newPrice: number) => void;
  updateItemDiscount: (itemId: string, newDiscount: number) => void;
  applyDiscount: (discountType: 'amount' | 'percentage', value: number) => Promise<void>;
  selectCustomer: (id: string | null) => void;
  clearCurrentSale: () => void;
  completeSale: (method: string, status: 'Paid' | 'Pending', paid: number, cashier?: string) => Promise<SaleTransaction | null>;
  addTable: (data: Omit<PosTable, 'id' | 'status' | 'currentTicketId' | 'createdAt' | 'createdBy' | 'history' | 'imageUrl'>) => Promise<void>;
  updateTable: (id: string, data: Partial<PosTable>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  uploadTableImage: (tableId: string, file: File, onProgress?: (p: number) => void) => Promise<string>;
  getTTSForTable: (table: PosTable) => string;
  selectTable: (id: string | null) => void;
  saveTicket: () => Promise<void>; 
  loadTicket: (ticketId: string) => Promise<void>;
  setConfig: (data: Partial<PosConfig>) => Promise<void>;
  updateProductStock: (productId: string, quantity: number) => Promise<boolean>;
  getEntityForInvoice: (id: string) => Promise<{ data: SaleTransaction | PosTicket | null, type: 'sale' | 'ticket' | 'notFound' }>;
}

const defaultPosConfig: PosConfig = {
  storeName: 'TRAC POS',
  storeAddress: '',
  storePhone: '',
  defaultTaxRate: 0,
  isRestaurantMode: false,
  floors: ['Main Floor'],
  showProductImagesOnInvoice: false,
};

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: ReactNode }) {
  const { userData, user } = useAuth();
  const orgId = useMemo(() => (userData as any)?.orgId, [userData]);
  const { leads: crmLeads, addEntity: addCrmEntity, loading: crmLoading } = useCRM();

  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleTransaction[]>([]);
  const [tables, setTables] = useState<PosTable[]>([]);
  const [activeTickets, setActiveTickets] = useState<PosTicket[]>([]);
  const [config, setConfigState] = useState<PosConfig>(defaultPosConfig);
  const [loading, setLoading] = useState({
    products: true,
    customers: true,
    history: true,
    tables: true,
    saving: false,
  });

  const [currentSale, setCurrentSale] = useState<PosContextType['currentSale']>({
    items: [],
    customerId: null,
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    grandTotal: 0,
    tableId: null,
  });

  useEffect(() => {
    if (!orgId) return;

    const unsubConfig = storage.onSnapshot<PosConfig>("pos_config", (allConfigs) => {
      const stored = allConfigs.find(c => c.id === orgId);
      if (stored) {
        setConfigState({ ...defaultPosConfig, ...stored });
      } else {
        storage.saveItem("pos_config", { ...defaultPosConfig, id: orgId });
      }
    });

    const unsubProducts = storage.onSnapshot<Product>("pos_products", (all) => {
      setProducts(all.filter(p => p.orgId === orgId).sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(prev => ({ ...prev, products: false }));
    });

    const unsubTables = storage.onSnapshot<PosTable>("pos_tables", (all) => {
      setTables(all.filter(t => t.orgId === orgId).sort((a, b) => a.number.localeCompare(b.number)));
      setLoading(prev => ({ ...prev, tables: false }));
    });

    const unsubSales = storage.onSnapshot<SaleTransaction>("pos_sales", (all) => {
      setSalesHistory(all.filter(s => s.orgId === orgId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50));
      setLoading(prev => ({ ...prev, history: false }));
    });

    const unsubTickets = storage.onSnapshot<PosTicket>("pos_active_tickets", (all) => {
      setActiveTickets(all.filter(t => t.orgId === orgId));
    });

    return () => { unsubConfig(); unsubProducts(); unsubTables(); unsubSales(); unsubTickets(); };
  }, [orgId]);

  useEffect(() => { setLoading(prev => ({ ...prev, customers: crmLoading })); }, [crmLoading]);

  const recalculate = useCallback((items: SaleItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discountAmount = items.reduce((sum, item) => {
        const itemTotal = item.unitPrice * item.quantity;
        return sum + (itemTotal * (item.discount || 0) / 100);
    }, 0);
    const taxRate = (config.defaultTaxRate || 0) / 100; 
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * taxRate;
    const grandTotal = taxableAmount + taxAmount;
    setCurrentSale(prev => ({
        ...prev, items, subtotal: Number(subtotal.toFixed(2)), discountAmount: Number(discountAmount.toFixed(2)),
        taxAmount: Number(taxAmount.toFixed(2)), grandTotal: Number(grandTotal.toFixed(2)),
    }));
  }, [config.defaultTaxRate]);

  const addProduct = async (data: any) => {
    if (!orgId || !user) throw new Error("Auth required");
    const id = Math.random().toString(36).substring(7);
    const now = new Date().toISOString();
    const newProduct = { ...data, id, orgId, createdAt: now, updatedAt: now, createdBy: { uid: user.uid, name: userData?.name || "Staff" } };
    storage.saveItem("pos_products", newProduct);
    return id;
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const current = products.find(p => p.id === id);
    if (!current) return;
    storage.saveItem("pos_products", { ...current, ...data, updatedAt: new Date().toISOString() });
  };

  const deleteProduct = async (id: string) => { storage.deleteItem("pos_products", id); };

  const uploadProductImage = async (productId: string, fileOrBase64: any) => {
    // Mock upload: return a dummy URL or if it's base64, just use it
    const url = typeof fileOrBase64 === 'string' ? fileOrBase64 : "https://via.placeholder.com/150";
    await updateProduct(productId, { imageUrl: url });
    return url;
  };

  const addItemToSale = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existingIdx = currentSale.items.findIndex(i => i.productId === productId);
    let newItems = [...currentSale.items];
    if (existingIdx > -1) {
      newItems[existingIdx].quantity += quantity;
      newItems[existingIdx].lineItemTotal = newItems[existingIdx].quantity * newItems[existingIdx].unitPrice;
    } else {
      newItems.push({ id: Math.random().toString(36).substr(2, 9), productId, name: product.name, quantity, unitPrice: product.discountedPrice || product.basePrice, discount: 0, lineItemTotal: (product.discountedPrice || product.basePrice) * quantity });
    }
    recalculate(newItems);
  };

  const removeItemFromSale = (itemId: string) => recalculate(currentSale.items.filter(i => i.id !== itemId));
  const updateItemQuantity = (itemId: string, quantity: number) => { if (quantity <= 0) return removeItemFromSale(itemId); recalculate(currentSale.items.map(i => i.id === itemId ? { ...i, quantity, lineItemTotal: i.unitPrice * quantity } : i)); };
  const updateItemPrice = (itemId: string, unitPrice: number) => recalculate(currentSale.items.map(i => i.id === itemId ? { ...i, unitPrice, lineItemTotal: unitPrice * i.quantity } : i));
  const updateItemDiscount = (itemId: string, discount: number) => recalculate(currentSale.items.map(i => i.id === itemId ? { ...i, discount } : i));
  const applyDiscount = async (type: 'amount' | 'percentage', value: number) => {
    let disc = type === 'amount' ? value : (currentSale.subtotal * value) / 100;
    setCurrentSale(prev => ({ ...prev, discountAmount: Number(disc.toFixed(2)), grandTotal: Number((prev.subtotal - disc + prev.taxAmount).toFixed(2)) }));
  };

  const selectCustomer = (customerId: string | null) => setCurrentSale(p => ({ ...p, customerId }));
  const clearCurrentSale = () => setCurrentSale({ items: [], customerId: null, subtotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0, tableId: null });

  const completeSale = async (method: string, status: 'Paid' | 'Pending', paid: number, cashier?: string) => {
    if (!orgId || !user || currentSale.items.length === 0) return null;
    const now = new Date().toISOString();
    
    // Update stock
    currentSale.items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) storage.saveItem("pos_products", { ...p, stockQuantity: (p.stockQuantity || 0) - item.quantity });
    });

    const saleId = Math.random().toString(36).substr(2, 12).toUpperCase();
    const table = tables.find(t => t.id === currentSale.tableId);
    const saleData: SaleTransaction = {
      id: saleId, orgId, createdAt: now, ...currentSale, amountPaid: paid, changeAmount: Math.max(0, paid - currentSale.grandTotal),
      paymentMethod: method, paymentStatus: status, cashierName: cashier || userData?.name || 'Staff',
      tableStartTime: table?.lastStatusChange || undefined,
      createdBy: { uid: user.uid, name: userData?.name || 'Staff' },
      history: [{ action: 'CREATED', userId: user.uid, userName: userData?.name || 'Staff', timestamp: now, metadata: { method, status, paid } }]
    };
    storage.saveItem("pos_sales", saleData);

    if (currentSale.tableId) {
      const tableData = tables.find(t => t.id === currentSale.tableId);
      if (tableData) {
        const newHistory = [...(tableData.history || []), { action: 'COMPLETED_SALE', userId: user.uid, userName: userData?.name || 'Staff', timestamp: now, metadata: { saleId } }];
        storage.saveItem("pos_tables", { ...tableData, status: 'free', currentTicketId: null, lastStatusChange: null, history: newHistory.slice(-20) });
        if (tableData.currentTicketId) storage.deleteItem("pos_active_tickets", tableData.currentTicketId);
      }
    }
    clearCurrentSale();
    return saleData;
  };

  const addTable = async (data: any) => {
    if (!orgId || !user) return;
    const now = new Date().toISOString();
    const id = Math.random().toString(36).substring(7);
    storage.saveItem("pos_tables", { ...data, id, orgId, status: 'free', currentTicketId: null, createdAt: now, createdBy: { uid: user.uid, name: userData?.name || 'Staff' }, history: [{ action: 'CREATED', userId: user.uid, userName: userData?.name || 'Staff', timestamp: now }] });
  };

  const updateTable = async (id: string, data: Partial<PosTable>) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;
    const now = new Date().toISOString();
    const updateData: any = { ...table, ...data };
    if (data.status) {
        if (data.status === 'free') updateData.lastStatusChange = null;
        else if (table.status === 'free') updateData.lastStatusChange = now;
    }
    updateData.history = [...(table.history || []), { action: 'UPDATED', userId: user?.uid, userName: userData?.name || 'Staff', timestamp: now, metadata: data }].slice(-20);
    storage.saveItem("pos_tables", updateData);
  };

  const deleteTable = async (id: string) => { storage.deleteItem("pos_tables", id); };

  const uploadTableImage = async (tableId: string, file: File) => {
    const url = "https://via.placeholder.com/150";
    await updateTable(tableId, { imageUrl: url });
    return url;
  };

  const getTTSForTable = (table: PosTable): string => {
    const isPak = orgId === 'pakistan';
    const statusText = {
      free: { en: 'is free', hi: 'khaali hai' },
      eating: { en: 'is currently seated', hi: 'par graahak baithe hain' },
      bill: { en: 'is ready for the bill', hi: 'bil ke liye taiyaar hai' }
    };
    if (isPak) return `Mez number ${table.number} ${statusText[table.status].hi}. Is par ${table.capacity} logon ke baithane ki kshamata hai.`;
    return `Table number ${table.number} ${statusText[table.status].en}. It has a capacity of ${table.capacity} guests.`;
  };

  const selectTable = (tableId: string | null) => {
    setCurrentSale(p => ({ ...p, tableId }));
    if (!tableId) clearCurrentSale();
  };

  const saveTicket = async () => {
    if (!orgId || !user || !currentSale.tableId || currentSale.items.length === 0) return;
    const now = new Date().toISOString();
    const table = tables.find(t => t.id === currentSale.tableId);
    const ticketId = table?.currentTicketId || Math.random().toString(36).substr(2, 9);
    const existing = storage.getItem<PosTicket>("pos_active_tickets", ticketId);

    const ticketData: PosTicket = {
      id: ticketId,
      orgId,
      tableId: currentSale.tableId,
      items: currentSale.items,
      status: 'active',
      updatedAt: now,
      createdAt: existing?.createdAt || now,
      customerId: currentSale.customerId || existing?.customerId || null,
      createdBy: existing?.createdBy || { uid: user.uid, name: userData?.name || 'Staff' },
      history: [...(existing?.history || []), { action: 'SAVED_ORDER', userId: user.uid, userName: userData?.name || 'Staff', timestamp: now }].slice(-20),
    };
    storage.saveItem("pos_active_tickets", ticketData);
    await updateTable(currentSale.tableId, { status: 'eating', currentTicketId: ticketId });
    clearCurrentSale();
  };

  const loadTicket = async (ticketId: string) => {
    const ticket = storage.getItem<PosTicket>("pos_active_tickets", ticketId);
    if (ticket) {
        setCurrentSale(p => ({ ...p, items: ticket.items, tableId: ticket.tableId, customerId: ticket.customerId ?? null }));
        recalculate(ticket.items);
    }
  };
  
  const linkCustomerToTicket = async (ticketId: string, customerId: string) => {
    const ticket = storage.getItem<PosTicket>("pos_active_tickets", ticketId);
    if (ticket) storage.saveItem("pos_active_tickets", { ...ticket, customerId });
  };

  const addCustomer = async (data: any) => { return await addCrmEntity('lead', { name: data.name, mobile: data.phoneNumber, email: data.email, source: 'POS System', status: 'new' }); };

  const updateProductStock = async (productId: string, quantity: number) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return false;
    storage.saveItem("pos_products", { ...p, stockQuantity: (p.stockQuantity || 0) + quantity });
    return true;
  };

  const setConfig = async (data: Partial<PosConfig>) => { 
    const current = storage.getItem<PosConfig>("pos_config", orgId) || defaultPosConfig;
    storage.saveItem("pos_config", { ...current, ...data, id: orgId, updatedAt: new Date().toISOString() });
  };

  const getEntityForInvoice = async (id: string): Promise<any> => {
    const sale = storage.getItem<SaleTransaction>("pos_sales", id);
    if (sale) return { data: sale, type: 'sale' };
    const ticket = storage.getItem<PosTicket>("pos_active_tickets", id);
    if (ticket) return { data: ticket, type: 'ticket' };
    return { data: null, type: 'notFound' };
  };

  const value = useMemo(() => ({
    products, customers: crmLeads, salesHistory, tables, activeTickets, config, currentSale, loading, 
    addProduct, updateProduct, deleteProduct, uploadProductImage, 
    addCustomer, linkCustomerToTicket, 
    addItemToSale, removeItemFromSale, updateItemQuantity, updateItemPrice, updateItemDiscount, applyDiscount, 
    selectCustomer, clearCurrentSale, completeSale, 
    addTable, updateTable, deleteTable, uploadTableImage, getTTSForTable,
    selectTable, saveTicket, loadTicket, 
    setConfig, updateProductStock, getEntityForInvoice,
  }), [products, crmLeads, salesHistory, tables, activeTickets, config, currentSale, loading, orgId, recalculate, getEntityForInvoice, updateProductStock]);

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
}
