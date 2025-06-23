import { create } from 'zustand';

export const useInviteModalStore = create<{
  openInviteModal: boolean;
  onToggleInviteModal: (v?: boolean) => void;
}>((set, get) => ({
  openInviteModal: false,
  onToggleInviteModal: (v?: boolean) => set({ openInviteModal: v ?? !get().openInviteModal })
}));
