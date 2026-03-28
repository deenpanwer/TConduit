'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  arrayUnion
} from "firebase/firestore";

export interface FieldConfig {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'currency' | 'email' | 'phone' | 'textarea';
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
  };
}

export interface EntityHistory {
  id: string;
  type: 'Note' | 'Email' | 'Call' | 'Task' | 'Comment' | 'System';
  action: string;
  content: string;
  userId: string;
  userName?: string;
  timestamp: string | any; // Any for Firebase ServerTimestamp
  details?: any;
}

export interface CRMEntity {
  id: string;
  orgId: string;
  name: string;
  type: 'lead' | 'organization' | 'contact' | 'deal' | 'call' | 'note';
  data: Record<string, any>;
  history: EntityHistory[];
  isDeleted: boolean;
  createdAt: string | any;
  updatedAt: string | any;
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
  config: CRMConfig;
  loading: boolean;
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
        { id: 'f_sal', key: 'salutation', label: 'Salutation', type: 'select', isSystem: true, isVisible: true, order: 0, options: [
          { label: 'Mr', value: 'Mr' },
          { label: 'Ms', value: 'Ms' },
          { label: 'Mrs', value: 'Mrs' },
          { label: 'Dr', value: 'Dr' },
          { label: 'Prof', value: 'Prof' },
        ]},
        { id: 'f1', key: 'firstName', label: 'First Name', type: 'text', isSystem: true, isVisible: true, order: 1 },
        { id: 'f_last', key: 'lastName', label: 'Last Name', type: 'text', isSystem: true, isVisible: true, order: 2 },
        { id: 'f3', key: 'email', label: 'Email', type: 'email', isSystem: true, isVisible: true, order: 3 },
        { id: 'f_mob', key: 'mobile', label: 'Mobile No.', type: 'phone', isSystem: true, isVisible: true, order: 4 },
        { id: 'f2', key: 'company', label: 'Organization', type: 'text', isSystem: true, isVisible: true, order: 5 },
        { id: 'f_ind', key: 'industry', label: 'Industry', type: 'text', isSystem: true, isVisible: true, order: 6 },
        { id: 'f_web', key: 'website', label: 'Website', type: 'text', isSystem: true, isVisible: true, order: 7 },
        { id: 'f_job', key: 'jobTitle', label: 'Job Title', type: 'text', isSystem: true, isVisible: true, order: 8 },
        { id: 'f_src', key: 'source', label: 'Source', type: 'text', isSystem: true, isVisible: true, order: 9 },
        { id: 'f5', key: 'status', label: 'Stage', type: 'select', isSystem: true, isVisible: true, order: 10, options: [
          { label: 'New', value: 'new', color: 'blue' },
          { label: 'Talking', value: 'contacted', color: 'yellow' },
          { label: 'Qualified', value: 'qualified', color: 'purple' },
        ]},{ id: 'f6', key: 'priority', label: 'Urgency', type: 'select', isSystem: true, isVisible: true, order: 11, options: [
          { label: 'Low', value: 'low', color: 'gray' },
          { label: 'Medium', value: 'medium', color: 'orange' },
          { label: 'High', value: 'high', color: 'red' },
        ]},
      ],
      views: [
        { id: 'v1', name: 'Board', type: 'kanban', visibleFields: ['f1', 'f_last', 'f2', 'f6'], kanbanFieldId: 'f5' },
        { id: 'v2', name: 'List', type: 'list', visibleFields: ['f1', 'f_last', 'f2', 'f5', 'f6'] },
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
        { id: 'd_ind', key: 'industry', label: 'Industry', type: 'text', isSystem: true, isVisible: true, order: 5 },
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
        { id: 'o5', key: 'industry', label: 'Industry', type: 'text', isSystem: true, isVisible: true, order: 4 },
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
        { id: 'c1', key: 'name', label: 'Full Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'c2', key: 'email', label: 'Email', type: 'email', isSystem: true, isVisible: true, order: 1 },
      ],
      views: [
        { id: 'cv1', name: 'Directory', type: 'list', visibleFields: ['c1', 'c2'] },
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
          { id: 'cl_related_to', key: 'related_to', label: 'Related To', type: 'select', isSystem: false, isVisible: true, order: 6 },
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
    }
  }
};

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const { user, userData } = useAuth();
  const [entities, setEntities] = useState<CRMEntity[]>([]);
  const [config, setConfig] = useState<CRMConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  // Helper to get active orgId
  const getOrgId = useCallback(() => {
    return userData?.ownedOrgId || userData?.orgId;
  }, [userData]);

  useEffect(() => {
    const orgId = getOrgId();
    if (!orgId) {
      setEntities([]);
      return;
    }

    setLoading(true);

    // 1. Listen to Config
    const configRef = doc(db, `organizations/${orgId}/crm_config`, 'main');
    const unsubscribeConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const storedConfig = docSnap.data() as CRMConfig;
        const merged = { ...DEFAULT_CONFIG };
        
        Object.keys(merged.modules).forEach(key => {
          const k = key as keyof CRMConfig['modules'];
          if (storedConfig.modules[k]) {
              const defaultFieldKeys = new Set(merged.modules[k].fields.map(f => f.key));
              const customFields = (storedConfig.modules[k].fields || []).filter((f: FieldConfig) => !defaultFieldKeys.has(f.key) && !f.isSystem);

              const updatedFields = merged.modules[k].fields.map(sysField => {
                  const storedField = (storedConfig.modules[k].fields || []).find((f: FieldConfig) => f.key === sysField.key);
                  if (storedField) {
                      return {
                          ...sysField,
                          isVisible: storedField.isVisible,
                          order: storedField.order,
                          options: sysField.options
                      };
                  }
                  return sysField;
              });

              const newFields = [...updatedFields, ...customFields].sort((a, b) => a.order - b.order);
              const allFieldIds = new Set(newFields.map(f => f.id));

              const defaultViews = merged.modules[k].views;
              const storedViews = storedConfig.modules[k].views || [];

              const mergedViews = defaultViews.map(defaultView => {
                  const storedView = storedViews.find((v: ViewConfig) => v.id === defaultView.id);
                  if (storedView) {
                      const visibleFieldSet = new Set([
                          ...defaultView.visibleFields,
                          ...storedView.visibleFields
                      ]);

                      const finalVisibleFields = [...visibleFieldSet].filter(id => allFieldIds.has(id));
                      
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

    // 2. Listen to Entities
    const entitiesRef = collection(db, `organizations/${orgId}/crm_entities`);
    const q = query(entitiesRef, where("isDeleted", "==", false));
    const unsubscribeEntities = onSnapshot(q, (querySnapshot) => {
      const docs: CRMEntity[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firebase timestamps to ISO strings for UI consistency or keep as is
        docs.push({ 
          ...data, 
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          history: (data.history || []).map((h: any) => ({
            ...h,
            timestamp: h.timestamp instanceof Timestamp ? h.timestamp.toDate().toISOString() : h.timestamp
          }))
        } as CRMEntity);
      });
      setEntities(docs);
      setLoading(false);
    }, (error) => {
      console.error("CRM Entities listener failed:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeEntities();
    };
  }, [getOrgId]);

  const addEntity = async (type: CRMEntity['type'], data: Record<string, any>): Promise<string | null> => {
    const orgId = getOrgId();
    if (!orgId || !user) return null;

    try {
      const entitiesRef = collection(db, `organizations/${orgId}/crm_entities`);
      
      const newEntityData = {
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
          timestamp: new Date().toISOString(), // Use local for immediate history display or ServerTimestamp if preferred
        }]
      };

      const docRef = await addDoc(entitiesRef, newEntityData);
      return docRef.id;
    } catch (e) {
      console.error("Error adding CRM entity:", e);
      toast.error("Failed to add entity");
      return null;
    }
  };

  const updateEntity = async (id: string, updates: Record<string, any>, action: string = "updated") => {
    const orgId = getOrgId();
    if (!orgId || !user) return;

    try {
      const entityRef = doc(db, `organizations/${orgId}/crm_entities`, id);
      
      const historyEntry: EntityHistory = {
        id: crypto.randomUUID(),
        type: 'System',
        action,
        content: `Entity updated`,
        userId: user.uid,
        userName: userData?.name || user.displayName || "User",
        timestamp: new Date().toISOString(),
        details: updates
      };

      // Prepare updates
      const firestoreUpdates: any = {
        updatedAt: serverTimestamp(),
        lastEditedBy: user.uid,
        history: arrayUnion(historyEntry)
      };

      // Map data updates
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'name' || key === 'summary') {
          firestoreUpdates.name = value;
        }
        if (key === 'isDeleted') {
          firestoreUpdates.isDeleted = value;
        }
        firestoreUpdates[`data.${key}`] = value;
      });

      await updateDoc(entityRef, firestoreUpdates);
    } catch (e) {
      console.error("Error updating CRM entity:", e);
      toast.error("Update failed");
    }
  };

  const updateEntityField = async (id: string, fieldKey: string, value: any) => {
    await updateEntity(id, { [fieldKey]: value }, `updated_${fieldKey}`);
  };

  const addActivity = async (entityId: string, activity: { type: EntityHistory['type'], content: string, details?: any }) => {
    const orgId = getOrgId();
    if (!orgId || !user) return;
    
    try {
      const entityRef = doc(db, `organizations/${orgId}/crm_entities`, entityId);
      const historyEntry: EntityHistory = {
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
        history: arrayUnion(historyEntry)
      });
    } catch (e) {
      console.error("Error adding CRM activity:", e);
    }
  };

  const deleteEntity = async (id: string, hardDelete: boolean = false) => {
    const orgId = getOrgId();
    if (!orgId || !user) return;

    try {
      const entityRef = doc(db, `organizations/${orgId}/crm_entities`, id);
      if (hardDelete) {
        await deleteDoc(entityRef);
        toast.success("Entity permanently deleted");
      } else {
        await updateEntity(id, { isDeleted: true }, "archived");
        toast.success("Entity moved to trash");
      }
    } catch (e) {
      console.error("Error deleting CRM entity:", e);
      toast.error("Delete failed");
    }
  };

  const restoreEntity = async (id: string) => {
    await updateEntity(id, { isDeleted: false }, "restored");
    toast.success("Entity restored");
  };

  const updateModuleConfig = async (module: keyof CRMConfig['modules'], updates: Partial<ModuleConfig>) => {
    const orgId = getOrgId();
    if (!orgId) return;

    try {
      const configRef = doc(db, `organizations/${orgId}/crm_config`, 'main');
      const newModuleConfig = { ...config.modules[module], ...updates };
      
      await setDoc(configRef, {
        modules: {
          ...config.modules,
          [module]: newModuleConfig
        }
      }, { merge: true });
      
      toast.success(`${config.modules[module].name} configuration updated`);
    } catch (e) {
      console.error("Error updating CRM config:", e);
      toast.error("Failed to save configuration");
    }
  };

  return (
    <CRMContext.Provider value={{ 
      entities, 
      leads: entities.filter(e => e.type === 'lead' && !e.isDeleted),
      organizations: entities.filter(e => e.type === 'organization' && !e.isDeleted),
      contacts: entities.filter(e => e.type === 'contact' && !e.isDeleted),
      deals: entities.filter(e => e.type === 'deal' && !e.isDeleted),
      calls: entities.filter(e => e.type === 'call' && !e.isDeleted),
      notes: entities.filter(e => e.type === 'note' && !e.isDeleted),
      config, 
      loading, 
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
}