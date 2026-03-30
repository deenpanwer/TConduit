'use client';

import { useCRMModule, ModuleConfig } from "./use-crm-module";

const DEFAULT_ORGS_CONFIG: ModuleConfig = {
  name: "Organizations",
  description: "Companies you do business with.",
  fields: [
    { id: 'o1', key: 'organizationName', label: 'Organization Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
    { id: 'o2', key: 'website', label: 'Website', type: 'text', isSystem: true, isVisible: true, order: 1 },
    { id: 'o3', key: 'annualRevenue', label: 'Annual Revenue', type: 'currency', isSystem: true, isVisible: true, order: 2 },
  ],
  views: [
    { id: 'ov1', name: 'All Organizations', type: 'list', visibleFields: ['o1', 'o2', 'o3'] },
  ]
};

export function useCRMOrganizations() {
  return useCRMModule('organizations', DEFAULT_ORGS_CONFIG);
}
