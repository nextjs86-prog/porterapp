import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const useDriverStore = create((set, get) => ({
  driver:      null,
  token:       null,
  isLoggedIn:  false,
  isOnline:    false,
  earnings:    null,
  currentOrder: null,

  sendOtp: async (phone) => {
    const res = await api.post('/auth/driver/send-otp', { phone });
    return res.data;
  },

  verifyOtp: async (phone, otp) => {
    const res = await api.post('/auth/driver/verify-otp', { phone, otp });
    await AsyncStorage.setItem('driver_token', res.data.token);
    set({ driver: res.data.driver, token: res.data.token, isLoggedIn: true, isOnline: res.data.driver.isOnline });
    return res.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('driver_token');
    set({ driver: null, token: null, isLoggedIn: false });
  },

  toggleOnline: async () => {
    const res = await api.put('/driver/toggle-status');
    set({ isOnline: res.data.isOnline });
    return res.data.isOnline;
  },

  updateLocation: async (lat, lng) => {
    await api.put('/driver/location', { lat, lng });
  },

  fetchEarnings: async (period = 'daily') => {
    const res = await api.get(`/driver/earnings?period=${period}`);
    set({ earnings: res.data });
    return res.data;
  },

  acceptOrder: async (orderId) => {
    const res = await api.post(`/order/${orderId}/accept`);
    set({ currentOrder: res.data });
    return res.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const res = await api.put(`/order/${orderId}/status`, { status });
    set({ currentOrder: res.data });
    return res.data;
  },
}));

export default useDriverStore;
