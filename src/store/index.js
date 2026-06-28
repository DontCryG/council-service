import { create } from 'zustand';
import { createAuthSlice } from './slices/authSlice';
import { createUISlice } from './slices/uiSlice';

export const useAppStore = create((...a) => ({
  ...createAuthSlice(...a),
  ...createUISlice(...a),
}));
