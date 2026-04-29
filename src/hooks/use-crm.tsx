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
import { 
  FieldConfig, 
  ViewConfig, 
  ModuleConfig, 
  CRMConfig,
  DEFAULT_CONFIG 
} from "@/store/crm-types";

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

// Re-export types for backward compatibility
export type { FieldConfig, ViewConfig, ModuleConfig, CRMConfig };

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

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(1000);
  
  // Zustand Store
  const entitiesMap = useCRMStore(state => state.entities);
  const setStoreEntities = useCRMStore(state => state.setEntities);
  const updateStoreEntity = useCRMStore(state => state.updateEntityLocal);
  const addStoreEntity = useCRMStore(state => state.addEntityLocal);
  const deleteStoreEntity = useCRMStore(state => state.deleteEntityLocal);
  const markSynced = useCRMStore(state => state.markSynced);
  const dirtyIds = useCRMStore(state => state.dirtyIds);

  const config = useCRMStore(state => state.config);
  const updateModuleConfigLocal = useCRMStore(state => state.updateModuleConfigLocal);
  const setGlobalConfig = useCRMStore(state => state.setGlobalConfig);

  const getOrgId = useCallback(() => userData?.ownedOrgId || userData?.orgId, [userData]);

  const allEntities = useMemo(() => {
    return Object.values(entitiesMap)
      .filter(e => !e.isDeleted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entitiesMap]);

  // Load Config from Firestore
  useEffect(() => {
    const orgId = getOrgId();
    if (!orgId || typeof orgId !== 'string' || orgId.length < 5) return;

    const configRef = doc(db, `organizations/${orgId}/crm_config`, "main");
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as CRMConfig;
        setGlobalConfig(data);
      }
    }, (error) => {
      console.error("Config snapshot error:", error);
    });

    return () => unsubscribe();
  }, [getOrgId, setGlobalConfig]);

  // Load Entities from Firestore
  useEffect(() => {
    const orgId = getOrgId();
    if (!orgId || typeof orgId !== 'string' || orgId.length < 5) {
      if (!orgId) setLoading(false);
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
    }, (error) => {
      console.error("Entities snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [getOrgId, pageSize, setStoreEntities]);

  const syncingIdsRef = useRef<Set<string>>(new Set());

  // Sync Entities to Firestore
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

  const updateModuleConfig = async (module: keyof CRMConfig['modules'], updates: Partial<ModuleConfig>) => {
    const orgId = getOrgId();
    if (!orgId) return;

    // 1. Update local store for instant UI feedback
    updateModuleConfigLocal(module, updates);

    // 2. Sync to Firestore in background
    try {
      const configRef = doc(db, `organizations/${orgId}/crm_config`, "main");
      
      // Get the full latest config from store (after the local update above)
      // Note: Zustand state update might be async, so we manually merge for the write
      const newConfig = {
        ...config,
        modules: {
          ...config.modules,
          [module]: {
            ...config.modules[module],
            ...updates
          }
        }
      };

      await setDoc(configRef, cleanObject(newConfig), { merge: true });
    } catch (e) {
      console.error("Failed to sync CRM config:", e);
    }
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
      updateModuleConfig
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
