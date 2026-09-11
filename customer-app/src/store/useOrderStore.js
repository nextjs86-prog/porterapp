import { create } from 'zustand';
import api from '../utils/api';

const useOrderStore = create((set, get) => ({
  currentOrder:   null,
  orderHistory:   [],
  fareEstimate:   null,
  selectedVehicle: 'mini_truck',
  pickup:         null,
  drop:           null,
  stops:          [],
  isLoading:      false,

  setPickup:          (pickup) => set({ pickup }),
  setDrop:            (drop)   => set({ drop }),
  setStops:           (stops)  => set({ stops }),
  addStop:            (stop)   => set(s => ({ stops: [...s.stops, stop] })),
  updateStop:         (index, stop) => set(s => ({ stops: s.stops.map((st, i) => (i === index ? stop : st)) })),
  removeStop:         (index)  => set(s => ({ stops: s.stops.filter((_, i) => i !== index) })),
  setSelectedVehicle: (v)      => set({ selectedVehicle: v }),

  getFareEstimate: async () => {
    const { pickup, drop, stops, selectedVehicle } = get();
    if (!pickup || !drop) return;
    try {
      const toRad = d => d * Math.PI / 180;
      const R = 6371;
      const haversine = (a, b) => {
        const dLat = toRad(b.lat - a.lat);
        const dLng = toRad(b.lng - a.lng);
        const h = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
      };
      const validStops = stops.filter(s => s && s.lat != null && s.lng != null);
      const points = [pickup, ...validStops, drop];
      let distanceKm = 0;
      for (let i = 0; i < points.length - 1; i++) distanceKm += haversine(points[i], points[i + 1]);
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
