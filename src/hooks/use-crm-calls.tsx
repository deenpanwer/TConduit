'use client';

import { useCRMModule, ModuleConfig } from "./use-crm-module";

// This default config is now only a fallback for when the global config hasn't loaded yet.
const FALLBACK_CALLS_CONFIG: ModuleConfig = {
    name: "Phone Calls",
    description: "Logs of interactions.",
    fields: [
      { id: 'cl_summary', key: 'summary', label: 'Summary', type: 'text', isSystem: true, isVisible: true, order: 0 },
      { id: 'cl_type', key: 'type', label: 'Type', type: 'select', isSystem: true, isVisible: true, order: 1, options: [
        { label: 'Incoming', value: 'Incoming', color: 'blue' },
        { label: 'Outgoing', value: 'Outgoing', color: 'green' },
      ]},
      { id: 'cl_from', key: 'from', label: 'From', type: 'text', isSystem: true, isVisible: true, order: 2 },
      { id: 'cl_to', key: 'to', label: 'To', type: 'text', isSystem: true, isVisible: true, order: 3 },
      { id: 'cl_duration', key: 'duration', label: 'Duration', type: 'text', isSystem: true, isVisible: true, order: 4 },
      { id: 'cl_status', key: 'status', label: 'Status', type: 'select', isSystem: true, isVisible: true, order: 5, options: [
        { label: 'Initiated', value: 'initiated', color: 'gray' },
        { label: 'Completed', value: 'completed', color: 'green' },
        { label: 'Failed', value: 'failed', color: 'red' },
      ]},
      { id: 'cl_related_to', key: 'relatedTo', label: 'Related To', type: 'text', isSystem: true, isVisible: true, order: 6 },
    ],
    views: [
      { id: 'cv1', name: 'Call History', type: 'list', visibleFields: ['cl_summary', 'cl_type', 'cl_status'] },
    ]
};

/**
 * REFACTORED: This hook now relies on the global CRMProvider for its configuration.
 */
export function useCRMCalls() {
  return useCRMModule('calls', FALLBACK_CALLS_CONFIG);
}
