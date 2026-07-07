import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CRMConfig, ModuleConfig, DEFAULT_CONFIG } from './crm-types';

export interface CRMEntity {
  id: string;
  orgId: string;
  name: string;
  type: 'lead' | 'organization' | 'contact' | 'deal' | 'call' | 'note' | 'invoice';
  data: Record<string, any>;
  history: any[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: string;
  createdDate?: string;
}

// Represents a single Firestore document change for incremental updates
export interface DocChange {
  type: 'added' | 'modified' | 'removed';
  entity: CRMEntity;
}

interface CRMStore {
  entities: Record<string, CRMEntity>; // Map for O(1) access
  config: CRMConfig;
  dirtyIds: Set<string>; // Tracking what needs to be synced
  
  // Actions
  setEntities: (entities: CRMEntity[]) => void;
  /**
   * Apply Firestore docChanges() incrementally instead of replacing the whole map.
   * This avoids allocating a fresh copy of all entities on every minor change.
   */
  applyDocChanges: (changes: DocChange[]) => void;
  updateEntityLocal: (id: string, updates: Partial<CRMEntity> | { data: Record<string, any> }) => void;
  addEntityLocal: (entity: CRMEntity) => void;
  markSynced: (id: string) => void;
  deleteEntityLocal: (id: string) => void;
  
  // Config Actions
  updateModuleConfigLocal: (module: keyof CRMConfig['modules'], updates: Partial<ModuleConfig>) => void;
  setGlobalConfig: (config: CRMConfig) => void;
  
  // Selectors
  getEntitiesArray: () => CRMEntity[];
  getEntity: (id: string) => CRMEntity | undefined;
}

export const useCRMStore = create<CRMStore>()(
  persist(
    (set, get) => ({
      entities: {},
      config: DEFAULT_CONFIG,
      dirtyIds: new Set(),

      setEntities: (entitiesArray) => {
        const entityMap: Record<string, CRMEntity> = {};
        entitiesArray.forEach(e => {
          entityMap[e.id] = e;
        });
        set({ entities: entityMap });
      },

      /**
       * Incremental update using Firestore's docChanges().
       * Only touches the changed entries in the map — avoids full object spread.
       * This is the primary update path after the initial load.
       */
      applyDocChanges: (changes) => {
        if (changes.length === 0) return;
        set((state) => {
          // Shallow-clone the map so React detects a change, but only for entries that changed
          const newEntities = { ...state.entities };
          let hasAnyChange = false;

          for (const change of changes) {
            const { type, entity } = change;
            if (type === 'added' || type === 'modified') {
              // Skip if this entity is in our local dirty set (we own this write)
              if (state.dirtyIds.has(entity.id)) continue;
              newEntities[entity.id] = entity;
              hasAnyChange = true;
            } else if (type === 'removed') {
              if (entity.id in newEntities) {
                delete newEntities[entity.id];
                hasAnyChange = true;
              }
            }
          }

          if (!hasAnyChange) return state;
          return { entities: newEntities };
        });
      },

      updateEntityLocal: (id, updates) => {
        set((state) => {
          const entity = state.entities[id];
          if (!entity) return state;

          const newEntities = { ...state.entities };
          const newDirtyIds = new Set(state.dirtyIds);
          
          // Deep merge for 'data' object
          const updatedData = 'data' in updates 
            ? { ...entity.data, ...updates.data }
            : entity.data;

          newEntities[id] = {
            ...entity,
            ...updates,
            data: updatedData,
            updatedAt: new Date().toISOString()
          };
          
          newDirtyIds.add(id);

          return { entities: newEntities, dirtyIds: newDirtyIds };
        });
      },

      addEntityLocal: (entity) => {
        set((state) => ({
          entities: { ...state.entities, [entity.id]: entity },
          dirtyIds: new Set(state.dirtyIds).add(entity.id)
        }));
      },

      markSynced: (id) => {
        set((state) => {
          const newDirtyIds = new Set(state.dirtyIds);
          newDirtyIds.delete(id);
          return { dirtyIds: newDirtyIds };
        });
      },

      deleteEntityLocal: (id) => {
        set((state) => {
          const newEntities = { ...state.entities };
          delete newEntities[id];
          const newDirtyIds = new Set(state.dirtyIds);
          newDirtyIds.delete(id);
          return { entities: newEntities, dirtyIds: newDirtyIds };
        });
      },

      updateModuleConfigLocal: (module, updates) => {
        set((state) => ({
          config: {
            ...state.config,
            modules: {
              ...state.config.modules,
              [module]: {
                ...state.config.modules[module],
                ...updates
              }
            }
          }
        }));
      },

      setGlobalConfig: (config) => set({ config }),

      getEntitiesArray: () => {
        return Object.values(get().entities).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      getEntity: (id) => get().entities[id],
    }),
    {
      name: 'trac-crm-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist both entities and config
      partialize: (state) => ({ entities: state.entities, config: state.config }),
    }
  )
);
