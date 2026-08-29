import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert, Modal, TextInput } from 'react-native';
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

const CANCEL_REASONS = [
  'Customer not responding',
  'Wrong pickup address',
  'Customer requested cancellation',
  'Vehicle breakdown',
  'Other',
];

const NavigationScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order,   setOrder]   = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNote, setCancelNote] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const updateOrderStatus = useDriverStore(s => s.updateOrderStatus);
  const cancelOrderAction = useDriverStore(s => s.cancelOrder);
  const mapRef = useRef(null);

  useEffect(() => { fetchOrder(); }, []);

  const fetchOrder = async () => {
    const res = await api.get(`/order/${orderId}`);
    setOrder(res.data);
    const idx = ORDER_STEPS.findIndex(s => s.key === res.data.status);
    if (idx >= 0) setStepIdx(idx);
  };

  const advanceStep = async (otp) => {
    const step = ORDER_STEPS[stepIdx];
    if (!step) return;
    setLoading(true);
    try {
      await updateOrderStatus(orderId, step.nextStatus, otp);
      if (step.nextStatus === 'delivered') {
        Alert.alert('Order Delivered!', 'Great job! You have completed the delivery.', [
          { text: 'OK', onPress: () => navigation.replace('Main') },
        ]);
      } else {
        setStepIdx(stepIdx + 1);
        fetchOrder();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    } finally { setLoading(false); }
  };

  const handleNextStep = () => {
    const step = ORDER_STEPS[stepIdx];
    if (step?.nextStatus === 'in_transit') {
      setOtpInput('');
      setShowOtpModal(true);
    } else {
      advanceStep();
    }
  };

  const handleConfirmOtp = () => {
    if (otpInput.trim().length !== 4) return Alert.alert('Error', 'Enter the 4-digit OTP shared by the customer');
    setShowOtpModal(false);
    advanceStep(otpInput.trim());
  };

  const openMaps = (lat, lng, label) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
  };

  const handleConfirmCancel = async () => {
    const reason = cancelReason === 'Other' ? cancelNote.trim() : cancelReason;
    if (!reason) return Alert.alert('Error', 'Please select or enter a reason');
    setCancelling(true);
    try {
      await cancelOrderAction(orderId, reason);
      setShowCancelModal(false);
      Alert.alert('Trip Cancelled', 'The customer has been notified.', [
        { text: 'OK', onPress: () => navigation.replace('Main') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to cancel trip');
    } finally {
      setCancelling(false);
    }
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

      {/* Cancel Trip */}
      <TouchableOpacity style={styles.backBtn} onPress={() => { setCancelReason(''); setCancelNote(''); setShowCancelModal(true); }}>
        <Icon name="close" size={22} color={COLORS.error} />
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

      <Modal visible={showOtpModal} transparent animationType="fade" onRequestClose={() => setShowOtpModal(false)}>
        <View style={styles.otpOverlay}>
          <View style={styles.otpModal}>
            <Text style={styles.otpTitle}>Enter Pickup OTP</Text>
            <Text style={styles.otpSub}>Ask the customer for the 4-digit code to confirm goods handover</Text>
            <TextInput
              style={styles.otpInput}
              keyboardType="numeric"
              maxLength={4}
              value={otpInput}
              onChangeText={setOtpInput}
              placeholder="0000"
              placeholderTextColor={COLORS.gray}
              autoFocus
            />
            <View style={styles.otpBtnRow}>
              <TouchableOpacity style={styles.otpCancelBtn} onPress={() => setShowOtpModal(false)}>
                <Text style={styles.otpCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.otpConfirmBtn} onPress={handleConfirmOtp}>
                <Text style={styles.otpConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={showCancelModal} transparent animationType="fade" onRequestClose={() => setShowCancelModal(false)}>
        <View style={styles.otpOverlay}>
          <View style={styles.otpModal}>
            <Text style={styles.otpTitle}>Cancel Trip</Text>
            <Text style={styles.otpSub}>Select a reason for cancelling</Text>

            <View style={styles.reasonList}>
              {CANCEL_REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonChip, cancelReason === r && styles.reasonChipActive]}
                  onPress={() => setCancelReason(r)}
                >
                  <Text style={[styles.reasonChipText, cancelReason === r && styles.reasonChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {cancelReason === 'Other' && (
              <TextInput
                style={styles.cancelNoteInput}
                placeholder="Describe the reason"
                placeholderTextColor={COLORS.gray}
                value={cancelNote}
                onChangeText={setCancelNote}
                multiline
              />
            )}

            <View style={styles.otpBtnRow}>
              <TouchableOpacity style={styles.otpCancelBtn} onPress={() => setShowCancelModal(false)}>
                <Text style={styles.otpCancelText}>Keep Trip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.otpConfirmBtn, { backgroundColor: COLORS.error }, cancelling && { opacity: 0.6 }]}
                onPress={handleConfirmCancel}
                disabled={cancelling}
              >
                <Text style={styles.otpConfirmText}>{cancelling ? 'Cancelling...' : 'Confirm Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  otpOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  otpModal:      { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: 24, width: '100%', alignItems: 'center' },
  otpTitle:      { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  otpSub:        { fontSize: SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  otpInput:      { borderWidth: 1.5, borderColor: COLORS.grayLight, borderRadius: SIZES.radius, fontSize: SIZES.xxl, textAlign: 'center', letterSpacing: 8, width: 160, padding: 12, color: COLORS.textPrimary },
  otpBtnRow:     { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
  otpCancelBtn:  { flex: 1, padding: 14, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: COLORS.grayLight, alignItems: 'center' },
  otpCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  otpConfirmBtn: { flex: 1, padding: 14, borderRadius: SIZES.radius, backgroundColor: COLORS.primary, alignItems: 'center' },
  otpConfirmText:{ color: COLORS.white, fontWeight: '700' },
  reasonList:    { width: '100%', gap: 8 },
  reasonChip:    { borderWidth: 1.5, borderColor: COLORS.grayLight, borderRadius: SIZES.radius, padding: 12, width: '100%' },
  reasonChipActive: { borderColor: COLORS.error, backgroundColor: '#FEF2F2' },
  reasonChipText: { fontSize: SIZES.sm, color: COLORS.textPrimary, textAlign: 'center' },
  reasonChipTextActive: { color: COLORS.error, fontWeight: '700' },
  cancelNoteInput: { borderWidth: 1.5, borderColor: COLORS.grayLight, borderRadius: SIZES.radius, padding: 12, fontSize: SIZES.sm, color: COLORS.textPrimary, width: '100%', marginTop: 12, minHeight: 60, textAlignVertical: 'top' },
});

export default NavigationScreen;
