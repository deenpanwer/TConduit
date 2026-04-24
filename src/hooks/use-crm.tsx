'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./use-auth";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  where,
  Timestamp,
  arrayUnion,
  limit,
  orderBy,
  QueryConstraint
} from "firebase/firestore";

/**
 * RECURSIVE UTILITY: Removes undefined values from an object.
 * Firestore will throw an error if any field is undefined.
 */
const cleanObject = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Timestamp)) {
    // Check if it's a Firestore FieldValue or other system object
    // FieldValues usually have internal methods like _toFieldTransform
    if (Object.getPrototypeOf(obj) !== Object.prototype && Object.getPrototypeOf(obj) !== null) {
      return obj;
    }
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanObject(value);
      }
    }
    return cleaned;
  }
  return obj;
};

export interface FieldConfig {
  id: string;
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'select' | 'date' | 'currency' | 'email' | 'phone' | 'textarea' | 'checkbox' | 'timeline' | 'link' | 'people' | 'label' | 'file';
  isSystem: boolean;
  isVisible: boolean;
  order: number;
  options?: { label: string; value: string; color?: string }[];
}

export interface ViewConfig {
  id: string;
  name: string;
  type: 'kanban' | 'list';
  visibleFields: string[];
  kanbanFieldId?: string;
  sortBy?: { fieldId: string; direction: 'asc' | 'desc' };
}

export interface ModuleConfig {
  name: string;
  description: string;
  fields: FieldConfig[];
  views: ViewConfig[];
}

export interface CRMConfig {
  modules: {
    leads: ModuleConfig;
    organizations: ModuleConfig;
    contacts: ModuleConfig;
    deals: ModuleConfig;
    calls: ModuleConfig;
    notes: ModuleConfig;
    invoices: ModuleConfig;
  };
}

export interface EntityHistory {
  id: string;
  type: 'Note' | 'Email' | 'Call' | 'Task' | 'Comment' | 'System' | 'Invoice';
  action: string;
  content: string;
  userId: string;
  userName?: string;
  timestamp: string | any;
  details?: any;
}

export interface CRMEntity {
  id: string;
  orgId: string;
  name: string;
  type: 'lead' | 'organization' | 'contact' | 'deal' | 'call' | 'note' | 'invoice';
  data: Record<string, any>;
  history: EntityHistory[];
  isDeleted: boolean;
  createdAt: string | any;
  updatedAt: string | any;
  lastEditedBy: string;
}

/**
 * CRM Context Interface
 * Handles data fetching, configuration, and CRUD operations for the CRM system.
 */
interface CRMContextType {
  // Entities grouped by type
  entities: CRMEntity[];
  leads: CRMEntity[];
  organizations: CRMEntity[];
  contacts: CRMEntity[];
  deals: CRMEntity[];
  calls: CRMEntity[];
  notes: CRMEntity[];
  invoices: CRMEntity[];
  
  // Configuration and state
  config: CRMConfig;
  loading: boolean;
  isSyncing: boolean;
  
  // Pagination
  pageSize: number;
  setPageSize: (size: number) => void;
  
  // CRUD Operations
  addEntity: (type: CRMEntity['type'], data: Record<string, any>) => Promise<string | null>;
  updateEntity: (id: string, updates: Record<string, any>, action?: string) => Promise<void>;
  updateEntityField: (id: string, fieldKey: string, value: any) => Promise<void>;
  addActivity: (entityId: string, activity: { type: EntityHistory['type'], content: string, details?: any }) => Promise<void>;
  deleteEntity: (id: string, hardDelete?: boolean) => Promise<void>;
  restoreEntity: (id: string) => Promise<void>;
  updateModuleConfig: (module: keyof CRMConfig['modules'], updates: Partial<ModuleConfig>) => Promise<void>;
}

