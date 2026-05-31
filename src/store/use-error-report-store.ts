import { create } from 'zustand';

interface ErrorReportState {
  isOpen: boolean;
  errorMessage: string;
  stackTrace?: string;
  openReport: (errorMessage: string, stackTrace?: string) => void;
  closeReport: () => void;
}

export const useErrorReportStore = create<ErrorReportState>((set) => ({
  isOpen: false,
  errorMessage: '',
  stackTrace: undefined,
  openReport: (errorMessage, stackTrace) =>
    set({ isOpen: true, errorMessage, stackTrace }),
  closeReport: () => set({ isOpen: false, errorMessage: '', stackTrace: undefined }),
}));
