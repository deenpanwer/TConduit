
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./use-auth";
import { toast } from "sonner";
import { storage } from "@/lib/storage";

const cleanObject = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  } else if (obj !== null && typeof obj === 'object') {
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
  timestamp: string;
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
  createdAt: string;
  updatedAt: string;
  lastEditedBy: string;
}

interface CRMContextType {
  entities: CRMEntity[];
  leads: CRMEntity[];
  organizations: CRMEntity[];
  contacts: CRMEntity[];
  deals: CRMEntity[];
  calls: CRMEntity[];
  notes: CRMEntity[];
  invoices: CRMEntity[];
  config: CRMConfig;
  loading: boolean;
  pageSize: number;
  setPageSize: (size: number) => void;
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

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { user, userData } = useAuth();
  const [entities, setEntities] = useState<CRMEntity[]>([]);
  const [config, setConfig] = useState<CRMConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(50);

  const orgId = userData?.ownedOrgId || userData?.orgId;

  useEffect(() => {
    if (!orgId) {
      setEntities([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribeConfig = storage.onSnapshot<any>("crm_config", (allConfigs) => {
      const storedConfig = allConfigs.find(c => c.id === orgId);
      if (storedConfig) {
        setConfig(storedConfig);
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    });

    const unsubscribeEntities = storage.onSnapshot<CRMEntity>("crm_entities", (allEntities) => {
      const orgEntities = allEntities.filter(e => e.orgId === orgId && !e.isDeleted);
      setEntities(orgEntities);
      setLoading(false);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeEntities();
    };
  }, [orgId]);

  const sortedEntities = useMemo(() => {
    return [...entities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entities]);

  const addEntity = async (type: CRMEntity['type'], data: Record<string, any>): Promise<string | null> => {
    if (!orgId || !user) return null;

    const id = Math.random().toString(36).substring(7);
    const newEntity: CRMEntity = {
      id,
      orgId,
      name: data.name || data.summary || `Unnamed ${type}`,
      type,
      data,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEditedBy: user.uid,
      history: [{
        id: Math.random().toString(36).substring(7),
        type: 'System',
        action: "created",
        content: `${type.charAt(0).toUpperCase() + type.slice(1)} "${data.name || data.summary}" was created.`,
        userId: user.uid,
        userName: userData?.name || user.displayName || "User",
        timestamp: new Date().toISOString(),
      }]
    };

    storage.saveItem("crm_entities", newEntity);
    return id;
  };

  const updateEntity = async (id: string, updates: Record<string, any>, action: string = "updated") => {
    if (!orgId || !user) return;
    const current = entities.find(e => e.id === id);
    if (!current) return;

    const historyEntry: EntityHistory = {
      id: Math.random().toString(36).substring(7),
      type: 'System',
      action,
      content: `Updated ${action}`,
      userId: user.uid,
      userName: userData?.name || user.displayName || "User",
      timestamp: new Date().toISOString(),
      details: updates
    };

    const updatedEntity = {
      ...current,
      ...updates,
      data: { ...current.data, ...updates },
      updatedAt: new Date().toISOString(),
      lastEditedBy: user.uid,
      history: [...current.history, historyEntry]
    };

    // Special case for top level fields
    if (updates.name) updatedEntity.name = updates.name;
    if (updates.isDeleted !== undefined) updatedEntity.isDeleted = updates.isDeleted;

    storage.saveItem("crm_entities", updatedEntity);
  };

  const updateEntityField = async (id: string, fieldKey: string, value: any) => {
    await updateEntity(id, { [fieldKey]: value }, fieldKey);
  };

  const addActivity = async (entityId: string, activity: { type: EntityHistory['type'], content: string, details?: any }) => {
    if (!orgId || !user) return;
    const current = entities.find(e => e.id === entityId);
    if (!current) return;

    const historyEntry: EntityHistory = {
      id: Math.random().toString(36).substring(7),
      type: activity.type,
      action: activity.type.toLowerCase(),
      content: activity.content,
      userId: user.uid,
      userName: userData?.name || user.displayName || "User",
      timestamp: new Date().toISOString(),
      details: activity.details
    };

    storage.saveItem("crm_entities", {
      ...current,
      updatedAt: new Date().toISOString(),
      lastEditedBy: user.uid,
      history: [...current.history, historyEntry]
    });
  };

  const deleteEntity = async (id: string, hardDelete: boolean = false) => {
    if (hardDelete) {
      storage.deleteItem("crm_entities", id);
    } else {
      await updateEntity(id, { isDeleted: true }, "archived");
    }
  };

  const restoreEntity = async (id: string) => {
    await updateEntity(id, { isDeleted: false }, "restored");
  };

  const updateModuleConfig = async (module: keyof CRMConfig['modules'], updates: Partial<ModuleConfig>) => {
    if (!orgId) return;
    const currentConfig = storage.getItem<any>("crm_config", orgId) || config;
    const newConfig = {
      ...currentConfig,
      id: orgId,
      modules: {
        ...currentConfig.modules,
        [module]: { ...currentConfig.modules[module], ...updates }
      }
    };
    storage.saveItem("crm_config", newConfig);
    toast.success("Settings saved locally");
  };

  const leads = useMemo(() => sortedEntities.filter(e => e.type === 'lead'), [sortedEntities]);
  const organizations = useMemo(() => sortedEntities.filter(e => e.type === 'organization'), [sortedEntities]);
  const contacts = useMemo(() => sortedEntities.filter(e => e.type === 'contact'), [sortedEntities]);
  const deals = useMemo(() => sortedEntities.filter(e => e.type === 'deal'), [sortedEntities]);
  const calls = useMemo(() => sortedEntities.filter(e => e.type === 'call'), [sortedEntities]);
  const notes = useMemo(() => sortedEntities.filter(e => e.type === 'note'), [sortedEntities]);
  const invoices = useMemo(() => sortedEntities.filter(e => e.type === 'invoice'), [sortedEntities]);

  return (
    <CRMContext.Provider value={{
      entities: sortedEntities, 
      leads, organizations, contacts, deals, calls, notes, invoices,
      config, loading, pageSize, setPageSize,
      addEntity, updateEntity, updateEntityField, addActivity, deleteEntity, restoreEntity, updateModuleConfig 
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
