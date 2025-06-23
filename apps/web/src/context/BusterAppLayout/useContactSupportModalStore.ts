import { create } from 'zustand';

export const useContactSupportModalStore = create<{
  onOpenContactSupportModal: (v: 'feedback' | 'help' | false) => void;
  formType: 'feedback' | 'help' | false;
}>((set, get) => ({
  formType: false,
  onOpenContactSupportModal: (v: 'feedback' | 'help' | false) => set({ formType: v })
}));
