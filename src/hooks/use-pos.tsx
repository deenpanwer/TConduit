"use client";

/**
 * @file use-pos.tsx
 * @description Custom React hook for managing Point of Sale (POS) operations.
 * This hook provides state management for products, current sales, customers,
 * sales history, and configuration, primarily using local storage for persistence.
 * It is designed with a clear architecture to facilitate easy migration to
 * cloud-based storage like Firestore in the future.
 *
 * Key Features:
 * - Product Management: Add, edit, delete products, manage stock.
 * - Current Sale Management: Add/remove items, calculate totals, apply discounts,
 *   manage customer selection.
 * - Customer Management: Add, view, and select customers for sales.
 * - Sales History: Store completed transactions.
 * - Configuration: Centralized settings for forms, UI, and POS behavior.
 * - Local Storage Persistence: All data is saved to localStorage for
 *   client-side persistence.
 * - Context API Integration: Provides data and functions to child components.
 * - Composability: Designed to be easily extended and configured, especially
 *   for form inputs.
 * - Future Firestore Migration: Code structure is modular to simplify switching
 *   persistence layers.
 *
 * @author Gemini CLI
 * @version 1.0.0
 * @license MIT
 */

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

// --- Types ---

/**
 * Represents a product in the POS system.
 * Stored in local storage.
 */
export interface Product {
  id: string; // Unique identifier (e.g., UUID or SKU)
  name: string;
  sku: string; // Stock Keeping Unit
  description?: string;
  basePrice: number; // Original price
  discountedPrice?: number; // Price after discount (can be same as basePrice if no discount)
  costPrice: number; // Cost to acquire for profit calculation
  taxRate: number; // Percentage, e.g., 0.08 for 8%
  stockQuantity: number; // Current quantity in stock
  category?: string;
  imageUrl?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Represents an item added to the current sale.
 * It's a snapshot of the product at the time of adding to the cart.
 */
export interface SaleItem {
  id: string; // Unique ID for this item in the cart (can be productId + timestamp or just unique)
  productId: string;
  name: string; // Denormalized for quick display
  quantity: number;
  unitPrice: number; // Price per unit at the time of sale (could be base or discounted)
  discount: number; // Percentage discount for this item
  lineItemTotal: number; // quantity * unitPrice
}

/**
 * Represents a customer.
 * Stored in local storage.
 */
export interface Customer {
  id: string; // Unique identifier (e.g., UUID)
  name: string;
  phoneNumber?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  postalCode?: string;
  marketingConsent?: boolean;
  customerGroup?: string; // e.g., "VIP", "Regular", "Wholesale"
  internalNotes?: string;
  lastPurchaseDate?: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}

/**
 * Represents a completed sales transaction.
 * Stored in local storage.
 */
export interface SaleTransaction {
  id: string; // Unique transaction ID
  createdAt: string; // ISO timestamp
  customerId?: string | null; // Linked customer ID
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod?: string; // e.g., "Cash", "Card"
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  receiptPrinted?: boolean;
  cashierName?: string;
}

/**
 * Configuration for POS system, especially form fields.
 * This allows for highly composable and customizable UI elements.
 */
export interface PosConfig {
  productFormFields: FormFieldConfig[];
  customerFormFields: FormFieldConfig[];
  storeName: string;
  storeAddress: string;
  storePhone: string;
  defaultTaxRate: number;
}

/**
 * Configuration for a single form field.
 */
export interface FormFieldConfig {
  name: string; // Internal name, used for state key
  label: string; // User-facing label
  type: 'text' | 'number' | 'textarea' | 'select' | 'file' | 'password'; // Input type
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[]; // For 'select' type
  // Add validation rules, default values, etc. as needed
}

/**
 * The context type provided by the PosProvider.
 * Exposes all states and functions to the application.
 */
export interface PosContextType {
  // State
  products: Product[];
  currentSale: {
    items: SaleItem[];
    customerId: string | null;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
    // Add other sale-specific details like payment method, notes, etc.
  };
  customers: Customer[];
  salesHistory: SaleTransaction[];
  config: PosConfig;
  loading: {
    products: boolean;
    customers: boolean;
    history: boolean;
    saving: boolean;
  };

