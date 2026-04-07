'use client';

import { useCRMModule, ModuleConfig } from "./use-crm-module";

// This default config is now only a fallback for when the global config hasn't loaded yet.
const FALLBACK_CONTACTS_CONFIG: ModuleConfig = {
  name: "Contacts",
  description: "Individual people.",
  fields: [
    { id: 'c_sal', key: 'salutation', label: 'Salutation', type: 'select', isSystem: true, isVisible: true, order: 0, options: [
      { label: 'Mr', value: 'Mr' }, { label: 'Ms', value: 'Ms' }, { label: 'Mrs', value: 'Mrs' }, { label: 'Dr', value: 'Dr' }, { label: 'Prof', value: 'Prof' },
    ]},
    { id: 'c1', key: 'firstName', label: 'First Name', type: 'text', isSystem: true, isVisible: true, order: 1 },
    { id: 'c_last', key: 'lastName', label: 'Last Name', type: 'text', isSystem: true, isVisible: true, order: 2 },
    { id: 'c3', key: 'email', label: 'Email', type: 'email', isSystem: true, isVisible: true, order: 3 },
    { id: 'c_mob', key: 'mobile', label: 'Mobile No', type: 'phone', isSystem: true, isVisible: true, order: 4 },
  ],
  views: [
    { id: 'cv1', name: 'All Contacts', type: 'list', visibleFields: ['c1', 'c_last', 'c3', 'c_mob'] },
  ]
};

/**
 * REFACTORED: This hook now relies on the global CRMProvider for its configuration.
 */
export function useCRMContacts() {
  return useCRMModule('contacts', FALLBACK_CONTACTS_CONFIG);
}
