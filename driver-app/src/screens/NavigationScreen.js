import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from '../utils/theme';
import useDriverStore from '../store/useDriverStore';
import api from '../utils/api';

const ORDER_STEPS = [
  { key: 'accepted',   label: 'Head to Pickup',    btnLabel: 'Reached Pickup',   nextStatus: 'pickup'     },
  { key: 'pickup',     label: 'At Pickup Location', btnLabel: 'Start Delivery',   nextStatus: 'in_transit' },
  { key: 'in_transit', label: 'Delivering...',      btnLabel: 'Mark Delivered',   nextStatus: 'delivered'  },
];

const NavigationScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order,   setOrder]   = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const updateOrderStatus = useDriverStore(s => s.updateOrderStatus);
  const mapRef = useRef(null);

  useEffect(() => { fetchOrder(); }, []);

  const fetchOrder = async () => {
    const res = await api.get(`/order/${orderId}`);
    setOrder(res.data);
    const idx = ORDER_STEPS.findIndex(s => s.key === res.data.status);
    if (idx >= 0) setStepIdx(idx);
  };

  const handleNextStep = async () => {
    const step = ORDER_STEPS[stepIdx];
    if (!step) return;
    setLoading(true);
    try {
      await updateOrderStatus(orderId, step.nextStatus);
      if (step.nextStatus === 'delivered') {
        Alert.alert('Order Delivered!', 'Great job! You have completed the delivery.', [
          { text: 'OK', onPress: () => navigation.replace('Main') },
        ]);
      } else {
        setStepIdx(stepIdx + 1);
        fetchOrder();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    } finally { setLoading(false); }
  };

  const openMaps = (lat, lng, label) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
  };

  const step = ORDER_STEPS[stepIdx];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={true}
        showsTraffic={true}
        initialRegion={{
          latitude:      order?.pickup?.lat  || 12.9716,
          longitude:     order?.pickup?.lng  || 77.5946,
          latitudeDelta: 0.05, longitudeDelta: 0.05,
        }}
      >
        {order?.pickup && (
          <Marker coordinate={{ latitude: order.pickup.lat, longitude: order.pickup.lng }} title="Pickup">
            <View style={styles.pickupPin}><Icon name="map-marker" size={28} color={COLORS.success} /></View>
          </Marker>
        )}
        {order?.drop && (
          <Marker coordinate={{ latitude: order.drop.lat, longitude: order.drop.lng }} title="Drop">
            <View style={styles.dropPin}><Icon name="map-marker" size={28} color={COLORS.error} /></View>
          </Marker>
        )}
      </MapView>

      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={22} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Bottom Card */}
      <View style={styles.card}>
        <View style={styles.statusBadge}>
          <Icon name="navigation" size={16} color={COLORS.white} />
          <Text style={styles.statusText}>{step?.label || 'Complete'}</Text>
        </View>

        {/* Customer info */}
        {order?.customer && (
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}><Text style={{ fontSize: 22 }}>👤</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{order.customer.name || 'Customer'}</Text>
              <Text style={styles.customerPhone}>{order.customer.phone}</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${order.customer.phone}`)}
            >
              <Icon name="phone" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Locations */}
        <View style={styles.locRow}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => order?.pickup && openMaps(order.pickup.lat, order.pickup.lng)}
          >
            <Icon name="map-marker" size={16} color={COLORS.success} />
            <Text style={styles.navBtnText} numberOfLines={1}>{order?.pickup?.address}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.locRow}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => order?.drop && openMaps(order.drop.lat, order.drop.lng)}
          >
            <Icon name="flag-checkered" size={16} color={COLORS.error} />
            <Text style={styles.navBtnText} numberOfLines={1}>{order?.drop?.address}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Fare</Text>
          <Text style={styles.fareVal}>₹{order?.fareBreakdown?.total}</Text>
        </View>

        {step && (
          <TouchableOpacity
            style={[styles.actionBtn, loading && { opacity: 0.6 }]}
            onPress={handleNextStep} disabled={loading}
          >
            <Text style={styles.actionBtnText}>{loading ? 'Updating...' : step.btnLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1 },
  map:           { flex: 1 },
  backBtn:       { position: 'absolute', top: 48, left: 16, backgroundColor: COLORS.white, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  pickupPin:     {},
  dropPin:       {},
  card:          { backgroundColor: COLORS.white, padding: 20, paddingBottom: 36, elevation: 12, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 16 },
  statusText:    { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '700' },
  customerRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  customerAvatar:{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  customerName:  { fontSize: SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  customerPhone: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  callBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' },
  locRow:        { marginBottom: 8 },
  navBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.bgLight, padding: 12, borderRadius: SIZES.radius },
  navBtnText:    { flex: 1, fontSize: SIZES.sm, color: COLORS.textPrimary },
  fareRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.grayLight, marginTop: 8 },
  fareLabel:     { fontSize: SIZES.base, color: COLORS.textSecondary },
  fareVal:       { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.primary },
  actionBtn:     { backgroundColor: COLORS.primary, padding: 16, borderRadius: SIZES.radiusLg, alignItems: 'center', marginTop: 8 },
  actionBtnText: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});

export default NavigationScreen;
