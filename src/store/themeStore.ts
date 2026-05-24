import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set) => ({
  isDark: true,
  toggle: () => set((s) => {
    const next = !s.isDark;
    if (next) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-mode');
    }
    return { isDark: next };
  }),
}));