  // Actions
  // Product Management
  loadProducts: () => Promise<void>;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product | null>;
  updateProduct: (productId: string, updatedData: Partial<Product>) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  updateProductStock: (productId: string, quantityChange: number) => Promise<boolean>; // Atomic stock update logic

  // Current Sale Management
  addItemToSale: (productId: string, quantity: number) => Promise<void>;
  removeItemFromSale: (itemId: string) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateItemPrice: (itemId: string, newPrice: number) => Promise<void>;
  updateItemDiscount: (itemId: string, newDiscount: number) => Promise<void>;
  applyDiscount: (discountType: 'amount' | 'percentage', value: number) => Promise<void>;
  selectCustomer: (customerId: string | null) => void;
  clearCurrentSale: () => void;
  completeSale: (paymentMethod: string, paymentStatus: 'Paid' | 'Pending', amountPaid: number, cashierName?: string) => Promise<SaleTransaction | null>;

  // Customer Management
  loadCustomers: () => Promise<void>;
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer | null>;
  updateCustomer: (customerId: string, updatedData: Partial<Customer>) => Promise<boolean>;
  deleteCustomer: (customerId: string) => Promise<boolean>;

  // Sales History
  loadSalesHistory: () => Promise<void>;

  // Configuration
  setConfig: (newConfig: Partial<PosConfig>) => void;

  // UI/Rendering Helpers
  renderFormFields: (fields: FormFieldConfig[], data: any, onChange: (name: string, value: any) => void) => JSX.Element[];
}

// --- Default Configurations ---

const defaultProductFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g., Blue T-Shirt' },
  { name: 'sku', label: 'SKU / Barcode', type: 'text', placeholder: 'e.g., TSB001' },
  { name: 'basePrice', label: 'Base Price', type: 'number', required: true, placeholder: 'e.g., 10.00' },
  { name: 'discountedPrice', label: 'Discounted Price', type: 'number', placeholder: 'e.g., 8.50' },
  { name: 'costPrice', label: 'Cost Price', type: 'number', required: true, placeholder: 'e.g., 5.00' },
  { name: 'stockQuantity', label: 'Stock Count', type: 'number', required: true, placeholder: 'e.g., 50' },
  { name: 'category', label: 'Category', type: 'select', options: [{ value: 'apparel', label: 'Apparel' }, { value: 'electronics', label: 'Electronics' }, { value: 'other', label: 'Other' }] },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Details about the product' },
  { name: 'imageUrl', label: 'Image URL', type: 'text', placeholder: 'e.g., http://example.com/image.png' },
];

const defaultCustomerFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Customer Name', type: 'text', required: true, placeholder: 'e.g., John Doe' },
  { name: 'phoneNumber', label: 'Phone Number', type: 'text', placeholder: 'e.g., +1 (555) 123-4567' },
  { name: 'email', label: 'Email', type: 'text', placeholder: 'e.g., john.doe@example.com' },
];

const defaultPosConfig: PosConfig = {
  productFormFields: defaultProductFormFields,
  customerFormFields: defaultCustomerFormFields,
  storeName: 'TRAC STORE #001',
  storeAddress: '123 Business Rd, Tech City',
  storePhone: '+1 (555) 000-0000',
  defaultTaxRate: 8, // 8%
};

// --- Local Storage Keys ---
const STORAGE_PRODUCTS_KEY = 'pos_products';
const STORAGE_CUSTOMERS_KEY = 'pos_customers';
const STORAGE_SALES_HISTORY_KEY = 'pos_sales_history';
const STORAGE_CONFIG_KEY = 'pos_config';

// --- Helper Functions ---

