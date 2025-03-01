import create from 'zustand';
import axios from 'axios';

interface User {
  username: string;
  email: string;
  organization?: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    organization?: string;
  }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        username,
        password,
      });

      const { access_token } = response.data;
      
      // Set token in axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Get user info
      const userResponse = await axios.get('http://localhost:8000/api/auth/me');
      
      // Save to localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      set({
        token: access_token,
        user: userResponse.data,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      await axios.post('http://localhost:8000/api/auth/register', userData);
      
      // Auto login after registration
      await useAuthStore.getState().login(userData.username, userData.password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  logout: () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear axios defaults
    delete axios.defaults.headers.common['Authorization'];
    
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },
})); 