import { create } from 'zustand';

export interface LeadFinderLead {
  id: number;
  "First Name": string | null;
  "Last Name": string | null;
  "Title": string | null;
  "Company Name": string | null;
  "Mailing Address": string | null;
  "Primary City": string | null;
  "Primary State": string | null;
  "ZIP Code": string | null;
  "Country": string | null;
  "Phone": string | null;
  "Web Address": string | null;
  "Email": string | null;
  "Revenue": string | null;
  "Employee": string | null;
  "Industry": string | null;
  "Sub Industry": string | null;
  is_processed: boolean | null;
  regex_valid: boolean | null;
  mx_check_passed: boolean | null;
  smtp_status: string | null;
  last_checked_at: string | null;
  processing_status: string | null;
  retry_count: number | null;
  error_log: string | null;
  domain: string | null;
  next_retry_at: string | null;
  
  // Collaborative outreach details
  isCalled?: boolean;
  calledBy?: string | null;
  calledAt?: string | null;
  
  // Collaborative deal details
  isDeal?: boolean;
  dealId?: string | null;
  dealCreatedBy?: string | null;
  dealCreatedAt?: string | null;
}

interface LeadFinderStore {
  leads: LeadFinderLead[];
  isLoading: boolean;
  error: string | null;
  addLeads: (newLeads: LeadFinderLead[], orgId?: string) => Promise<void>;
  deleteLeadLocal: (id: number, orgId?: string) => Promise<void>;
  clearStore: (orgId?: string) => Promise<void>;
  toggleCallStatus: (id: number, isCalled: boolean, operatorName: string, orgId?: string) => Promise<void>;
  convertToDeal: (id: number, dealId: string, operatorName: string, orgId?: string) => Promise<void>;
  loadRosterFromServer: (orgId: string) => Promise<void>;
  saveRosterToServer: (orgId: string) => Promise<void>;
}

export const useLeadFinderStore = create<LeadFinderStore>((set) => ({
  leads: [],
  isLoading: false,
  error: null,

  addLeads: async (newLeads, orgId) => {
    set((state) => {
      const existingIds = new Set(state.leads.map((l) => l.id));
      const filteredNew = newLeads.filter((l) => !existingIds.has(l.id));
      return {
        leads: [...state.leads, ...filteredNew],
      };
    });

    if (orgId) {
      const store = useLeadFinderStore.getState();
      await store.saveRosterToServer(orgId);
    }
  },

  deleteLeadLocal: async (id, orgId) => {
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== id),
    }));

    if (orgId) {
      const store = useLeadFinderStore.getState();
      await store.saveRosterToServer(orgId);
    }
  },

  clearStore: async (orgId) => {
    set({ leads: [] });

    if (orgId) {
      const store = useLeadFinderStore.getState();
      await store.saveRosterToServer(orgId);
    }
  },

  toggleCallStatus: async (id, isCalled, operatorName, orgId) => {
    set((state) => ({
      leads: state.leads.map((l) => 
        l.id === id 
          ? { 
              ...l, 
              isCalled, 
              calledBy: isCalled ? operatorName : null, 
              calledAt: isCalled ? new Date().toISOString() : null 
            } 
          : l
      ),
    }));

    if (orgId) {
      const store = useLeadFinderStore.getState();
      await store.saveRosterToServer(orgId);
    }
  },

  convertToDeal: async (id, dealId, operatorName, orgId) => {
    set((state) => ({
      leads: state.leads.map((l) => 
        l.id === id 
          ? { 
              ...l, 
              isDeal: true, 
              dealId, 
              dealCreatedBy: operatorName, 
              dealCreatedAt: new Date().toISOString() 
            } 
          : l
      ),
    }));

    if (orgId) {
      const store = useLeadFinderStore.getState();
      await store.saveRosterToServer(orgId);
    }
  },

  loadRosterFromServer: async (orgId) => {
    if (!orgId) return;
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/lead-finder/roster?orgId=${orgId}`);
      if (!response.ok) throw new Error("Failed to load collaborative roster from server");
      
      const data = await response.json();
      if (Array.isArray(data)) {
        set({ leads: data, isLoading: false });
      } else if (data && Array.isArray(data.importedLeads)) {
        set({ leads: data.importedLeads, isLoading: false });
      } else {
        set({ leads: [], isLoading: false });
      }
    } catch (err: any) {
      console.warn("[Lead Finder Store] error loading roster:", err.message);
      set({ error: err.message, isLoading: false });
    }
  },

  saveRosterToServer: async (orgId) => {
    if (!orgId) return;
    const { leads } = useLeadFinderStore.getState();
    try {
      const response = await fetch("/api/lead-finder/roster", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orgId, leads }),
      });
      if (!response.ok) throw new Error("Failed to save collaborative roster to server");
    } catch (err: any) {
      console.error("[Lead Finder Store] error saving roster:", err.message);
      set({ error: err.message });
    }
  },
}));
