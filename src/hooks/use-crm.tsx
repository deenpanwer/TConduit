'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  QueryConstraint
} from "firebase/firestore";
import { useCRMStore, CRMEntity as StoreEntity } from "@/store/use-crm-store";

/**
 * RECURSIVE UTILITY: Removes undefined values from an object.
 */
const cleanObject = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Timestamp)) {
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

export type CRMEntity = StoreEntity;

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
  isSyncing: boolean;
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
      ],
      views: [
        { id: 'v2', name: 'List', type: 'list', visibleFields: ['f1', 'f_last', 'f2', 'f5', 'f6', 'f_val'] },
      ]
    },
    deals: {
      name: "Deals",
      description: "Active business opportunities.",
      fields: [
        { id: 'd1', key: 'name', label: 'Deal Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'd_org', key: 'organization', label: 'Organization', type: 'text', isSystem: true, isVisible: true, order: 1 },
        { id: 'd_rev', key: 'annualRevenue', label: 'Value', type: 'currency', isSystem: true, isVisible: true, order: 2 },
        { id: 'd_status', key: 'status', label: 'Status', type: 'select', isSystem: true, isVisible: true, order: 3, options: [
          { label: 'Qualification', value: 'qualification', color: 'blue' },
          { label: 'Negotiation', value: 'negotiation', color: 'purple' },
          { label: 'Won', value: 'won', color: 'green' },
          { label: 'Lost', value: 'lost', color: 'red' },
        ]},
      ],
      views: [
        { id: 'dv2', name: 'All Deals', type: 'list', visibleFields: ['d1', 'd_org', 'd_rev', 'd_status'] },
      ]
    },
    organizations: {
      name: "Organizations",
      description: "Companies you do business with.",
      fields: [
        { id: 'o1', key: 'name', label: 'Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'o2', key: 'website', label: 'Website', type: 'link', isSystem: true, isVisible: true, order: 1 },
        { id: 'o3', key: 'industry', label: 'Industry', type: 'select', isSystem: true, isVisible: true, order: 2, options: [
          { label: 'Tech', value: 'tech' }, { label: 'Finance', value: 'finance' }, { label: 'Retail', value: 'retail' }
        ]},
      ],
      views: [
        { id: 'ov1', name: 'All Organizations', type: 'list', visibleFields: ['o1', 'o2', 'o3'] },
      ]
    },
    contacts: {
      name: "Contacts",
      description: "People at the companies.",
      fields: [
        { id: 'c1', key: 'firstName', label: 'First Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'c2', key: 'lastName', label: 'Last Name', type: 'text', isSystem: true, isVisible: true, order: 1 },
        { id: 'c3', key: 'email', label: 'Email', type: 'email', isSystem: true, isVisible: true, order: 2 },
        { id: 'c4', key: 'mobile', label: 'Phone', type: 'phone', isSystem: true, isVisible: true, order: 3 },
      ],
      views: [
        { id: 'cv1', name: 'List', type: 'list', visibleFields: ['c1', 'c2', 'c3', 'c4'] },
      ]
    },
    calls: { name: "Calls", description: "Logs", fields: [], views: [] },
    notes: { name: "Notes", description: "Thoughts", fields: [], views: [] },
    invoices: { name: "Invoices", description: "Billing", fields: [], views: [] },
  }
};

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { user, userData } = useAuth();
  const [config, setConfig] = useState<CRMConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(50);
  
  const entitiesMap = useCRMStore(state => state.entities);
  const setStoreEntities = useCRMStore(state => state.setEntities);
  const updateStoreEntity = useCRMStore(state => state.updateEntityLocal);
  const addStoreEntity = useCRMStore(state => state.addEntityLocal);
  const deleteStoreEntity = useCRMStore(state => state.deleteEntityLocal);
  const markSynced = useCRMStore(state => state.markSynced);
  const dirtyIds = useCRMStore(state => state.dirtyIds);

  const getOrgId = useCallback(() => userData?.ownedOrgId || userData?.orgId, [userData]);

  const allEntities = useMemo(() => {
    return Object.values(entitiesMap)
      .filter(e => !e.isDeleted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entitiesMap]);

  useEffect(() => {
    const orgId = getOrgId();
    if (!orgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `organizations/${orgId}/crm_entities`),
      where("isDeleted", "==", false),
      limit(pageSize)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: CRMEntity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as CRMEntity);
      });
      setStoreEntities(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [getOrgId, pageSize, setStoreEntities]);

  const syncingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const orgId = getOrgId();
    if (!orgId || !user || dirtyIds.size === 0) return;

    const timer = setTimeout(async () => {
      const idsToSync = Array.from(dirtyIds).filter(id => !syncingIdsRef.current.has(id));
      if (idsToSync.length === 0) return;

      for (const id of idsToSync) {
        const entity = entitiesMap[id];
        if (!entity) continue;

        try {
          syncingIdsRef.current.add(id);
          const entityRef = doc(db, `organizations/${orgId}/crm_entities`, id);
          const firestoreData = cleanObject({
            ...entity,
            updatedAt: serverTimestamp(),
            createdAt: entity.createdAt.includes('Z') ? entity.createdAt : serverTimestamp(),
          });
          
          // Use setDoc with merge: true for all syncs. 
          // This creates the document if it doesn't exist (e.g. for new UUIDs) 
          // or updates it if it does.
          await setDoc(entityRef, firestoreData, { merge: true });
          
          markSynced(id);
        } catch (e) {
          console.error("Sync failed for", id, e);
        } finally {
          syncingIdsRef.current.delete(id);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [dirtyIds, entitiesMap, getOrgId, user, markSynced, deleteStoreEntity, addStoreEntity]);

  const addEntity = async (type: StoreEntity['type'], data: Record<string, any>) => {
    const orgId = getOrgId();
    if (!orgId || !user) return null;

    const tempId = crypto.randomUUID();
    const newEntity: CRMEntity = {
      id: tempId,
      orgId,
      name: data.name || data.summary || `New ${type}`,
      type,
      data,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEditedBy: user.uid,
      history: []
    };

    addStoreEntity(newEntity);
    return tempId;
  };

  const updateEntity = async (id: string, updates: Record<string, any>) => {
    const isDataUpdate = !('name' in updates || 'isDeleted' in updates);
    updateStoreEntity(id, isDataUpdate ? { data: updates } : updates);
  };

  const deleteEntity = async (id: string) => {
    updateStoreEntity(id, { isDeleted: true });
  };

  const leads = useMemo(() => allEntities.filter(e => e.type === 'lead'), [allEntities]);
  const organizations = useMemo(() => allEntities.filter(e => e.type === 'organization'), [allEntities]);
  const contacts = useMemo(() => allEntities.filter(e => e.type === 'contact'), [allEntities]);
  const deals = useMemo(() => allEntities.filter(e => e.type === 'deal'), [allEntities]);
  const calls = useMemo(() => allEntities.filter(e => e.type === 'call'), [allEntities]);
  const notes = useMemo(() => allEntities.filter(e => e.type === 'note'), [allEntities]);
  const invoices = useMemo(() => allEntities.filter(e => e.type === 'invoice'), [allEntities]);

  return (
    <CRMContext.Provider value={{
      entities: allEntities, leads, organizations, contacts, deals, calls, notes, invoices,
      config, loading, isSyncing: dirtyIds.size > 0, pageSize, setPageSize,
      addEntity, updateEntity, updateEntityField: (id, key, val) => updateEntity(id, { [key]: val }),
      addActivity: async () => {}, deleteEntity, restoreEntity: async (id) => updateEntity(id, { isDeleted: false }),
      updateModuleConfig: async () => {} 
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error("useCRM must be used within CRMProvider");
  return context;
};
