export const createAuthSlice = (set) => ({
  user: null,
  councilUsername: null,
  isAuthLoaded: false,
  setUser: (user) => set({ user, isAuthLoaded: true }),
  setCouncilUsername: (name) => set({ councilUsername: name }),
});
