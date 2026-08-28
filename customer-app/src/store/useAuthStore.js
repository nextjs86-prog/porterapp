import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const useAuthStore = create((set) => ({
  user:        null,
  token:       null,
  isLoading:   false,
  isLoggedIn:  false,

  sendOtp: async (phone) => {
    const res = await api.post('/auth/send-otp', { phone });
    return res.data;
  },

  verifyOtp: async (phone, otp, referralCode) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp, referralCode });
      await AsyncStorage.setItem('token', res.data.token);
      set({ user: res.data.user, token: res.data.token, isLoggedIn: true, isLoading: false });
      return res.data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null, isLoggedIn: false });
  },

  updateUser: (user) => set({ user }),
}));

export default useAuthStore;
