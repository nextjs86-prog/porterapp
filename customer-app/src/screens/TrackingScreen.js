import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Linking, Alert, ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';
import io from 'socket.io-client';
import api from '../utils/api';
import useOrderStore from '../store/useOrderStore';

const SOCKET_URL = 'https://porterapp-7y12.onrender.com';

const STATUS_STEPS = [
  { key: 'accepted',   label: 'Driver Assigned' },
  { key: 'pickup',     label: 'At Pickup'       },
  { key: 'in_transit', label: 'In Transit'      },
  { key: 'delivered',  label: 'Delivered'       },
];

const TrackingScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order,          setOrder]          = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [showRating,     setShowRating]     = useState(false);
  const [stars,          setStars]          = useState(5);
  const mapRef   = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchOrder();
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on(`driver:location:${order?.driver?._id}`, ({ lat, lng }) => {
      setDriverLocation({ latitude: lat, longitude: lng });
    });

    socket.on('order:update', ({ status }) => {
      setOrder(prev => prev ? { ...prev, status } : prev);
      if (status === 'delivered') {
        setTimeout(() => setShowRating(true), 1000);
      }
    });

    return () => socket.disconnect();
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/order/${orderId}`);
      setOrder(res.data);
      if (res.data.driver?.currentLocation?.coordinates) {
        const [lng, lat] = res.data.driver.currentLocation.coordinates;
        setDriverLocation({ latitude: lat, longitude: lng });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const callDriver = () => {
    if (order?.driver?.phone) Linking.openURL(`tel:${order.driver.phone}`);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        await api.delete(`/order/${orderId}`, { data: { reason: 'Customer cancelled' } });
        navigation.replace('Main');
      }},
    ]);
  };

  const currentStep = STATUS_STEPS.findIndex(s => s.key === order?.status);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude:       order?.pickup?.lat  || 12.9716,
          longitude:      order?.pickup?.lng  || 77.5946,
          latitudeDelta:  0.05,
          longitudeDelta: 0.05,
        }}
      >
        {order?.pickup && (
          <Marker coordinate={{ latitude: order.pickup.lat, longitude: order.pickup.lng }} title="Pickup">
            <View style={styles.pickupMarker}><Icon name="map-marker" size={24} color={COLORS.success} /></View>
          </Marker>
        )}
        {order?.drop && (
          <Marker coordinate={{ latitude: order.drop.lat, longitude: order.drop.lng }} title="Drop">
            <View style={styles.dropMarker}><Icon name="map-marker" size={24} color={COLORS.error} /></View>
          </Marker>
        )}
        {driverLocation && (
          <Marker coordinate={driverLocation} title="Driver">
            <View style={styles.driverMarker}><Text style={{ fontSize: 24 }}>🚚</Text></View>
          </Marker>
        )}
      </MapView>

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={22} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Status Steps */}
      <View style={styles.statusBar}>
        {STATUS_STEPS.map((step, i) => (
          <View key={step.key} style={styles.stepItem}>
            <View style={[styles.stepDot, i <= currentStep && styles.stepDotActive]}>
              {i < currentStep && <Icon name="check" size={12} color={COLORS.white} />}
            </View>
            <Text style={[styles.stepLabel, i <= currentStep && styles.stepLabelActive]}>{step.label}</Text>
            {i < STATUS_STEPS.length - 1 && <View style={[styles.stepLine, i < currentStep && styles.stepLineActive]} />}
          </View>
        ))}
      </View>

      {/* Driver Card */}
      {order?.driver && (
        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Text style={{ fontSize: 28 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{order.driver.name}</Text>
              <Text style={styles.driverVehicle}>{order.driver.vehicleNumber} • ⭐ {order.driver.rating}</Text>
              <Text style={styles.driverStatus}>{order.status?.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={callDriver}>
                <Icon name="phone" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.cancelActionBtn]} onPress={handleCancel}>
                <Icon name="close" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Total Fare</Text>
            <Text style={styles.fareVal}>₹{order.fareBreakdown?.total}</Text>
          </View>
        </View>
      )}

      {/* Rating Modal */}
      {showRating && (
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Order Delivered! 🎉</Text>
            <Text style={styles.ratingSubtitle}>Rate your experience with {order?.driver?.name}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setStars(s)}>
                  <Icon name={s <= stars ? 'star' : 'star-outline'} size={36} color={COLORS.warning} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.rateBtn}
              onPress={async () => {
                await api.post(`/order/${orderId}/rate`, { stars });
                setShowRating(false);
                navigation.replace('Confirmation', { orderId });
              }}
            >
              <Text style={styles.rateBtnText}>Submit Rating</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1 },
  map:              { flex: 1 },
  backBtn:          { position: 'absolute', top: 48, left: 16, backgroundColor: COLORS.white, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  pickupMarker:     {},
  dropMarker:       {},
  driverMarker:     {},
  statusBar:        { flexDirection: 'row', backgroundColor: COLORS.white, paddingVertical: 12, paddingHorizontal: 16, justifyContent: 'space-between', elevation: 4 },
  stepItem:         { flex: 1, alignItems: 'center', position: 'relative' },
  stepDot:          { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.grayLight, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepDotActive:    { backgroundColor: COLORS.primary },
  stepLabel:        { fontSize: 9, color: COLORS.gray, textAlign: 'center' },
  stepLabelActive:  { color: COLORS.primary, fontWeight: '600' },
  stepLine:         { position: 'absolute', top: 9, left: '60%', right: '-60%', height: 2, backgroundColor: COLORS.grayLight },
  stepLineActive:   { backgroundColor: COLORS.primary },
  driverCard:       { backgroundColor: COLORS.white, padding: 16, elevation: 8 },
  driverInfo:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  driverAvatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  driverName:       { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  driverVehicle:    { fontSize: SIZES.sm, color: COLORS.textSecondary },
  driverStatus:     { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  driverActions:    { flexDirection: 'row', gap: 8 },
  actionBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  cancelActionBtn:  { backgroundColor: '#FEF2F2' },
  fareRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.grayLight },
  fareLabel:        { fontSize: SIZES.base, color: COLORS.textSecondary },
  fareVal:          { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.primary },
  ratingOverlay:    { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  ratingCard:       { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 32, alignItems: 'center' },
  ratingTitle:      { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  ratingSubtitle:   { fontSize: SIZES.base, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },
  starsRow:         { flexDirection: 'row', gap: 12, marginBottom: 32 },
  rateBtn:          { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 48, borderRadius: SIZES.radiusLg },
  rateBtnText:      { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});

export default TrackingScreen;

