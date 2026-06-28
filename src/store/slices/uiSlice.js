export const createUISlice = (set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),

  theme: localStorage.getItem('theme') || 'dark',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  alerts: [],
  showAlert: (type, message) => {
    const id = Date.now() + Math.random();
    set((state) => ({ alerts: [...state.alerts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ alerts: state.alerts.filter(a => a.id !== id) }));
    }, 5000);
  },
  hideAlert: (id) => set((state) => ({ 
    alerts: id ? state.alerts.filter(a => a.id !== id) : [] 
  })),
});
