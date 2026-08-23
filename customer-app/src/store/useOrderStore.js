import { create } from 'zustand';
import api from '../utils/api';

const useOrderStore = create((set, get) => ({
  currentOrder:   null,
  orderHistory:   [],
  fareEstimate:   null,
  selectedVehicle: 'mini_truck',
  pickup:         null,
  drop:           null,
  isLoading:      false,

  setPickup:          (pickup) => set({ pickup }),
  setDrop:            (drop)   => set({ drop }),
  setSelectedVehicle: (v)      => set({ selectedVehicle: v }),

  getFareEstimate: async () => {
    const { pickup, drop, selectedVehicle } = get();
    if (!pickup || !drop) return;
    try {
      const toRad = d => d * Math.PI / 180;
      const R = 6371;
      const dLat = toRad(drop.lat - pickup.lat);
      const dLng = toRad(drop.lng - pickup.lng);
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(pickup.lat))*Math.cos(toRad(drop.lat))*Math.sin(dLng/2)**2;
      const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const res = await api.post('/order/estimate', { vehicleType: selectedVehicle, distanceKm });
      set({ fareEstimate: { ...res.data, distanceKm: Math.round(distanceKm * 10) / 10 } });
    } catch (err) {
      console.error(err);
    }
  },

  createOrder: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/order/create', payload);
      set({ currentOrder: res.data, isLoading: false });
      return res.data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  fetchOrderHistory: async () => {
    const res = await api.get('/customer/orders');
    set({ orderHistory: res.data });
  },

  cancelOrder: async (orderId, reason) => {
    await api.delete(`/order/${orderId}`, { data: { reason } });
    set({ currentOrder: null });
  },

  rateOrder: async (orderId, stars, review) => {
    await api.post(`/order/${orderId}/rate`, { stars, review });
  },
}));

export default useOrderStore;
