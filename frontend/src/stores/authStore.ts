import create from 'zustand';
import axios from 'axios';

interface User {
  id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  login: async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        username,
        password,
      });
      const { access_token } = response.data;
      set({
        token: access_token,
        isAuthenticated: true,
        user: { id: '1', username }, // You might want to get this from the backend
      });
      localStorage.setItem('token', access_token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },
  register: async (username: string, password: string) => {
    try {
      await axios.post('http://localhost:8000/api/auth/register', {
        username,
        password,
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },
  logout: () => {
    set({ user: null, isAuthenticated: false, token: null });
    localStorage.removeItem('token');
  },
})); 
