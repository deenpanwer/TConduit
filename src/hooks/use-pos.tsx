"use client";

/**
 * @file use-pos.tsx
 * @description Master POS state management using Firebase Firestore.
 */

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc,
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, uploadString } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
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
}

export interface PosTable {
  id: string;
  number: string;
  floor: string;
  capacity: number;
  status: 'free' | 'eating' | 'bill';
  currentTicketId: string | null;
  lastStatusChange?: string | null; 
  createdAt: string;
  createdBy: { uid: string; name: string; };
  history: HistoryEntry[];
}

export interface PosTicket {
  id: string;
  tableId: string | null;
  items: SaleItem[];
  status: 'active' | 'billed' | 'paid';
  createdAt: string;
  updatedAt: string;
  createdBy: { uid: string; name: string; };
  history: HistoryEntry[];
}

export interface PosConfig {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  defaultTaxRate: number;
  isRestaurantMode: boolean; 
  floors: string[]; 
  updatedAt?: string;
  updatedBy?: { uid: string; name: string; };
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
  addItemToSale: (productId: string, quantity: number) => void;
  removeItemFromSale: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemPrice: (itemId: string, newPrice: number) => void;
  updateItemDiscount: (itemId: string, newDiscount: number) => void;
  applyDiscount: (discountType: 'amount' | 'percentage', value: number) => Promise<void>;
  selectCustomer: (id: string | null) => void;
  clearCurrentSale: () => void;
  completeSale: (method: string, status: 'Paid' | 'Pending', paid: number, cashier?: string) => Promise<SaleTransaction | null>;
  addTable: (data: Omit<PosTable, 'id' | 'status' | 'currentTicketId' | 'createdAt' | 'createdBy' | 'history'>) => Promise<void>;
  updateTable: (id: string, data: Partial<PosTable>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  selectTable: (id: string | null) => void;
  saveTicket: () => Promise<void>; 
  loadTicket: (ticketId: string) => Promise<void>;
  setConfig: (data: Partial<PosConfig>) => Promise<void>;
}

const defaultPosConfig: PosConfig = {
  storeName: 'TRAC POS',
  storeAddress: '',
  storePhone: '',
  defaultTaxRate: 0,
  isRestaurantMode: false,
  floors: ['Main Floor'],
};

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: ReactNode }) {
  const { userData, user } = useAuth();
  const { leads: crmLeads, addEntity: addCrmEntity, loading: crmLoading } = useCRM();
  const orgId = userData?.ownedOrgId || userData?.orgId;

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

  // --- Real-time Sync ---

  useEffect(() => {
    if (!orgId) return;
    const configRef = doc(db, 'organizations', orgId, 'pos_config', 'default');
    const unsubConfig = onSnapshot(configRef, (snap) => {
      if (snap.exists()) setConfigState(snap.data() as PosConfig);
      else setDoc(configRef, defaultPosConfig);
    });

    const productsRef = collection(db, 'organizations', orgId, 'pos_products');
    const unsubProducts = onSnapshot(query(productsRef, orderBy('name')), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setLoading(prev => ({ ...prev, products: false }));
    });

    const tablesRef = collection(db, 'organizations', orgId, 'pos_tables');
    const unsubTables = onSnapshot(query(tablesRef, orderBy('number')), (snap) => {
      setTables(snap.docs.map(d => ({ id: d.id, ...d.data() } as PosTable)));
      setLoading(prev => ({ ...prev, tables: false }));
    });

    const salesRef = collection(db, 'organizations', orgId, 'pos_sales');
    const unsubSales = onSnapshot(query(salesRef, orderBy('createdAt', 'desc'), limit(50)), (snap) => {
      setSalesHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as SaleTransaction)));
      setLoading(prev => ({ ...prev, history: false }));
    });

    const ticketsRef = collection(db, 'organizations', orgId, 'pos_active_tickets');
    const unsubTickets = onSnapshot(ticketsRef, (snap) => {
      setActiveTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as PosTicket)));
    });

    return () => {
      unsubConfig(); unsubProducts(); unsubTables(); unsubSales(); unsubTickets();
    };
  }, [orgId]);

  useEffect(() => { setLoading(prev => ({ ...prev, customers: crmLoading })); }, [crmLoading]);

  // --- Calculations ---

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

  // --- Inventory ---

  const addProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => {
    if (!orgId || !user) throw new Error("Auth required");
    const now = new Date().toISOString();
    const productRef = doc(collection(db, 'organizations', orgId, 'pos_products'));
    await setDoc(productRef, { ...data, id: productRef.id, createdAt: now, updatedAt: now, createdBy: { uid: user.uid, name: userData?.name || user.displayName || 'Staff' } });
    return productRef.id;
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    if (!orgId || !user) return;
    await updateDoc(doc(db, 'organizations', orgId, 'pos_products', id), { ...data, updatedAt: new Date().toISOString(), updatedBy: { uid: user.uid, name: userData?.name || user.displayName || 'Staff' } });
  };

  const deleteProduct = async (id: string) => { if (orgId) await deleteDoc(doc(db, 'organizations', orgId, 'pos_products', id)); };

  const uploadProductImage = async (productId: string, fileOrBase64: File | string, onProgress?: (p: number) => void) => {
    if (!orgId) throw new Error("Org required");
    const storagePath = `organizations/${orgId}/pos/products/${productId}/image`;
    const storageRef = ref(storage, storagePath);
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
      await uploadString(storageRef, fileOrBase64, 'data_url');
      const url = await getDownloadURL(storageRef);
      await updateProduct(productId, { imageUrl: url });
      return url;
    } else if (fileOrBase64 instanceof File) {
      const uploadTask = uploadBytesResumable(storageRef, fileOrBase64);
      return new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed', (snapshot) => { if (onProgress) onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100); }, 
          (error) => reject(error), 
          async () => { const url = await getDownloadURL(uploadTask.snapshot.ref); await updateProduct(productId, { imageUrl: url }); resolve(url); }
        );
      });
    }
    throw new Error("Invalid format");
  };

  // --- Sale ---

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
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    currentSale.items.forEach(item => batch.update(doc(db, 'organizations', orgId, 'pos_products', item.productId), { stockQuantity: increment(-item.quantity) }));
    const saleId = Math.random().toString(36).substr(2, 12).toUpperCase();
    const table = tables.find(t => t.id === currentSale.tableId);
    const saleData: SaleTransaction = {
      id: saleId, createdAt: now, ...currentSale, amountPaid: paid, changeAmount: Math.max(0, paid - currentSale.grandTotal),
      paymentMethod: method, paymentStatus: status, cashierName: cashier || userData?.name || 'Staff',
      tableStartTime: table?.lastStatusChange || undefined,
      createdBy: { uid: user.uid, name: userData?.name || user.displayName || 'Staff' },
      history: [{ action: 'CREATED', userId: user.uid, userName: userData?.name || user.displayName || 'Staff', timestamp: now, metadata: { method, status, paid } }]
    };
    batch.set(doc(db, 'organizations', orgId, 'pos_sales', saleId), saleData);
    if (currentSale.tableId) {
      const tableData = tables.find(t => t.id === currentSale.tableId);
      const newHistory = [...(tableData?.history || []), { action: 'COMPLETED_SALE', userId: user.uid, userName: userData?.name || user.displayName || 'Staff', timestamp: now, metadata: { saleId } }];
      batch.update(doc(db, 'organizations', orgId, 'pos_tables', currentSale.tableId), { status: 'free', currentTicketId: null, lastStatusChange: null, history: newHistory.slice(-20) });
      if (tableData?.currentTicketId) batch.delete(doc(db, 'organizations', orgId, 'pos_active_tickets', tableData.currentTicketId));
    }
    await batch.commit();
    clearCurrentSale();
    return saleData;
  };

  // --- Restaurant ---

  const addTable = async (data: Omit<PosTable, 'id' | 'status' | 'currentTicketId' | 'createdAt' | 'createdBy' | 'history'>) => {
    if (!orgId || !user) return;
    const now = new Date().toISOString();
    await addDoc(collection(db, 'organizations', orgId, 'pos_tables'), { ...data, status: 'free', currentTicketId: null, createdAt: now, createdBy: { uid: user.uid, name: userData?.name || user.displayName || 'Staff' }, history: [{ action: 'CREATED', userId: user.uid, userName: userData?.name || user.displayName || 'Staff', timestamp: now }] });
  };

  const updateTable = async (id: string, data: Partial<PosTable>) => {
    if (!orgId || !user) return;
    const now = new Date().toISOString();
    const table = tables.find(t => t.id === id);
    const updateData: any = { ...data };
    if (data.status) {
        if (data.status === 'free') updateData.lastStatusChange = null;
        else if (table?.status === 'free') updateData.lastStatusChange = now;
    }
    const newHistory = [...(table?.history || []), { action: 'UPDATED', userId: user.uid, userName: userData?.name || user.displayName || 'Staff', timestamp: now, metadata: data }];
    updateData.history = newHistory.slice(-20);
    await updateDoc(doc(db, 'organizations', orgId, 'pos_tables', id), updateData);
  };

  const deleteTable = async (id: string) => { if (orgId) await deleteDoc(doc(db, 'organizations', orgId, 'pos_tables', id)); };
  const selectTable = (tableId: string | null) => {
    setCurrentSale(p => ({ ...p, tableId }));
    if (!tableId) clearCurrentSale();
  };

  const saveTicket = async () => {
    if (!orgId || !user || !currentSale.tableId || currentSale.items.length === 0) return;
    const now = new Date().toISOString();
    const table = tables.find(t => t.id === currentSale.tableId);
    const ticketId = table?.currentTicketId || Math.random().toString(36).substr(2, 9);
    const ticketRef = doc(db, 'organizations', orgId, 'pos_active_tickets', ticketId);
    const existingTicket = await getDoc(ticketRef);
    let history = existingTicket.exists() ? [...(existingTicket.data().history || [])] : [{ action: 'CREATED', userId: user.uid, userName: userData?.name || user.displayName || 'Staff', timestamp: now }];
    history.push({ action: 'SAVED_ORDER', userId: user.uid, userName: userData?.name || user.displayName || 'Staff', timestamp: now, metadata: { itemCount: currentSale.items.length } });
    await setDoc(ticketRef, { id: ticketId, tableId: currentSale.tableId, items: currentSale.items, status: 'active', updatedAt: now, createdBy: existingTicket.exists() ? existingTicket.data().createdBy : { uid: user.uid, name: userData?.name || user.displayName || 'Staff' }, history: history.slice(-20) });
    await updateTable(currentSale.tableId, { status: 'eating', currentTicketId: ticketId });
    clearCurrentSale();
  };

  const loadTicket = async (ticketId: string) => {
    if (!orgId || !user) return;
    const snap = await getDoc(doc(db, 'organizations', orgId, 'pos_active_tickets', ticketId));
    if (snap.exists()) {
        const ticket = snap.data() as PosTicket;
        setCurrentSale(p => ({ ...p, items: ticket.items, tableId: ticket.tableId }));
        recalculate(ticket.items);
    }
  };

  const addCustomer = async (data: { name: string; phoneNumber?: string; email?: string }) => { return await addCrmEntity('lead', { name: data.name, mobile: data.phoneNumber, email: data.email, source: 'POS System', status: 'new' }); };

  const setConfig = async (data: Partial<PosConfig>) => { if (orgId && user) await updateDoc(doc(db, 'organizations', orgId, 'pos_config', 'default'), { ...data, updatedAt: new Date().toISOString(), updatedBy: { uid: user.uid, name: userData?.name || user.displayName || 'Staff' } }); };

  const value = useMemo(() => ({
    products, customers: crmLeads, salesHistory, tables, activeTickets, config, currentSale, loading, addProduct, updateProduct, deleteProduct, uploadProductImage, addCustomer, addItemToSale, removeItemFromSale, updateItemQuantity, updateItemPrice, updateItemDiscount, applyDiscount, selectCustomer, clearCurrentSale, completeSale, addTable, updateTable, deleteTable, selectTable, saveTicket, loadTicket, setConfig,
  }), [products, crmLeads, salesHistory, tables, activeTickets, config, currentSale, loading]);

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
}
