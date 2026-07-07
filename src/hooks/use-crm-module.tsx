'use client';

import { useMemo, useState } from "react";
import { toast } from "sonner";
// Re-export types from the central use-crm hook for other components to use
export type { CRMEntity, ModuleConfig, FieldConfig, ViewConfig } from './use-crm'; 
import { useCRM, CRMConfig, CRMEntity, ModuleConfig } from './use-crm';
import { DEFAULT_CONFIG } from "@/store/crm-types";

/**
 * GENERIC CRM MODULE HOOK (DEFINITIVE REFACTOR)
 * This hook NO LONGER fetches its own data. It acts as a lightweight wrapper around
 * the global useCRM hook, providing a consistent API for module-specific components.
 * It gets its data (config, entities, and pagination) directly from the CRMProvider context.
 */
export function useCRMModule(type: keyof CRMConfig['modules'], defaultConfig: ModuleConfig) {
  const {
    config: globalConfig,
    updateModuleConfig: globalUpdateModuleConfig,
    addEntity: globalAddEntity,
    updateEntity: globalUpdateEntity,
    deleteEntity: globalDeleteEntity,
    loading: globalLoading,
    isSyncing: globalIsSyncing,
    pageSize, // Get pagination from global hook
    setPageSize, // Get pagination from global hook
    // Pull the pre-filtered, pre-sorted entity lists from the global provider
    leads,
    deals,
    contacts,
    organizations,
    calls,
    notes,
    invoices
  } = useCRM();

  // Local state for searching/filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // A simple map to select the correct entity list based on the module's type.
  const entityMap: Record<keyof CRMConfig['modules'], CRMEntity[]> = {
    leads,
    deals,
    contacts,
    organizations,
    calls,
    notes,
    invoices
  };

  // Select the appropriate entities for this module instance.
  const allEntities = entityMap[type];
  const loading = globalLoading;

  // The module's configuration is derived from the global config with self-healing system fields.
  const config = useMemo(() => {
    let orig = globalConfig.modules[type] || defaultConfig;
    const defaultModuleConfig = DEFAULT_CONFIG.modules[type];
    
    // Self-healing: if config is empty, missing fields, or missing views, use DEFAULT_CONFIG
    if (!orig || !orig.fields || orig.fields.length === 0 || !orig.views || orig.views.length === 0) {
      orig = defaultModuleConfig || orig;
    }

    if (orig && defaultModuleConfig) {
      const origFields = orig.fields || [];
      const missingSystemFields = defaultModuleConfig.fields.filter(
        df => df.isSystem && !origFields.some(of => of.key === df.key)
      );
      let newFields = [...origFields];
      if (missingSystemFields.length > 0) {
        newFields = [...newFields, ...missingSystemFields];
      }

      let newViews = orig.views || [];
      if (defaultModuleConfig.views) {
        newViews = newViews.map(v => {
          const defaultView = defaultModuleConfig.views.find(dv => dv.type === v.type);
          if (defaultView) {
            const missingVisible = defaultView.visibleFields.filter(
              id => !v.visibleFields.includes(id)
            );
            if (missingVisible.length > 0) {
              return {
                ...v,
                visibleFields: [...v.visibleFields, ...missingVisible]
              };
            }
          }
          return v;
        });

        // Append missing views (e.g. Kanban if missing)
        const existingViewTypes = newViews.map(v => v.type);
        const missingViews = defaultModuleConfig.views.filter(dv => !existingViewTypes.includes(dv.type));
        if (missingViews.length > 0) {
          newViews = [...newViews, ...missingViews];
        }
      }

      orig = {
        ...orig,
        fields: newFields,
        views: newViews
      };
    }
    
    if (!orig) return orig;
    const fields = orig.fields || [];
    const modifiedFields = fields.map(f => {
      if (!f || !f.key) return f;
      const keyLower = f.key.toLowerCase();
      const labelLower = (f.label || "").toLowerCase();
      const isFollowUpDate = (keyLower.includes('followup') || 
                              labelLower.includes('follow up')) && 
                             !labelLower.includes('status');
      if (isFollowUpDate && f.type !== 'date') {
        return { ...f, type: 'date' as const };
      }
      return f;
    });
    let finalFields = modifiedFields;
    let finalViews = orig.views || [];
    if (type === 'leads') {
      finalFields = finalFields.filter(f => f && f.id !== 'f_owner' && f.key !== 'assignedTo');
      finalViews = finalViews.map(v => v ? {
        ...v,
        visibleFields: (v.visibleFields || []).filter(id => id !== 'f_owner')
      } : v);
    }
    return { 
      ...orig, 
      fields: finalFields,
      views: finalViews
    };
  }, [globalConfig, type, defaultConfig]);

  /**
   * FILTERED & SORTED ENTITIES
   * Applies search and sorting to the raw entity list.
   */
  const entities = useMemo(() => {
    let result = [...allEntities];

    // 1. Search Logic
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => {
        // Search in primary name
        if (e.name?.toLowerCase().includes(q)) return true;
        // Search in all data fields
        return Object.values(e.data || {}).some(val => 
          String(val).toLowerCase().includes(q)
        );
      });
    }

    // 2. Sorting Logic
    if (sortBy) {
      result.sort((a, b) => {
        const valA = a.data?.[sortBy] ?? a[sortBy as keyof CRMEntity] ?? '';
        const valB = b.data?.[sortBy] ?? b[sortBy as keyof CRMEntity] ?? '';
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        
        if (sortDirection === 'asc') return strA.localeCompare(strB);
        return strB.localeCompare(strA);
      });
    }

    return result;
  }, [allEntities, searchQuery, sortBy, sortDirection]);

  /**
   * ADD ENTITY: Wrapper around the global addEntity.
   * Automatically passes the correct 'type' for this module.
   */
  const addEntity = async (payload: { name?: string, summary?: string, data: Record<string, any> }) => {
    // BUG FIX: Convert plural module type (e.g., "leads") to singular entity type (e.g., "lead")
    const singularType = type.slice(0, -1) as CRMEntity['type'];
    // Standardize 'name' vs 'summary' based on type
    const finalData = { ...payload.data };
    if (payload.name) finalData.name = payload.name;
    if (payload.summary) finalData.summary = payload.summary;
    
    return globalAddEntity(singularType, finalData);
  };

  /**
   * UPDATE ENTITY: A direct pass-through to the global updateEntity.
   */
  const updateEntity = async (id: string, updates: Record<string, any>) => {
    return globalUpdateEntity(id, updates);
  };

  /**
   * DELETE ENTITY: A direct pass-through to the global deleteEntity.
   */
  const deleteEntity = async (id: string) => {
    return globalDeleteEntity(id);
  };

  /**
   * UPDATE CONFIG: Wrapper around the global updateModuleConfig.
   * Automatically passes the correct module type.
   */
  const updateConfig = async (updates: Partial<ModuleConfig>) => {
    try {
      // Delegate the update to the global hook
      await globalUpdateModuleConfig(type, updates);
      toast.success(`${config.name} settings saved`);
    } catch (e) {
      console.error("Config save failed:", e);
      toast.error("Config save failed");
    }
  };

  // Return the simplified, context-driven state and functions.
  return {
    entities,
    allEntities, // Raw list if needed
    config,
    loading,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    pageSize,     // Pass through pageSize
    setPageSize,  // Pass through setPageSize
    addEntity,
    updateEntity,
    deleteEntity,
    updateConfig,
    isSyncing: globalIsSyncing
  };
}
