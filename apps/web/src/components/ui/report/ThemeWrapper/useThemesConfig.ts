import { create } from 'zustand';
import { THEMES, type Theme } from './themes';

const useThemesConfigStore = create<{
  activeTheme: Theme;
  setActiveTheme: (activeTheme: Theme) => void;
}>((set) => ({
  activeTheme: THEMES['default-shadcn'],
  setActiveTheme: (activeTheme) => set({ activeTheme })
}));

export function useThemesConfig() {
  const activeTheme = useThemesConfigStore((state) => state.activeTheme);
  const setActiveTheme = useThemesConfigStore((state) => state.setActiveTheme);

  return { activeTheme, setActiveTheme, allThemes: THEMES };
}
