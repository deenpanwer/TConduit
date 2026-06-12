import { create } from 'zustand';

export interface ErrorUserMeta {
  uid?: string;
  name?: string;
  email?: string;
  role?: string;
  orgId?: string;
  companyName?: string;
}

interface ErrorReportState {
  isOpen: boolean;
  errorMessage: string;
  stackTrace?: string;
  userMeta?: ErrorUserMeta;
  openReport: (errorMessage: string, stackTrace?: string, userMeta?: ErrorUserMeta) => void;
  closeReport: () => void;
}

export const useErrorReportStore = create<ErrorReportState>((set) => ({
  isOpen: false,
  errorMessage: '',
  stackTrace: undefined,
  userMeta: undefined,
  openReport: (errorMessage, stackTrace, userMeta) =>
    set({ isOpen: true, errorMessage, stackTrace, userMeta }),
  closeReport: () => set({ isOpen: false, errorMessage: '', stackTrace: undefined, userMeta: undefined }),
}));
