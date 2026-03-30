'use client';

import { useMemo } from "react";
import { toast } from "sonner";
// Re-export types from the central use-crm hook for other components to use
export type { CRMEntity, ModuleConfig, FieldConfig, ViewConfig } from './use-crm'; 
import { useCRM, CRMConfig, CRMEntity, ModuleConfig } from './use-crm';

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
    pageSize, // Get pagination from global hook
    setPageSize, // Get pagination from global hook
    // Pull the pre-filtered, pre-sorted entity lists from the global provider
    leads,
    deals,
    contacts,
    organizations,
    calls,
    notes
  } = useCRM();

  // A simple map to select the correct entity list based on the module's type.
  const entityMap: Record<keyof CRMConfig['modules'], CRMEntity[]> = {
    leads,
    deals,
    contacts,
    organizations,
    calls,
    notes
  };

  // Select the appropriate entities for this module instance.
  const entities = entityMap[type];
  const loading = globalLoading;

  // The module's configuration is derived from the global config.
  const config = useMemo(() => {
    return globalConfig.modules[type] || defaultConfig;
  }, [globalConfig, type, defaultConfig]);

  /**
   * ADD ENTITY: Wrapper around the global addEntity.
   * Automatically passes the correct 'type' for this module.
   */
  const addEntity = async (payload: { name?: string, summary?: string, data: Record<string, any> }) => {
    // BUG FIX: Convert plural module type (e.g., "leads") to singular entity type (e.g., "lead")
    const singularType = type.slice(0, -1) as CRMEntity['type'];
    return globalAddEntity(singularType, payload);
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
    config,
    loading,
    pageSize,     // Pass through pageSize
    setPageSize,  // Pass through setPageSize
    addEntity,
    updateEntity,
    deleteEntity,
    updateConfig
  };
}