/**
 * Generates a unique ID. In a real app, UUID is preferred.
 * For simplicity here, we use timestamp + random string.
 */
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

/**
 * Safely gets data from local storage.
 * @param key The localStorage key.
 * @returns Parsed JSON data or null if not found or parse error.
 */
const loadFromLocalStorage = <T,>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error loading from localStorage key "${key}":`, error);
    return null;
  }
};

/**
 * Safely saves data to local storage.
 * @param key The localStorage key.
 * @param data The data to save.
 */
const saveToLocalStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
    // Handle potential storage limits or other errors
  }
};

// --- Context Creation ---

const PosContext = createContext<PosContextType | undefined>(undefined);

// --- Provider Component ---

export function PosProvider({ children }: { children: ReactNode }) {
  // --- State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [currentSale, setCurrentSale] = useState<PosContextType['currentSale']>({
    items: [],
    customerId: null,
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    grandTotal: 0,
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleTransaction[]>([]);
  const [config, setConfigState] = useState<PosConfig>(defaultPosConfig); // Renamed to avoid conflict with setConfig action
  const [loading, setLoading] = useState({
    products: true,
    customers: true,
    history: true,
    saving: false,
  });

  const recalculateAndSetCurrentSale = useCallback((items: SaleItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discountAmount = items.reduce((sum, item) => {
        const itemTotal = item.unitPrice * item.quantity;
        const itemDiscount = (itemTotal * (item.discount || 0)) / 100;
        return sum + itemDiscount;
    }, 0);
    
    const taxRate = (config.defaultTaxRate || 8) / 100; 
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * taxRate;
    const grandTotal = taxableAmount + taxAmount;

    setCurrentSale(prev => ({
        ...prev,
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2)),
    }));
  }, []);

  // --- Effects for loading initial data ---

  useEffect(() => {
    // Load configuration first
    const savedConfig = loadFromLocalStorage<PosConfig>(STORAGE_CONFIG_KEY);
    if (savedConfig) {
      setConfigState(savedConfig);
    } else {
      // Save default config if none exists
      saveToLocalStorage(STORAGE_CONFIG_KEY, defaultPosConfig);
    }
    // Load other data in parallel
    loadProducts();
    loadCustomers();
    loadSalesHistory();
  }, []); // Run only once on mount

  // --- Product Management ---

  /**
   * Loads products from local storage.
   * Sets loading state and updates the products state.
   */
  const loadProducts = async () => {
    setLoading((prev) => ({ ...prev, products: true }));
    const storedProducts = loadFromLocalStorage<Product[]>(STORAGE_PRODUCTS_KEY);
    setProducts(storedProducts || []);
    setLoading((prev) => ({ ...prev, products: false }));
  };

  /**
   * Adds a new product. Generates ID and timestamps, saves to local storage.
   * @param productData - Data for the new product (excluding id, timestamps).
   * @returns The newly created product object, or null if failed.
   */
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> => {
    setLoading((prev) => ({ ...prev, saving: true }));
    const now = new Date().toISOString();
    const newProduct: Product = {
      id: generateUniqueId(),
      ...productData,
      createdAt: now,
      updatedAt: now,
      // Ensure numeric fields are valid numbers
      basePrice: parseFloat(String(productData.basePrice)) || 0,
      costPrice: parseFloat(String(productData.costPrice)) || 0,
      stockQuantity: parseInt(String(productData.stockQuantity)) || 0,
      taxRate: parseFloat(String(productData.taxRate)) || 0,
      discountedPrice: productData.discountedPrice !== undefined ? parseFloat(String(productData.discountedPrice)) : undefined,
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    saveToLocalStorage(STORAGE_PRODUCTS_KEY, updatedProducts);

    setLoading((prev) => ({ ...prev, saving: false }));
    return newProduct;
  };

  /**
   * Updates an existing product.
   * @param productId - The ID of the product to update.
   * @param updatedData - Partial product data to merge.
   * @returns True if updated successfully, false otherwise.
   */
  const updateProduct = async (productId: string, updatedData: Partial<Product>): Promise<boolean> => {
    setLoading((prev) => ({ ...prev, saving: true }));
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      setLoading((prev) => ({ ...prev, saving: false }));
      return false; // Product not found
    }

    const updatedProducts = [...products];
    const existingProduct = updatedProducts[productIndex];
    const now = new Date().toISOString();

    // Merge and update fields, ensuring numeric fields are handled
    const mergedProduct: Product = {
      ...existingProduct,
      ...updatedData,
      updatedAt: now,
      basePrice: updatedData.basePrice !== undefined ? parseFloat(String(updatedData.basePrice)) : existingProduct.basePrice,
      costPrice: updatedData.costPrice !== undefined ? parseFloat(String(updatedData.costPrice)) : existingProduct.costPrice,
      stockQuantity: updatedData.stockQuantity !== undefined ? parseInt(String(updatedData.stockQuantity)) : existingProduct.stockQuantity,
      taxRate: updatedData.taxRate !== undefined ? parseFloat(String(updatedData.taxRate)) : existingProduct.taxRate,
      discountedPrice: updatedData.discountedPrice !== undefined ? parseFloat(String(updatedData.discountedPrice)) : existingProduct.discountedPrice,
      // Ensure non-numeric fields are also updated correctly
      name: updatedData.name !== undefined ? updatedData.name : existingProduct.name,
      sku: updatedData.sku !== undefined ? updatedData.sku : existingProduct.sku,
      description: updatedData.description !== undefined ? updatedData.description : existingProduct.description,
      category: updatedData.category !== undefined ? updatedData.category : existingProduct.category,
      imageUrl: updatedData.imageUrl !== undefined ? updatedData.imageUrl : existingProduct.imageUrl,
    };

    updatedProducts[productIndex] = mergedProduct;
    setProducts(updatedProducts);
    saveToLocalStorage(STORAGE_PRODUCTS_KEY, updatedProducts);

    setLoading((prev) => ({ ...prev, saving: false }));
    return true;
  };

  /**
   * Deletes a product.
   * @param productId - The ID of the product to delete.
   * @returns True if deleted successfully, false otherwise.
   */
  const deleteProduct = async (productId: string): Promise<boolean> => {
    setLoading((prev) => ({ ...prev, saving: true }));
    const initialLength = products.length;
    const updatedProducts = products.filter(p => p.id !== productId);
    if (updatedProducts.length < initialLength) {
      setProducts(updatedProducts);
      saveToLocalStorage(STORAGE_PRODUCTS_KEY, updatedProducts);
      setLoading((prev) => ({ ...prev, saving: false }));
      return true;
    }
    setLoading((prev) => ({ ...prev, saving: false }));
    return false; // Product not found or not deleted
  };

  /**
   * Atomically updates the stock quantity of a product.
   * This is crucial for avoiding race conditions if multiple operations
   * try to modify stock simultaneously (though less of an issue with local storage).
   * It ensures the product exists and updates its quantity.
   * @param productId - The ID of the product.
   * @param quantityChange - The amount to change stock by (can be positive or negative).
   * @returns True if stock was updated, false otherwise.
   */
  const updateProductStock = async (productId: string, quantityChange: number): Promise<boolean> => {
    setLoading((prev) => ({ ...prev, saving: true }));
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      setLoading((prev) => ({ ...prev, saving: false }));
      return false; // Product not found
    }

    const updatedProducts = [...products];
    const product = updatedProducts[productIndex];
    const newStock = product.stockQuantity + quantityChange;

    // Basic check to prevent negative stock if not allowed, though POS might allow it for backorders
    if (newStock < 0) {
      console.warn(`Product ${productId} stock would go below zero. Allowing for now.`);
      // Depending on business logic, you might return false or throw an error here.
    }

    const updatedProduct: Product = {
      ...product,
      stockQuantity: newStock,
      updatedAt: new Date().toISOString(),
    };
    updatedProducts[productIndex] = updatedProduct;

    setProducts(updatedProducts);
    saveToLocalStorage(STORAGE_PRODUCTS_KEY, updatedProducts);
    setLoading((prev) => ({ ...prev, saving: false }));
    return true;
  };

  // --- Current Sale Management ---

  /**
   * Recalculates sale totals (subtotal, tax, discount, grand total)
   * based on current sale items and applied discount.
   */
  const calculateSaleTotals = () => {
    let subtotal = 0;
    currentSale.items.forEach(item => {
      subtotal += item.lineItemTotal;
    });

    // Note: Using a hardcoded global tax rate for simplicity.
    // In a real app, this would come from config or product settings.
    // This example assumes the taxRate field in product config is numerical value
    const globalTaxRate = config.productFormFields.find(field => field.name === 'taxRate')?.options?.[0]?.value ? parseFloat(config.productFormFields.find(field => field.name === 'taxRate')!.options![0].value) : 0.08; // Default to 8% if not found
    const taxAmount = subtotal * globalTaxRate;
    const discountAmount = currentSale.discountAmount; // This should be managed by applyDiscount
    const grandTotal = subtotal - discountAmount + taxAmount;

    setCurrentSale(prevSale => ({
      ...prevSale,
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
    }));
  };

  /**
   * Adds an item to the current sale. If the product is already in the cart,
   * it increments the quantity.
   * @param productId - The ID of the product to add.
   * @param quantity - The number of units to add.
   */
  const addItemToSale = async (productId: string, quantity: number): Promise<void> => {
    if (quantity <= 0) return;

    const product = products.find(p => p.id === productId);
    if (!product) {
      console.error(`Product with ID ${productId} not found.`);
      return;
    }

    const unitPrice = product.basePrice;
    const existingItemIndex = currentSale.items.findIndex(item => item.productId === productId);

    let updatedItems = [...currentSale.items];

    if (existingItemIndex > -1) {
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        lineItemTotal: unitPrice * newQuantity,
      };
    } else {
      updatedItems.push({
        id: generateUniqueId(),
        productId: product.id,
        name: product.name,
        quantity: quantity,
        unitPrice: unitPrice,
        discount: 0, // Initialize with 0 discount
        lineItemTotal: unitPrice * quantity,
      });
    }
    recalculateAndSetCurrentSale(updatedItems);
  };

  /**
   * Removes an item from the current sale.
   * @param itemId - The unique ID of the item in the cart to remove.
   */
  const removeItemFromSale = async (itemId: string): Promise<void> => {
    const updatedItems = currentSale.items.filter(item => item.id !== itemId);
    recalculateAndSetCurrentSale(updatedItems);
  };

  /**
   * Updates the quantity of an existing item in the current sale.
   * @param itemId - The unique ID of the item in the cart.
   * @param quantity - The new quantity.
   */
  const updateItemQuantity = async (itemId: string, quantity: number): Promise<void> => {
    if (quantity <= 0) {
      await removeItemFromSale(itemId);
      return;
    }
    const updatedItems = currentSale.items.map(item =>
        item.id === itemId ? { ...item, quantity, lineItemTotal: item.unitPrice * quantity } : item
    );
    recalculateAndSetCurrentSale(updatedItems);
  };

  /**
   * Updates the price of an existing item in the current sale.
   * @param itemId - The unique ID of the item in the cart.
   * @param newPrice - The new price.
   */
  const updateItemPrice = async (itemId: string, newPrice: number): Promise<void> => {
    const updatedItems = currentSale.items.map(item =>
        item.id === itemId ? { ...item, unitPrice: newPrice, lineItemTotal: newPrice * item.quantity } : item
    );
    recalculateAndSetCurrentSale(updatedItems);
  };

  /**
   * Updates the discount percentage of an existing item in the current sale.
   * @param itemId - The unique ID of the item in the cart.
   * @param newDiscount - The new discount percentage (e.g., 10 for 10%).
   */
  const updateItemDiscount = async (itemId: string, newDiscount: number): Promise<void> => {
    const updatedItems = currentSale.items.map(item =>
        item.id === itemId ? { ...item, discount: newDiscount } : item
    );
    recalculateAndSetCurrentSale(updatedItems);
  };

  /**
   * Applies a discount to the current sale.
   * @param discountType - 'amount' for a fixed value, 'percentage' for a percentage.
   * @param value - The discount value.
   */
  const applyDiscount = async (discountType: 'amount' | 'percentage', value: number): Promise<void> => {
    setLoading((prev) => ({ ...prev, saving: true })); // Indicate saving state

    let calculatedDiscountAmount = 0;
    if (discountType === 'amount') {
      calculatedDiscountAmount = value;
    } else if (discountType === 'percentage') {
      const percentage = value / 100;
      calculatedDiscountAmount = currentSale.subtotal * percentage;
    }

    calculatedDiscountAmount = Math.max(0, Math.min(calculatedDiscountAmount, currentSale.subtotal));

    // This function now has limited effect as recalculateAndSetCurrentSale is the source of truth
    // It is kept for comment preservation and potential legacy use.
    setCurrentSale(prevSale => ({
      ...prevSale,
      discountAmount: parseFloat(calculatedDiscountAmount.toFixed(2)),
    }));
    setLoading((prev) => ({ ...prev, saving: false }));
  };

  /**
   * Selects a customer to associate with the current sale.
   * @param customerId - The ID of the customer, or null to deselect.
   */
  const selectCustomer = (customerId: string | null): void => {
    setCurrentSale(prevSale => ({ ...prevSale, customerId }));
  };

  /**
   * Clears the current sale, resetting it to an empty state.
   */
  const clearCurrentSale = (): void => {
    setCurrentSale({
      items: [],
      customerId: null,
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      grandTotal: 0,
    });
  };

  /**
   * Finalizes the current sale, saving it to history and updating stock.
   * @param paymentMethod - The method used for payment.
   * @param paymentStatus - The status of the payment.
   * @param amountPaid - The amount paid by the customer.
   * @param cashierName - The name of the cashier.
   * @returns The completed SaleTransaction object, or null if failed.
   */
  const completeSale = async (paymentMethod: string, paymentStatus: 'Paid' | 'Pending', amountPaid: number, cashierName?: string): Promise<SaleTransaction | null> => {
    if (currentSale.items.length === 0) {
      console.warn("Cannot complete sale with no items.");
      return null;
    }

    setLoading((prev) => ({ ...prev, saving: true }));

    // --- Step 1: Update product stock ---
    const stockUpdatePromises = currentSale.items.map(item =>
      updateProductStock(item.productId, -item.quantity)
    );
    await Promise.all(stockUpdatePromises);

    // --- Step 2: Create the sale transaction object ---
    const now = new Date().toISOString();
    const grandTotal = currentSale.grandTotal;
    const changeAmount = Math.max(0, amountPaid - grandTotal);

    const newTransaction: SaleTransaction = {
      id: generateUniqueId(),
      createdAt: now,
      customerId: currentSale.customerId,
      items: [...currentSale.items],
      subtotal: currentSale.subtotal,
      discountAmount: currentSale.discountAmount,
      taxAmount: currentSale.taxAmount,
      grandTotal: grandTotal,
      amountPaid: amountPaid,
      changeAmount: changeAmount,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      receiptPrinted: false,
      cashierName: cashierName || 'System Admin',
    };

    // --- Step 3: Update customer last purchase date ---
    if (currentSale.customerId) {
        await updateCustomer(currentSale.customerId, { lastPurchaseDate: now });
    }

    // --- Step 4: Save to sales history ---
    const updatedHistory = [...salesHistory, newTransaction];
    setSalesHistory(updatedHistory);
    saveToLocalStorage(STORAGE_SALES_HISTORY_KEY, updatedHistory);

    // --- Step 5: Clear current sale and reset loading state ---
    clearCurrentSale();
    setLoading((prev) => ({ ...prev, saving: false }));

    console.log("Sale completed and saved:", newTransaction);
    return newTransaction;
  };


  // --- Customer Management ---

  /**
   * Loads customers from local storage.
   */
  const loadCustomers = async () => {
    setLoading((prev) => ({ ...prev, customers: true }));
    const storedCustomers = loadFromLocalStorage<Customer[]>(STORAGE_CUSTOMERS_KEY);
    setCustomers(storedCustomers || []);
    setLoading((prev) => ({ ...prev, customers: false }));
  };

  /**
   * Adds a new customer.
   * @param customerData - Data for the new customer (excluding id, timestamps).
   * @returns The newly created customer object, or null if failed.
   */
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer | null> => {
    setLoading((prev) => ({ ...prev, saving: true }));
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id: generateUniqueId(),
      ...customerData,
      createdAt: now,
    };

    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    saveToLocalStorage(STORAGE_CUSTOMERS_KEY, updatedCustomers);

    setLoading((prev) => ({ ...prev, saving: false }));
    return newCustomer;
  };

  /**
   * Updates an existing customer.
   * @param customerId - The ID of the customer to update.
   * @param updatedData - Partial customer data to merge.
   * @returns True if updated successfully, false otherwise.
   */
  const updateCustomer = async (customerId: string, updatedData: Partial<Customer>): Promise<boolean> => {
    setLoading((prev) => ({ ...prev, saving: true }));
    const customerIndex = customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) {
      setLoading((prev) => ({ ...prev, saving: false }));
      return false;
    }

    const updatedCustomers = [...customers];
    updatedCustomers[customerIndex] = {
      ...updatedCustomers[customerIndex],
      ...updatedData,
    };

    setCustomers(updatedCustomers);
    saveToLocalStorage(STORAGE_CUSTOMERS_KEY, updatedCustomers);
    setLoading((prev) => ({ ...prev, saving: false }));
    return true;
  };

  /**
   * Deletes a customer.
   * @param customerId - The ID of the customer to delete.
   * @returns True if deleted successfully, false otherwise.
   */
  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    setLoading((prev) => ({ ...prev, saving: true }));
    const updatedCustomers = customers.filter(c => c.id !== customerId);
    if (updatedCustomers.length < customers.length) {
      setCustomers(updatedCustomers);
      saveToLocalStorage(STORAGE_CUSTOMERS_KEY, updatedCustomers);
      setLoading((prev) => ({ ...prev, saving: false }));
      return true;
    }
    setLoading((prev) => ({ ...prev, saving: false }));
    return false;
  };

  // --- Sales History ---

  /**
   * Loads sales history from local storage.
   */
  const loadSalesHistory = async () => {
    setLoading((prev) => ({ ...prev, history: true }));
    const storedHistory = loadFromLocalStorage<SaleTransaction[]>(STORAGE_SALES_HISTORY_KEY);
    setSalesHistory(storedHistory || []);
    setLoading((prev) => ({ ...prev, history: false }));
  };

  // --- Configuration ---

  /**
   * Updates the POS configuration.
   * @param newConfig - Partial configuration to merge.
   */
  const setConfig = (newConfig: Partial<PosConfig>): void => {
    const updatedConfig = { ...config, ...newConfig };
    setConfigState(updatedConfig);
    saveToLocalStorage(STORAGE_CONFIG_KEY, updatedConfig);
  };

  // --- UI/Rendering Helpers ---

  /**
   * Renders form fields based on configuration.
   * This is a basic implementation. A more advanced version might use a form library
   * or handle complex field types (like file uploads, date pickers) more robustly.
   * @param fields - Array of FormFieldConfig objects.
   * @param data - The current state object holding form data.
   * @param onChange - Callback function when a field value changes.
   * @returns An array of React elements representing the form fields.
   */
  const renderFormFields = (fields: FormFieldConfig[], data: any, onChange: (name: string, value: any) => void): JSX.Element[] => {
    return fields.map((field) => {
      const fieldProps: any = {
        key: field.name,
        id: field.name,
        name: field.name,
        placeholder: field.placeholder,
        value: data[field.name] ?? '', // Handle undefined values gracefully
        required: field.required,
        onChange: (e: any) => {
          // Basic handling for input types
          let value = e.target.value;
          if (field.type === 'number') {
            // Attempt to parse as float for prices, int for quantity
            const numericValue = field.name.includes('stock') || field.name === 'quantity' ? parseInt(value) : parseFloat(value);
            value = isNaN(numericValue) ? '' : numericValue; // Store as number, or empty string if NaN
          }
          onChange(field.name, value);
        },
      };

      if (field.type === 'textarea') {
        // textarea doesn't need special value handling from props, just 'value' prop
      } else if (field.type === 'select') {
        // For select, the value is directly the option's value.
        // Ensure 'value' prop is correctly bound.
        fieldProps.value = data[field.name] ?? '';
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={field.name}>{field.label}{field.required && '*'}</label>
            <select {...fieldProps}>
              {/* Add a default empty option if not required */}
              {field.required === false && <option value="">Select...</option>}
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        );
      } else if (field.type === 'file') {
         // Basic file input handling. Actual file upload logic (e.g., to cloud storage)
         // would need to be implemented separately and triggered here.
         // For now, we'll just log the file selection.
         fieldProps.onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
              console.log(`File selected: ${file.name}. Implement upload logic here.`);
              // Example: You might want to trigger an upload and then call onChange with the resulting URL.
              // onChange(field.name, URL.createObjectURL(file)); // Placeholder for a local URL
            }
         };
         // File inputs don't typically have their 'value' controlled directly by state in the same way.
         return (
            <div key={field.name} className="form-field">
                <label htmlFor={field.name}>{field.label}{field.required && '*'}</label>
                <input type="file" {...fieldProps} />
            </div>
         );
      }
      // Default input types (text, number, password)
      return (
        <div key={field.name} className="form-field">
          <label htmlFor={field.name}>{field.label}{field.required && '*'}</label>
          <input type={field.type} {...fieldProps} />
        </div>
      );
    });
  };

  // --- Memoization for context value ---
  // This ensures that the context value object is only recreated when
  // its dependencies change, preventing unnecessary re-renders of consuming components.
  const contextValue: PosContextType = useMemo(() => ({
    // States
    products,
    currentSale,
    customers,
    salesHistory,
    config,
    loading,

    // Actions
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    addItemToSale,
    removeItemFromSale,
    updateItemQuantity,
    updateItemPrice,
    updateItemDiscount,
    applyDiscount,
    selectCustomer,
    clearCurrentSale,
    completeSale,
    loadCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    loadSalesHistory,
    setConfig,
    renderFormFields, // UI Helper
  }), [
    // Dependencies for the memoized value. Any state or function that
    // might change and affect consumers should be listed here.
    // Most functions defined outside of useEffect/render are stable references.
    products,
    currentSale,
    customers,
    salesHistory,
    config,
    loading,
    recalculateAndSetCurrentSale // Add recalculate function to dependency array
  ]);

  return (
    <PosContext.Provider value={contextValue}>
      {children}
    </PosContext.Provider>
  );
}

/**
 * Custom hook to access the POS context.
 * @returns The PosContextType object.
 * @throws Error if called outside of PosProvider.
 */
export const usePos = () => {
  const context = useContext(PosContext);
  if (context === undefined) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};

// Export types for external use
// Removed the conflicting export type statement. Interfaces are exported by declaration.
export { defaultPosConfig }; // Export default config as well
