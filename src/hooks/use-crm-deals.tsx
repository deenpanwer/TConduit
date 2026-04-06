'use client';

import { useCRMModule, ModuleConfig } from "./use-crm-module";

// This default config is now only a fallback for when the global config hasn't loaded yet.
const FALLBACK_DEALS_CONFIG: ModuleConfig = {
  name: "Deals",
  description: "Active business opportunities and money on the table.",
  fields: [],
  views: []
};

/**
 * REFACTORED: This hook now relies on the global CRMProvider for its configuration.
 */
export function useCRMDeals() {
  // It still calls the reusable module engine, but the engine is now getting its
  // config from the central useCRM hook, not from its own Firestore call.
  return useCRMModule('deals', FALLBACK_DEALS_CONFIG);
}
