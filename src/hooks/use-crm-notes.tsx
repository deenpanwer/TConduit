'use client';

import { useCRMModule, ModuleConfig } from "./use-crm-module";

const DEFAULT_NOTES_CONFIG: ModuleConfig = {
  name: "Notes",
  description: "Private thoughts and records.",
  fields: [
    { id: 'n1', key: 'name', label: 'Note Title', type: 'text', isSystem: true, isVisible: true, order: 0 },
    { id: 'n2', key: 'content', label: 'Actual Note', type: 'textarea', isSystem: true, isVisible: true, order: 1 },
    { id: 'n3', key: 'relatedTo', label: 'Related To', type: 'text', isSystem: true, isVisible: true, order: 2 },
  ],
  views: [
    { id: 'nv1', name: 'Grid', type: 'kanban', visibleFields: ['n1', 'n2', 'n3'], kanbanFieldId: 'n3' },
    { id: 'nv2', name: 'List', type: 'list', visibleFields: ['n1', 'n3'] },
  ]
};

export function useCRMNotes() {
  return useCRMModule('notes', DEFAULT_NOTES_CONFIG);
}
