export interface FieldConfig {
  id: string;
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'select' | 'date' | 'currency' | 'email' | 'phone' | 'textarea' | 'checkbox' | 'timeline' | 'link' | 'people' | 'label' | 'file';
  isSystem: boolean;
  isVisible: boolean;
  order: number;
  options?: { label: string; value: string; color?: string }[];
}

export interface ViewConfig {
  id: string;
  name: string;
  type: 'kanban' | 'list';
  visibleFields: string[];
  kanbanFieldId?: string;
  sortBy?: { fieldId: string; direction: 'asc' | 'desc' };
}

export interface ModuleConfig {
  name: string;
  description: string;
  fields: FieldConfig[];
  views: ViewConfig[];
}

export interface CRMConfig {
  modules: {
    leads: ModuleConfig;
    organizations: ModuleConfig;
    contacts: ModuleConfig;
    deals: ModuleConfig;
    calls: ModuleConfig;
    notes: ModuleConfig;
    invoices: ModuleConfig;
  };
}

export const DEFAULT_CONFIG: CRMConfig = {
  modules: {
    leads: {
      name: "Leads",
      description: "People who might buy from you but aren't customers yet.",
      fields: [
        { id: 'f1', key: 'firstName', label: 'First Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'f_last', key: 'lastName', label: 'Last Name', type: 'text', isSystem: true, isVisible: true, order: 1 },
        { id: 'f2', key: 'company', label: 'Organization', type: 'text', isSystem: true, isVisible: true, order: 2 },
        { id: 'f5', key: 'status', label: 'Status', type: 'select', isSystem: true, isVisible: true, order: 3, options: [
          { label: 'New', value: 'new', color: 'blue' },
          { label: 'Talking', value: 'contacted', color: 'yellow' },
          { label: 'Qualified', value: 'qualified', color: 'purple' },
        ]},
        { id: 'f6', key: 'priority', label: 'Priority', type: 'select', isSystem: true, isVisible: true, order: 4, options: [
          { label: 'Low', value: 'low', color: 'gray' },
          { label: 'Medium', value: 'medium', color: 'orange' },
          { label: 'High', value: 'high', color: 'red' },
        ]},
        { id: 'f_val', key: 'estimatedValue', label: 'Est. Value', type: 'currency', isSystem: true, isVisible: true, order: 5 },
      ],
      views: [
        { id: 'v2', name: 'List', type: 'list', visibleFields: ['f1', 'f_last', 'f2', 'f5', 'f6', 'f_val'] },
      ]
    },
    deals: {
      name: "Deals",
      description: "Active business opportunities.",
      fields: [
        { id: 'd1', key: 'name', label: 'Deal Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'd_org', key: 'organization', label: 'Organization', type: 'text', isSystem: true, isVisible: true, order: 1 },
        { id: 'd_rev', key: 'annualRevenue', label: 'Value', type: 'currency', isSystem: true, isVisible: true, order: 2 },
        { id: 'd_status', key: 'status', label: 'Status', type: 'select', isSystem: true, isVisible: true, order: 3, options: [
          { label: 'Qualification', value: 'qualification', color: 'blue' },
          { label: 'Negotiation', value: 'negotiation', color: 'purple' },
          { label: 'Won', value: 'won', color: 'green' },
          { label: 'Lost', value: 'lost', color: 'red' },
        ]},
      ],
      views: [
        { id: 'dv2', name: 'All Deals', type: 'list', visibleFields: ['d1', 'd_org', 'd_rev', 'd_status'] },
      ]
    },
    organizations: {
      name: "Organizations",
      description: "Companies you do business with.",
      fields: [
        { id: 'o1', key: 'name', label: 'Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'o2', key: 'website', label: 'Website', type: 'link', isSystem: true, isVisible: true, order: 1 },
        { id: 'o3', key: 'industry', label: 'Industry', type: 'select', isSystem: true, isVisible: true, order: 2, options: [
          { label: 'Tech', value: 'tech' }, { label: 'Finance', value: 'finance' }, { label: 'Retail', value: 'retail' }
        ]},
      ],
      views: [
        { id: 'ov1', name: 'All Organizations', type: 'list', visibleFields: ['o1', 'o2', 'o3'] },
      ]
    },
    contacts: {
      name: "Contacts",
      description: "People at the companies.",
      fields: [
        { id: 'c1', key: 'firstName', label: 'First Name', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'c2', key: 'lastName', label: 'Last Name', type: 'text', isSystem: true, isVisible: true, order: 1 },
        { id: 'c3', key: 'email', label: 'Email', type: 'email', isSystem: true, isVisible: true, order: 2 },
        { id: 'c4', key: 'mobile', label: 'Phone', type: 'phone', isSystem: true, isVisible: true, order: 3 },
      ],
      views: [
        { id: 'cv1', name: 'List', type: 'list', visibleFields: ['c1', 'c2', 'c3', 'c4'] },
      ]
    },
    calls: { 
      name: "Calls", 
      description: "Logs of interactions.", 
      fields: [
        { id: 'cl_summary', key: 'summary', label: 'Summary', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'cl_type', key: 'type', label: 'Type', type: 'select', isSystem: true, isVisible: true, order: 1, options: [
          { label: 'Incoming', value: 'Incoming', color: 'blue' },
          { label: 'Outgoing', value: 'Outgoing', color: 'green' },
        ]},
        { id: 'cl_status', key: 'status', label: 'Status', type: 'select', isSystem: true, isVisible: true, order: 2, options: [
          { label: 'Initiated', value: 'initiated', color: 'gray' },
          { label: 'Completed', value: 'completed', color: 'green' },
          { label: 'Failed', value: 'failed', color: 'red' },
        ]},
      ], 
      views: [
        { id: 'clv1', name: 'List', type: 'list', visibleFields: ['cl_summary', 'cl_type', 'cl_status'] },
      ] 
    },
    notes: { 
      name: "Notes", 
      description: "Thoughts and records.", 
      fields: [
        { id: 'n1', key: 'name', label: 'Title', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'n2', key: 'content', label: 'Content', type: 'textarea', isSystem: true, isVisible: true, order: 1 },
      ], 
      views: [
        { id: 'nv1', name: 'List', type: 'list', visibleFields: ['n1', 'n2'] },
      ] 
    },
    invoices: { 
      name: "Invoices", 
      description: "Billing", 
      fields: [
        { id: 'inv1', key: 'invoiceNumber', label: 'Invoice #', type: 'text', isSystem: true, isVisible: true, order: 0 },
        { id: 'inv3', key: 'amount', label: 'Amount', type: 'currency', isSystem: true, isVisible: true, order: 1 },
        { id: 'inv4', key: 'status', label: 'Status', type: 'select', isSystem: true, isVisible: true, order: 2, options: [
          { label: 'Draft', value: 'draft', color: 'gray' },
          { label: 'Paid', value: 'paid', color: 'green' },
        ]},
      ], 
      views: [
        { id: 'invv1', name: 'List', type: 'list', visibleFields: ['inv1', 'inv3', 'inv4'] },
      ] 
    },
  }
};
