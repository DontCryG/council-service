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
  alerts: [], // Array of { id, type, message }
  showAlert: (type, message) => {
    const id = Date.now() + Math.random();
    set((state) => ({ alerts: [...state.alerts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ alerts: state.alerts.filter(a => a.id !== id) }));
    }, 5000); // 5 seconds duration
  },
  hideAlert: (id) => set((state) => ({ 
    alerts: id ? state.alerts.filter(a => a.id !== id) : [] 
  })),
}));
