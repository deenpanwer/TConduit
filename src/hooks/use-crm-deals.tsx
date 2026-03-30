'use client';

import { useCRMModule, ModuleConfig } from "./use-crm-module";

const DEFAULT_DEALS_CONFIG: ModuleConfig = {
  name: "Deals",
  description: "Active business opportunities.",
  fields: [
    { id: 'd1', key: 'name', label: 'Deal Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
    { id: 'd_org', key: 'organization', label: 'Organization Name', type: 'text', isSystem: true, isVisible: true, order: 1 },
    { id: 'd_web', key: 'website', label: 'Website', type: 'text', isSystem: true, isVisible: true, order: 2 },
    { id: 'd_rev', key: 'annualRevenue', label: 'Annual Revenue', type: 'currency', isSystem: true, isVisible: true, order: 3 },
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
    { id: 'dv2', name: 'All Deals', type: 'list', visibleFields: ['d_org', 'd_status', 'd_rev'] },
  ]
};

export function useCRMDeals() {
  return useCRMModule('deals', DEFAULT_DEALS_CONFIG);
}
