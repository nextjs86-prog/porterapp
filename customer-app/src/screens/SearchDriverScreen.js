import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, SIZES } from '../utils/theme';
import io from 'socket.io-client';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';
import useOrderStore from '../store/useOrderStore';

const SOCKET_URL = 'https://porterapp-7y12.onrender.com';

const VEHICLE_EMOJI = { bike: '🏍️', mini_truck: '🚚', tempo: '🚛', large_truck: '🚛' };

const SearchDriverScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const user     = useAuthStore(s => s.user);
  const pickup   = useOrderStore(s => s.pickup);
  const vehicleType = useOrderStore(s => s.selectedVehicle);

  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const socketRef = useRef(null);
  const timerRef  = useRef(null);
  const pollRef   = useRef(null);

  const fetchNearbyDrivers = async () => {
    if (!pickup) return;
    try {
      const res = await api.get('/order/nearby-drivers', {
        params: { lat: pickup.lat, lng: pickup.lng, vehicleType },
      });
      setNearbyDrivers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNearbyDrivers();
    pollRef.current = setInterval(fetchNearbyDrivers, 6000);

    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('customer:join', user?._id);

    socket.on('order:update', ({ status: s }) => {
      if (s === 'accepted') {
        clearTimeout(timerRef.current);
        navigation.replace('Tracking', { orderId });
      }
    });

    timerRef.current = setTimeout(() => {
      Alert.alert('No Driver Found', 'No drivers available nearby. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 180000);

    return () => {
      socket.disconnect();
      clearTimeout(timerRef.current);
      clearInterval(pollRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude:       pickup?.lat  || 12.9716,
          longitude:      pickup?.lng  || 77.5946,
          latitudeDelta:  0.05,
          longitudeDelta: 0.05,
        }}
      >
        {pickup && (
          <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} title="Pickup">
            <View style={styles.pickupMarker} />
          </Marker>
        )}
        {nearbyDrivers.map(d => (
          <Marker key={d._id} coordinate={d.location} title={d.name}>
            <View style={styles.driverMarker}>
              <Text style={{ fontSize: 22 }}>{VEHICLE_EMOJI[d.vehicleType] || '🚚'}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.topCard}>
        <Text style={styles.title}>Searching for nearby drivers...</Text>
        <Text style={styles.sub}>
          {nearbyDrivers.length > 0
            ? `${nearbyDrivers.length} driver${nearbyDrivers.length > 1 ? 's' : ''} nearby`
            : 'Looking for available drivers'}
        </Text>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Order ID</Text>
          <Text style={styles.infoVal}>#{orderId?.slice(-8)?.toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            Alert.alert('Cancel Search', 'Are you sure you want to cancel?', [
              { text: 'No' },
              { text: 'Yes', onPress: () => navigation.goBack(), style: 'destructive' },
            ]);
          }}
        >
          <Text style={styles.cancelText}>Cancel Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1 },
  map:           { flex: 1 },
  pickupMarker:  { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.success, borderWidth: 3, borderColor: COLORS.white, elevation: 4 },
  driverMarker:  { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', elevation: 4, borderWidth: 1, borderColor: COLORS.grayLight },
  topCard:       { position: 'absolute', top: 48, left: 16, right: 16, backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: 16, elevation: 6, alignItems: 'center' },
  title:         { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  sub:           { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  bottomCard:    { backgroundColor: COLORS.white, padding: 20, paddingBottom: 32, elevation: 8, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  infoLabel:     { fontSize: SIZES.xs, color: COLORS.textSecondary },
  infoVal:       { fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },
  cancelBtn:     { alignItems: 'center', padding: 4 },
  cancelText:    { color: COLORS.error, fontSize: SIZES.base, fontWeight: '600' },
});

export default SearchDriverScreen;
