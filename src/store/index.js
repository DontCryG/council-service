import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // User Auth State
  user: null,
  councilUsername: null,
  isAuthLoaded: false,
  setUser: (user) => set({ user, isAuthLoaded: true }),
  setCouncilUsername: (name) => set({ councilUsername: name }),
  
  // App Global State
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),

  // Theme / UI State
  theme: localStorage.getItem('theme') || 'dark',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  // Notification / Alert
  alert: null, // { type: 'success'|'error'|'info', message: '' }
  showAlert: (type, message) => {
    set({ alert: { type, message } });
    setTimeout(() => set({ alert: null }), 3000);
  },
  hideAlert: () => set({ alert: null }),
}));
