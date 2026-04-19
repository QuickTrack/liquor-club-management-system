import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string, branchId: string) => Promise<void>;
  pinLogin: (phone: string, pin: string, branchId: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password, branchId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password, branchId });
          const { user, tokens } = response.data;

          set({
            user,
            token: tokens.access,
            isAuthenticated: true,
            isLoading: false,
          });

          // Set default auth header for API
          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      pinLogin: async (phone, pin, branchId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/pin-login', { phone, pin, branchId });
          const { user, tokens } = response.data;

          set({
            user,
            token: tokens.access,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'PIN login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        delete api.defaults.headers.common['Authorization'];
      },

      initialize: async () => {
        const { token } = get();
        if (token) {
          try {
            const response = await api.get('/auth/me');
            set({
              user: response.data.data.user,
              isAuthenticated: true,
            });
          } catch {
            // Token invalid, clear state
            get().logout();
          }
        }
      },

      setUser: (user) => {
        set({ user });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
