import { create } from 'zustand';
import API from '../services/api';

const useAdminStore = create((set) => ({
  isLoggedIn: !!localStorage.getItem('admin_token'),

  login: async (email, password) => {
    const res = await API.post('/auth/admin/login', { email, password });
    localStorage.setItem('admin_token', res.data.token);
    set({ isLoggedIn: true });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    set({ isLoggedIn: false });
  },
}));

export default useAdminStore;
