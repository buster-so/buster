import { create } from 'zustand';

export const useDashboardContentStore = create<{
  openAddContentModal: boolean;
  onCloseAddContentModal: () => void;
  onOpenAddContentModal: () => void;
}>((set) => ({
  openAddContentModal: false,
  onCloseAddContentModal: () => set({ openAddContentModal: false }),
  onOpenAddContentModal: () => set({ openAddContentModal: true })
}));