const DEFAULT_CONFIG: CRMConfig = {
  modules: {
    leads: {
      name: "Leads",
      description: "People who might buy from you but aren't customers yet.",
      fields: [
        { id: 'f1', key: 'firstName', label: 'First Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'f_last', key: 'lastName', label: 'Last Name', type: 'text', isSystem: true, isVisible: true, order: 1 },
        { id: 'f2', key: 'company', label: 'Organization', type: 'text', isSystem: true, isVisible: true, order: 2 },
        { id: 'f5', key: 'status', label: 'Status', type: 'select', isSystem: true, isVisible: true, order: 3, options: [
          { label: 'New', value: 'new', color: 'blue' },
          { label: 'Talking', value: 'contacted', color: 'yellow' },
          { label: 'Qualified', value: 'qualified', color: 'purple' },
        ]},
        { id: 'f6', key: 'priority', label: 'Priority', type: 'select', isSystem: true, isVisible: true, order: 4, options: [
          { label: 'Low', value: 'low', color: 'gray' },
          { label: 'Medium', value: 'medium', color: 'orange' },
          { label: 'High', value: 'high', color: 'red' },
        ]},
        { id: 'f_val', key: 'estimatedValue', label: 'Est. Value', type: 'currency', isSystem: true, isVisible: true, order: 5 },
        // Hidden Templates (Ready to be added via ColumnPicker)
        { id: 'f_sal', key: 'salutation', label: 'Salutation', type: 'select', isSystem: true, isVisible: false, order: 6, options: [
          { label: 'Mr', value: 'Mr' }, { label: 'Ms', value: 'Ms' }, { label: 'Mrs', value: 'Mrs' }, { label: 'Dr', value: 'Dr' }, { label: 'Prof', value: 'Prof' },
        ]},
        { id: 'f3', key: 'email', label: 'Email', type: 'email', isSystem: true, isVisible: false, order: 7 },
        { id: 'f_mob', key: 'mobile', label: 'Mobile No.', type: 'phone', isSystem: true, isVisible: false, order: 8 },
        { id: 'f_job', key: 'jobTitle', label: 'Job Title', type: 'select', isSystem: true, isVisible: false, order: 9, options: [
          { label: 'CEO', value: 'ceo' }, { label: 'CTO', value: 'cto' }, { label: 'Founder', value: 'founder' }, { label: 'Owner', value: 'owner' }, { label: 'Manager', value: 'manager' }, { label: 'Director', value: 'director' }, { label: 'VP', value: 'vp' }, { label: 'Engineer', value: 'engineer' }, { label: 'Sales Lead', value: 'sales_lead' }, { label: 'Designer', value: 'designer' }, { label: 'Analyst', value: 'analyst' },
        ] },
        { id: 'f_ind', key: 'industry', label: 'Industry', type: 'select', isSystem: true, isVisible: false, order: 10, options: [
          { label: 'Technology', value: 'technology' }, { label: 'Healthcare', value: 'healthcare' }, { label: 'Finance', value: 'finance' }, { label: 'Education', value: 'education' }, { label: 'Manufacturing', value: 'manufacturing' }, { label: 'Retail', value: 'retail' }, { label: 'Energy', value: 'energy' }, { label: 'Telecommunications', value: 'telecommunications' }, { label: 'Real Estate', value: 'real_estate' }, { label: 'Transportation', value: 'transportation' }, { label: 'Media', value: 'media' }, { label: 'Other', value: 'other' },
        ] },
        { id: 'f_web', key: 'website', label: 'Website', type: 'text', isSystem: true, isVisible: false, order: 11 },
        { id: 'f_src', key: 'source', label: 'Lead Source', type: 'select', isSystem: true, isVisible: false, order: 12, options: [
          { label: 'Website', value: 'website' }, { label: 'LinkedIn', value: 'linkedin' }, { label: 'Referral', value: 'referral' }, { label: 'Cold Call', value: 'cold_call' }, { label: 'Cold Email', value: 'cold_email' }, { label: 'Event', value: 'event' }, { label: 'Twitter', value: 'twitter' }, { label: 'Instagram', value: 'instagram' }, { label: 'Advertisement', value: 'advertisement' },
        ] },
        { id: 'f_peop', key: 'people', label: 'People', type: 'people', isSystem: true, isVisible: false, order: 13 },
        { id: 'f_time', key: 'timeline', label: 'Timeline', type: 'timeline', isSystem: true, isVisible: false, order: 14 },
        { id: 'f_link', key: 'link', label: 'Link', type: 'link', isSystem: true, isVisible: false, order: 15 },
        { id: 'f_last_int', key: 'lastInteraction', label: 'Last Interaction', type: 'date', isSystem: true, isVisible: false, order: 16 },
        { id: 'f_follow_up', key: 'followUpStatus', label: 'Follow up status', type: 'select', isSystem: true, isVisible: false, order: 17, options: [
            { label: 'Pending', value: 'pending', color: 'gray' },
            { label: 'In Progress', value: 'in_progress', color: 'blue' },
            { label: 'Completed', value: 'completed', color: 'green' },
        ]},
        { id: 'f_next_fu', key: 'nextFollowUp', label: 'Next follow up', type: 'date', isSystem: true, isVisible: false, order: 18 },
        { id: 'f_comm', key: 'comments', label: 'Comments', type: 'textarea', isSystem: true, isVisible: false, order: 19 },
      ],
      views: [
        { id: 'v1', name: 'Board', type: 'kanban', visibleFields: ['f1', 'f_last', 'f2', 'f6', 'f_val'], kanbanFieldId: 'f5' },
        { id: 'v2', name: 'List', type: 'list', visibleFields: ['f1', 'f_last', 'f2', 'f5', 'f6', 'f_val'] },
      ]
    },
    deals: {
      name: "Deals",
      description: "Active business opportunities and money on the table.",
      fields: [
        { id: 'd1', key: 'name', label: 'Deal Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'd_org', key: 'organization', label: 'Organization Name', type: 'text', isSystem: true, isVisible: true, order: 1 },
        { id: 'd_web', key: 'website', label: 'Website', type: 'text', isSystem: true, isVisible: true, order: 2 },
        { id: 'd_rev', key: 'annualRevenue', label: 'Annual Revenue', type: 'currency', isSystem: true, isVisible: true, order: 3 },
        { id: 'd_emp', key: 'employeeCount', label: 'No. of Employees', type: 'select', isSystem: true, isVisible: true, order: 4, options: [
          { label: '1-10', value: '1-10' },
          { label: '11-50', value: '11-50' },
          { label: '51-200', value: '51-200' },
          { label: '201-500', value: '201-500' },
          { label: '500+', value: '500+' },
        ]},
        { id: 'd_ind', key: 'industry', label: 'Industry', type: 'select', isSystem: true, isVisible: true, order: 5, options: [] },
        { id: 'd_sal', key: 'salutation', label: 'Salutation', type: 'select', isSystem: true, isVisible: true, order: 6, options: [
          { label: 'Mr', value: 'Mr' },
          { label: 'Ms', value: 'Ms' },
          { label: 'Mrs', value: 'Mrs' },
          { label: 'Dr', value: 'Dr' },
          { label: 'Prof', value: 'Prof' },
        ]},
        { id: 'd_email', key: 'email', label: 'Primary email', type: 'email', isSystem: true, isVisible: true, order: 7 },
        { id: 'd_fname', key: 'firstName', label: 'First name', type: 'text', isSystem: true, isVisible: true, order: 8 },
        { id: 'd_phone', key: 'mobile', label: 'Primary mobile no', type: 'phone', isSystem: true, isVisible: true, order: 9 },
        { id: 'd_lname', key: 'lastName', label: 'Last name', type: 'text', isSystem: true, isVisible: true, order: 10 },
        { id: 'd_gen', key: 'gender', label: 'Gender', type: 'select', isSystem: true, isVisible: true, order: 11, options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Other', value: 'other' },
        ]},
        { id: 'd_status', key: 'status', label: 'Status', type: 'select', isSystem: true, isVisible: true, order: 12, options: [
          { label: 'Qualification', value: 'qualification', color: 'blue' },
          { label: 'Demo/Making', value: 'demo', color: 'yellow' },
          { label: 'Proposal/Quotation', value: 'proposal', color: 'orange' },
          { label: 'Negotiation', value: 'negotiation', color: 'purple' },
          { label: 'Ready to Close', value: 'ready', color: 'indigo' },
          { label: 'Won', value: 'won', color: 'green' },
          { label: 'Lost', value: 'lost', color: 'red' },
        ]},
      ],
      views: [
        { id: 'dv1', name: 'Pipeline', type: 'kanban', visibleFields: ['d_org', 'd_rev', 'd_status'], kanbanFieldId: 'd_status' },
        { id: 'dv2', name: 'All Deals', type: 'list', visibleFields: ['d_org', 'd_fname', 'd_lname', 'd_email', 'd_status', 'd_rev'] },
      ]
    },
    organizations: {
      name: "Organizations",
      description: "Companies you do business with.",
      fields: [
        { id: 'o1', key: 'organizationName', label: 'Organization Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'o2', key: 'website', label: 'Website', type: 'text', isSystem: true, isVisible: true, order: 1 },
        { id: 'o3', key: 'annualRevenue', label: 'Annual Revenue', type: 'currency', isSystem: true, isVisible: true, order: 2 },
        { id: 'o4', key: 'employeeCount', label: 'No. of Employees', type: 'select', isSystem: true, isVisible: true, order: 3, options: [
          { label: '1-10', value: '1-10' },
          { label: '11-50', value: '11-50' },
          { label: '51-200', value: '51-200' },
          { label: '201-500', value: '201-500' },
          { label: '500+', value: '500+' },
        ]},
        { id: 'o5', key: 'industry', label: 'Industry', type: 'select', isSystem: true, isVisible: true, order: 4, options: [] },
        { id: 'o6', key: 'street', label: 'Street', type: 'text', isSystem: true, isVisible: true, order: 5 },
        { id: 'o7', key: 'city', label: 'City', type: 'text', isSystem: true, isVisible: true, order: 6 },
        { id: 'o8', key: 'state', label: 'State', type: 'text', isSystem: true, isVisible: true, order: 7 },
        { id: 'o9', key: 'zipCode', label: 'Zip Code', type: 'text', isSystem: true, isVisible: true, order: 8 },
        { id: 'o10', key: 'country', label: 'Country', type: 'text', isSystem: true, isVisible: true, order: 9 },
      ],
      views: [
        { id: 'ov1', name: 'All Organizations', type: 'list', visibleFields: ['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8', 'o9', 'o10'] },
      ]
    },
    contacts: {
      name: "Contacts",
      description: "Individual people at the companies you know.",
      fields: [
        { id: 'c_sal', key: 'salutation', label: 'Salutation', type: 'select', isSystem: true, isVisible: true, order: 0, options: [
          { label: 'Mr', value: 'Mr' },
          { label: 'Ms', value: 'Ms' },
          { label: 'Mrs', value: 'Mrs' },
          { label: 'Dr', value: 'Dr' },
          { label: 'Prof', value: 'Prof' },
        ]},
        { id: 'c1', key: 'firstName', label: 'First Name', type: 'text', isSystem: true, isVisible: true, order: 1 },
        { id: 'c_last', key: 'lastName', label: 'Last Name', type: 'text', isSystem: true, isVisible: true, order: 2 },
        { id: 'c3', key: 'email', label: 'Email Address', type: 'email', isSystem: true, isVisible: true, order: 3 },
        { id: 'c_mob', key: 'mobile', label: 'Mobile No', type: 'phone', isSystem: true, isVisible: true, order: 4 },
        { id: 'c_gen', key: 'gender', label: 'Gender', type: 'select', isSystem: true, isVisible: true, order: 5, options: [
          { label: 'Male', value: 'Male' },
          { label: 'Female', value: 'Female' },
          { label: 'Other', value: 'Other' },
        ]},
        { id: 'c2', key: 'company', label: 'Company Name', type: 'text', isSystem: true, isVisible: true, order: 6 },
        { id: 'c_des', key: 'designation', label: 'Designation', type: 'text', isSystem: true, isVisible: true, order: 7 },
        { id: 'c_addr', key: 'address', label: 'Address', type: 'textarea', isSystem: true, isVisible: true, order: 8 },
      ],
      views: [
        { id: 'cv1', name: 'Spreadsheet', type: 'list', visibleFields: ['c1', 'c_last', 'c3', 'c_mob', 'c2', 'c_des'] },
      ]
    },
    calls: {
        name: "Phone Calls",
        description: "Logs of every time you talk to someone.",
        fields: [
          { id: 'cl_summary', key: 'summary', label: 'Summary', type: 'text', isSystem: true, isVisible: true, order: 0 },
          { id: 'cl_type', key: 'type', label: 'Type', type: 'select', isSystem: true, isVisible: true, order: 1, options: [
            { label: 'Incoming', value: 'Incoming', color: 'blue' },
            { label: 'Outgoing', value: 'Outgoing', color: 'green' },
          ]},
          { id: 'cl_from', key: 'from', label: 'From', type: 'text', isSystem: true, isVisible: true, order: 2 },
          { id: 'cl_to', key: 'to', label: 'To', type: 'text', isSystem: true, isVisible: true, order: 3 },
          { id: 'cl_duration', key: 'duration', label: 'Duration', type: 'number', isSystem: true, isVisible: true, order: 4 },
          { id: 'cl_status', key: 'status', label: 'Status', type: 'select', isSystem: true, isVisible: true, order: 5, options: [
            { label: 'Initiated', value: 'initiated', color: 'gray' },
            { label: 'Ringing', value: 'ringing', color: 'blue' },
            { label: 'In Progress', value: 'in-progress', color: 'blue' },
            { label: 'Completed', value: 'completed', color: 'green' },
            { label: 'Failed', value: 'failed', color: 'red' },
            { label: 'Busy', value: 'busy', color: 'orange' },
            { label: 'No Answer', value: 'no-answer', color: 'red' },
            { label: 'Queued', value: 'queued', color: 'gray' },
            { label: 'Canceled', value: 'canceled', color: 'gray' },
          ]},
          { id: 'cl_related_to', key: 'relatedTo', label: 'Related To', type: 'text', isSystem: true, isVisible: true, order: 6 },
          { id: 'cl_created_at', key: 'createdAt', label: 'Date', type: 'date', isSystem: true, isVisible: true, order: 7 },
        ],
        views: [
          { id: 'cv1', name: 'Call History', type: 'list', visibleFields: ['cl_summary', 'cl_type', 'cl_from', 'cl_to', 'cl_duration', 'cl_status', 'cl_related_to', 'cl_created_at'] },
        ]
      },
    notes: {
      name: "Notes",
      description: "Private thoughts and records about leads or deals.",
      fields: [
        { id: 'n1', key: 'name', label: 'Note Title', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'n2', key: 'content', label: 'Actual Note', type: 'textarea', isSystem: true, isVisible: true, order: 1 },
        { id: 'n3', key: 'relatedTo', label: 'Related To', type: 'text', isSystem: true, isVisible: true, order: 2 },
      ],
      views: [
        { id: 'nv1', name: 'Grid', type: 'kanban', visibleFields: ['n1', 'n2', 'n3'], kanbanFieldId: 'n3' },
        { id: 'nv2', name: 'List', type: 'list', visibleFields: ['n1', 'n3'] },
      ]
    },
    invoices: {
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
        { id: 'inv7', key: 'currency', label: 'Currency', type: 'text', isSystem: true, isVisible: true, order: 6 },
      ],
      views: [
        { id: 'invv1', name: 'All Invoices', type: 'list', visibleFields: ['inv1', 'inv2', 'inv3', 'inv4', 'inv5', 'inv6'] },
      ]
    }
  }
};

const CRMContext = createContext<CRMContextType | undefined>(undefined);

/**
 * CRM PROVIDER
 * Manages all CRM data, configuration, and real-time synchronization with Firestore.
 */
export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { user, userData } = useAuth();
  const [entities, setEntities] = useState<CRMEntity[]>([]);
  const [optimisticEntities, setOptimisticEntities] = useState<CRMEntity[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, Partial<CRMEntity>>>({});
  const [config, setConfig] = useState<CRMConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Pagination State (Records per fetch)
  const [pageSize, setPageSize] = useState(50);

  const SYNC_STORAGE_KEY = 'trac_pending_crm_syncs';

  // Helper to get active organization ID
  const getOrgId = useCallback(() => {
    return userData?.ownedOrgId || userData?.orgId;
  }, [userData]);

  // Load pending updates from localStorage
  useEffect(() => {
    const savedPending = localStorage.getItem(SYNC_STORAGE_KEY);
    if (savedPending) {
        try { setPendingUpdates(JSON.parse(savedPending)); } catch (e) {}
    }
  }, []);

  // Persist pending updates to localStorage
  useEffect(() => {
    if (Object.keys(pendingUpdates).length > 0) {
        localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(pendingUpdates));
    } else {
        localStorage.removeItem(SYNC_STORAGE_KEY);
    }
  }, [pendingUpdates]);

  /**
   * INITIALIZATION & REAL-TIME LISTENERS
   */
  useEffect(() => {
    const orgId = getOrgId();
    if (!orgId) {
      setEntities([]);
      setOptimisticEntities([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    /**
     * 1. CONFIGURATION LISTENER
     * Syncs custom fields, views, and module settings.
     */
    const configRef = doc(db, `organizations/${orgId}/crm_config`, 'main');
    const unsubscribeConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const storedConfig = docSnap.data() as CRMConfig;
        const merged = { ...DEFAULT_CONFIG };
        
        // Merge stored config with defaults to ensure new system features are available
        Object.keys(merged.modules).forEach(key => {
          const k = key as keyof CRMConfig['modules'];
          if (storedConfig.modules[k]) {
              const defaultFieldKeys = new Set(merged.modules[k].fields.map(f => f.key));
              const customFields = (storedConfig.modules[k].fields || []).filter((f: FieldConfig) => !defaultFieldKeys.has(f.key) && !f.isSystem);

              // Update system fields with stored visibility/order
              const updatedFields = merged.modules[k].fields.map(sysField => {
                  const storedField = (storedConfig.modules[k].fields || []).find((f: FieldConfig) => f.key === sysField.key);
                  if (storedField) {
                      return {
                          ...sysField,
                          isVisible: storedField.isVisible !== undefined ? storedField.isVisible : sysField.isVisible,
                          order: storedField.order !== undefined ? storedField.order : sysField.order,
                          options: storedField.options || sysField.options,
                          description: storedField.description || sysField.description
                      };
                  }
                  // If it's a system field but NOT in stored config, it means it was explicitly removed/hidden
                  // We keep it in the blueprint but mark it as hidden so it doesn't reappear in Active Details.
                  const hasStoredFields = (storedConfig.modules[k].fields || []).length > 0;
                  return {
                      ...sysField,
                      isVisible: hasStoredFields ? false : sysField.isVisible
                  };
              });

              const newFields = [...updatedFields, ...customFields].sort((a, b) => a.order - b.order);
              const allFieldIds = new Set(newFields.map(f => f.id));

              // Merge views
              const defaultViews = merged.modules[k].views;
              const storedViews = storedConfig.modules[k].views || [];

              const mergedViews = defaultViews.map(defaultView => {
                  const storedView = storedViews.find((v: ViewConfig) => v.id === defaultView.id);
                  if (storedView) {
                      // CRITICAL FIX: Prioritize stored fields list if it exists. 
                      // Only fallback to defaults or merge if specifically requested.
                      // This allows users to REMOVE default fields from their view.
                      const finalVisibleFields = (storedView.visibleFields || defaultView.visibleFields)
                          .filter(id => allFieldIds.has(id));
                      
                      return { ...defaultView, ...storedView, visibleFields: finalVisibleFields };
                  }
                  return defaultView;
              });

              merged.modules[k] = {
                  ...merged.modules[k],
                  fields: newFields,
                  views: mergedViews,
              };
          }
        });
        setConfig(merged);
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    });

    /**
     * 2. ENTITY LISTENER
     * Fetches leads, deals, etc. with pagination support.
     */
    const entitiesRef = collection(db, `organizations/${orgId}/crm_entities`);
    
    // BUG FIX: Removed orderBy("createdAt", "desc") to avoid needing a composite index.
    // The sorting is now handled client-side in the `combinedEntities` useMemo hook.
    const constraints: QueryConstraint[] = [
      where("isDeleted", "==", false),
      limit(pageSize)
    ];

    const q = query(entitiesRef, ...constraints);
    
    const unsubscribeEntities = onSnapshot(q, { includeMetadataChanges: true }, (querySnapshot) => {
      const docs: CRMEntity[] = [];
      querySnapshot.forEach((doc) => {
        // Use 'estimate' to provide a local timestamp for optimistic updates
        const data = doc.data({ serverTimestamps: 'estimate' });
        const historyArray = Array.isArray(data.history) ? data.history : [];
        docs.push({ 
          ...data, 
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          history: historyArray.map((h: any) => ({
            ...h,
            timestamp: h.timestamp instanceof Timestamp ? h.timestamp.toDate().toISOString() : h.timestamp
          }))
        } as CRMEntity);
      });
      
      setEntities(docs);
      
      // Only clear optimistic entities that have been successfully confirmed by the server
      // and are now present in the formal 'entities' list.
      if (!querySnapshot.metadata.hasPendingWrites) {
        setOptimisticEntities(prev => prev.filter(oe => !docs.some(d => d.id === oe.id)));
      }
      
      setLoading(false);
    }, (error) => {
      console.error("CRM Entities listener failed:", error);
      setLoading(false);
      toast.error("Failed to sync CRM data");
    });

    return () => {
      unsubscribeConfig();
      unsubscribeEntities();
    };
  }, [getOrgId, pageSize]);

  // Combined entities (Optimistic + Real)
  // We prioritize optimisticEntities (manual) for new items, 
  // but let Firestore's entities (which are also optimistic due to includeMetadataChanges) 
  // handle updates to existing items.
  const combinedEntities = useMemo(() => {
    // Start with server/realtime entities
    const combined = [...entities];
    
    // Add optimistic items (mostly new ones that don't exist in server list yet)
    optimisticEntities.forEach(oe => {
      const index = combined.findIndex(e => e.id === oe.id);
      if (index === -1) {
        combined.push(oe);
      } else {
        // If it's already in the server list, the server list is actually "newer" 
        // or Firestore's own optimistic state is better.
      }
    });

    // Data is sorted here, ensuring consistent order without a complex Firestore query.
    return combined.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [entities, optimisticEntities]);

  /**
   * ADD ENTITY
   * Creates a new lead, deal, or other CRM item.
   */
  const addEntity = async (type: CRMEntity['type'], data: Record<string, any>): Promise<string | null> => {
    const orgId = getOrgId();
    if (!orgId || !user) return null;

    const tempId = crypto.randomUUID();
    const newEntity: CRMEntity = {
      id: tempId,
      orgId,
      name: data.name || data.summary || `Unnamed ${type}`,
      type,
      data,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEditedBy: user.uid,
      history: []
    };

    // Optimistic Update
    setOptimisticEntities(prev => [newEntity, ...prev]);

    // FIRE AND FORGET (Async): Handle Firestore in the background
    (async () => {
      try {
        const entitiesRef = collection(db, `organizations/${orgId}/crm_entities`);
        
        const firestoreData = cleanObject({
          orgId,
          name: data.name || data.summary || `Unnamed ${type}`,
          type,
          data,
          isDeleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastEditedBy: user.uid,
          history: [{
            id: crypto.randomUUID(),
            type: 'System',
            action: "created",
            content: `${type.charAt(0).toUpperCase() + type.slice(1)} "${data.name || data.summary}" was created.`,
            userId: user.uid,
            userName: userData?.name || user.displayName || "User",
            timestamp: new Date().toISOString(),
          }]
        });

        const docRef = await addDoc(entitiesRef, firestoreData);
        
        // Update optimistic entity with the real ID once known
        setOptimisticEntities(prev => prev.map(e => e.id === tempId ? { ...e, id: docRef.id } : e));
      } catch (e) {
        console.error("Error adding CRM entity:", e);
        setOptimisticEntities(prev => prev.filter(e => e.id !== tempId));
        toast.error("Failed to add item");
      }
    })();

    // RETURN IMMEDIATELY: Give the UI the tempId so it can focus the row NOW
    return tempId;
  };

  /**
   * UPDATE ENTITY
   * Updates fields and adds a history entry.
   */
  const updateEntity = async (id: string, updates: Record<string, any>, action: string = "updated") => {
    const orgId = getOrgId();
    if (!orgId || !user) return;

    // Deep clean updates
    const deepClean = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(deepClean);
      if (obj !== null && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
        return Object.entries(obj).reduce((acc: any, [key, value]) => {
          if (value !== undefined) acc[key] = deepClean(value);
          return acc;
        }, {} as any);
      }
      return obj;
    };

    const finalUpdates = deepClean(updates);

    // Optimistic Update: Use pendingUpdates for debouncing
    setPendingUpdates(prev => {
      const existing = prev[id] || {};
      return {
        ...prev,
        [id]: { ...existing, ...finalUpdates }
      };
    });
  };

  // Flush pending updates to Firestore
  const flushUpdates = useCallback(async (updatesToFlush: Record<string, any>) => {
    const orgId = getOrgId();
    if (!orgId || !user || Object.keys(updatesToFlush).length === 0) return;

    setIsSyncing(true);
    
    try {
      for (const [id, updates] of Object.entries(updatesToFlush)) {
        const entityRef = doc(db, `organizations/${orgId}/crm_entities`, id);
        
        const historyEntry = {
          id: crypto.randomUUID(),
          type: 'System',
          action: 'updated',
          content: `Updated fields`,
          userId: user.uid,
          userName: userData?.name || user.displayName || "User",
          timestamp: new Date().toISOString(),
          details: updates
        };

        const firestoreUpdates: any = {
          updatedAt: serverTimestamp(),
          lastEditedBy: user.uid,
          history: arrayUnion(historyEntry),
          'data.lastInteraction': new Date().toISOString()
        };

        // Flatten data updates for nested firestore update
        Object.entries(updates as any).forEach(([key, value]) => {
          if (key === 'name' || key === 'summary') {
            firestoreUpdates.name = value;
          } else if (key === 'isDeleted') {
            firestoreUpdates.isDeleted = value;
          } else {
            firestoreUpdates[`data.${key}`] = value;
          }
        });

        await updateDoc(entityRef, cleanObject(firestoreUpdates));
      }

      // Remove successfully flushed updates from pending
      setPendingUpdates(prev => {
        const next = { ...prev };
        for (const id in updatesToFlush) {
          delete next[id];
        }
        return next;
      });
    } catch (error) {
      console.error("Error flushing CRM updates:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [getOrgId, user, userData]);

  // Heartbeat Syncing
  useEffect(() => {
    const heartbeat = setInterval(() => {
        if (Object.keys(pendingUpdates).length > 0) {
            flushUpdates(pendingUpdates);
        }
    }, 5 * 60 * 1000); // 5 minute heartbeat

    return () => clearInterval(heartbeat);
  }, [pendingUpdates, flushUpdates]);

  // Flush on tab close or background
  useEffect(() => {
    const handleFlush = () => {
        if (Object.keys(pendingUpdates).length > 0) {
            flushUpdates(pendingUpdates);
        }
    };

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            handleFlush();
        }
    };

    window.addEventListener('beforeunload', handleFlush);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
        window.removeEventListener('beforeunload', handleFlush);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pendingUpdates, flushUpdates]);

  const updateEntityField = async (id: string, fieldKey: string, value: any) => {
    await updateEntity(id, { [fieldKey]: value }, fieldKey);
  };

  /**
   * ADD ACTIVITY
   * Manually adds a note, call log, or comment to an entity's history.
   */
  const addActivity = async (entityId: string, activity: { type: EntityHistory['type'], content: string, details?: any }) => {
    const orgId = getOrgId();
    if (!orgId || !user) return;
    
    try {
      const entityRef = doc(db, `organizations/${orgId}/crm_entities`, entityId);
      const historyEntry = {
        id: crypto.randomUUID(),
        type: activity.type,
        action: activity.type.toLowerCase(),
        content: activity.content,
        userId: user.uid,
        userName: userData?.name || user.displayName || "User",
        timestamp: new Date().toISOString(),
        details: activity.details
      };

      await updateDoc(entityRef, {
        updatedAt: serverTimestamp(),
        lastEditedBy: user.uid,
        history: arrayUnion(cleanObject(historyEntry))
      });
    } catch (e) {
      console.error("Error adding CRM activity:", e);
    }
  };

  /**
   * DELETE ENTITY
   * Soft deletes an entity (moves to trash) or hard deletes it.
   */
  const deleteEntity = async (id: string, hardDelete: boolean = false) => {
    const orgId = getOrgId();
    if (!user) return;

    // Optimistic delete
    if (!hardDelete) {
        setOptimisticEntities(prev => prev.filter(e => e.id !== id));
        setEntities(prev => prev.filter(e => e.id !== id));
    }

    try {
      const entityRef = doc(db, `organizations/${orgId}/crm_entities`, id);
      if (hardDelete) {
        await deleteDoc(entityRef);
        toast.success("Permanently deleted");
      } else {
        await updateEntity(id, { isDeleted: true }, "archived");
        toast.success("Moved to Trash");
      }
    } catch (e) {
      console.error("Error deleting CRM entity:", e);
      toast.error("Delete failed");
    }
  };

  const restoreEntity = async (id: string) => {
    await updateEntity(id, { isDeleted: false }, "restored");
    toast.success("Restored successfully");
  };

  /**
   * UPDATE MODULE CONFIG
   * Saves custom fields and view settings.
   */
  const updateModuleConfig = async (module: keyof CRMConfig['modules'], updates: Partial<ModuleConfig>) => {
    const orgId = getOrgId();
    if (!orgId) return;

    try {
      const configRef = doc(db, `organizations/${orgId}/crm_config`, 'main');
      
      // We perform a surgical update using dot notation to avoid overwriting other modules
      // or using a stale local config object.
      const modulePath = `modules.${module}`;
      const cleanedUpdates = cleanObject(updates);
      
      await setDoc(configRef, {
        modules: {
          [module]: cleanedUpdates
        }
      }, { merge: true });
      
      toast.success("Settings saved to cloud");
    } catch (e) {
      console.error("Error updating CRM config:", e);
      toast.error("Failed to save settings");
    }
  };

  const leads = useMemo(() => combinedEntities.filter(e => e.type === 'lead'), [combinedEntities]);
  const organizations = useMemo(() => combinedEntities.filter(e => e.type === 'organization'), [combinedEntities]);
  const contacts = useMemo(() => combinedEntities.filter(e => e.type === 'contact'), [combinedEntities]);
  const deals = useMemo(() => combinedEntities.filter(e => e.type === 'deal'), [combinedEntities]);
  const calls = useMemo(() => combinedEntities.filter(e => e.type === 'call'), [combinedEntities]);
  const notes = useMemo(() => combinedEntities.filter(e => e.type === 'note'), [combinedEntities]);
  const invoices = useMemo(() => combinedEntities.filter(e => e.type === 'invoice'), [combinedEntities]);

  return (
    <CRMContext.Provider value={{
      entities: combinedEntities, 
      leads,
      organizations,
      contacts,
      deals,
      calls,
      notes,
      invoices,
      config, 
      loading,
      isSyncing,
      pageSize,
      setPageSize,
      addEntity, 
      updateEntity, 
      updateEntityField,
      addActivity, 
      deleteEntity, 
      restoreEntity, 
      updateModuleConfig 
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
};
