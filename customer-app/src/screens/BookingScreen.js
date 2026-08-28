import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Platform, Alert, TextInput,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import LocationAutocomplete, { LOCATIONIQ_KEY } from '../components/LocationAutocomplete';
import { COLORS, SIZES } from '../utils/theme';
import useOrderStore from '../store/useOrderStore';
import api from '../utils/api';

const VEHICLES = [
  { type: 'bike',        label: 'Bike',        emoji: '🏍️', price: '₹40+',  capacity: 'Upto 20kg'  },
  { type: 'mini_truck',  label: 'Mini Truck',  emoji: '🚐', price: '₹100+', capacity: 'Upto 1 ton'  },
  { type: 'tempo',       label: 'Tempo',       emoji: '🚚', price: '₹150+', capacity: 'Upto 2 ton'  },
  { type: 'large_truck', label: 'Large Truck', emoji: '🚛', price: '₹250+', capacity: 'Upto 5 ton'  },
];

const SCHEDULE_OPTIONS = [
  { key: 'now',      label: 'Now' },
  { key: '30min',    label: 'In 30 min' },
  { key: '1hr',      label: 'In 1 hour' },
  { key: 'tomorrow', label: 'Tomorrow 9 AM' },
];

const resolveScheduledAt = (key) => {
  if (key === 'now') return undefined;
  const d = new Date();
  if (key === '30min') d.setMinutes(d.getMinutes() + 30);
  if (key === '1hr') d.setHours(d.getHours() + 1);
  if (key === 'tomorrow') { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
  return d;
};

const BookingScreen = ({ navigation }) => {
  const {
    pickup, drop, selectedVehicle, fareEstimate,
    setPickup, setDrop, setSelectedVehicle, getFareEstimate, createOrder, isLoading,
  } = useOrderStore();
  const [pickupText, setPickupText] = useState();
  const [locatingMe, setLocatingMe] = useState(false);
  const [scheduleKey, setScheduleKey] = useState('now');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [goodsNotes, setGoodsNotes] = useState('');

  useEffect(() => {
    if (pickup && drop) getFareEstimate();
    setAppliedPromo(null);
  }, [pickup, drop, selectedVehicle]);

  const finalTotal = fareEstimate ? Math.max(0, fareEstimate.total - (appliedPromo?.discount || 0)) : null;

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !fareEstimate) return;
    setApplyingPromo(true);
    try {
      const res = await api.post('/customer/promo/apply', {
        code: promoCode.trim(), orderTotal: fareEstimate.total,
      });
      setAppliedPromo(res.data);
    } catch (err) {
      setAppliedPromo(null);
      Alert.alert('Promo Code', err.response?.data?.message || 'Could not apply promo code');
    } finally {
      setApplyingPromo(false);
    }
  };

  const useCurrentLocation = async () => {
    setLocatingMe(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to use your current location.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      const res = await axios.get('https://us1.locationiq.com/v1/reverse', {
        params: { key: LOCATIONIQ_KEY, lat: coords.latitude, lon: coords.longitude, format: 'json' },
      });
      const address = res.data?.display_name || `${coords.latitude}, ${coords.longitude}`;
      setPickup({ address, lat: coords.latitude, lng: coords.longitude });
      setPickupText(address);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch your current location');
    } finally {
      setLocatingMe(false);
    }
  };

  const handleBook = async () => {
    if (!pickup || !drop) return Alert.alert('Error', 'Select pickup and drop locations');
    try {
      const scheduledAt = resolveScheduledAt(scheduleKey);
      const order = await createOrder({
        pickup, drop, vehicleType: selectedVehicle,
        paymentMethod: 'cod',
        promoDiscount: appliedPromo?.discount || 0,
        promoCode: appliedPromo ? promoCode.trim().toUpperCase() : undefined,
        scheduledAt,
        notes: goodsNotes.trim() || undefined,
      });

      if (order.status === 'pending' && scheduledAt) {
        Alert.alert(
          'Booking Scheduled',
          `Your delivery is scheduled for ${scheduledAt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}. We'll find a driver closer to the time.`,
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      } else {
        navigation.navigate('SearchDriver', { orderId: order._id });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Booking failed');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book a Vehicle</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Location Inputs */}
        <View style={styles.locationCard}>
          <View style={styles.routeLine}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            <View style={styles.line} />
            <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
          </View>

          <View style={styles.locationInputs}>
            <LocationAutocomplete
              placeholder="Pickup location"
              value={pickupText}
              onSelect={(loc) => { setPickup(loc); setPickupText(loc.address); }}
            />
            <View style={styles.divider} />
            <LocationAutocomplete placeholder="Drop location" onSelect={setDrop} />
          </View>
        </View>

        <TouchableOpacity style={styles.currentLocBtn} onPress={useCurrentLocation} disabled={locatingMe}>
          <Icon name="crosshairs-gps" size={18} color={COLORS.primary} />
          <Text style={styles.currentLocText}>{locatingMe ? 'Locating...' : 'Use current location for pickup'}</Text>
        </TouchableOpacity>

        {/* Goods description */}
        <Text style={styles.sectionTitle}>What are you sending?</Text>
        <TextInput
          style={styles.goodsInput}
          placeholder="e.g. Furniture, boxes, documents (optional)"
          placeholderTextColor={COLORS.gray}
          value={goodsNotes}
          onChangeText={setGoodsNotes}
        />

        {/* Schedule */}
        <Text style={styles.sectionTitle}>When</Text>
        <View style={styles.scheduleRow}>
          {SCHEDULE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.scheduleChip, scheduleKey === opt.key && styles.scheduleChipActive]}
              onPress={() => setScheduleKey(opt.key)}
            >
              <Text style={[styles.scheduleChipText, scheduleKey === opt.key && styles.scheduleChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vehicle Selection */}
        <Text style={styles.sectionTitle}>Choose Vehicle</Text>
        {VEHICLES.map(v => (
          <TouchableOpacity
            key={v.type}
            style={[styles.vehicleRow, selectedVehicle === v.type && styles.vehicleRowActive]}
            onPress={() => setSelectedVehicle(v.type)}
          >
            <View style={[styles.vehicleIcon, selectedVehicle === v.type && styles.vehicleIconActive]}>
              <Text style={styles.vehicleEmoji}>{v.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName}>{v.label}</Text>
              <Text style={styles.vehicleCap}>{v.capacity}</Text>
            </View>
            <Text style={styles.vehiclePrice}>{v.price}</Text>
            {selectedVehicle === v.type && <Icon name="check-circle" size={20} color={COLORS.accent} style={{ marginLeft: 8 }} />}
          </TouchableOpacity>
        ))}

        {/* Promo Code */}
        {fareEstimate && (
          <View style={styles.promoCard}>
            <Icon name="tag-outline" size={20} color={COLORS.accent} />
            <TextInput
              style={styles.promoInput}
              placeholder="Enter promo code"
              placeholderTextColor={COLORS.gray}
              autoCapitalize="characters"
              value={promoCode}
              onChangeText={(t) => { setPromoCode(t); setAppliedPromo(null); }}
              editable={!appliedPromo}
            />
            <TouchableOpacity
              style={styles.promoBtn}
              onPress={appliedPromo ? () => { setAppliedPromo(null); setPromoCode(''); } : handleApplyPromo}
              disabled={applyingPromo || !promoCode.trim()}
            >
              <Text style={styles.promoBtnText}>{applyingPromo ? '...' : appliedPromo ? 'Remove' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Fare Estimate */}
        {fareEstimate && (
          <View style={styles.fareCard}>
            <Text style={styles.fareTitle}>Fare Estimate</Text>
            <View style={styles.fareRow}><Text style={styles.fareLabel}>Distance</Text><Text style={styles.fareVal}>{fareEstimate.distanceKm} km</Text></View>
            {fareEstimate.durationMins != null && (
              <View style={styles.fareRow}><Text style={styles.fareLabel}>Estimated Time</Text><Text style={styles.fareVal}>{fareEstimate.durationMins} min</Text></View>
            )}
            <View style={styles.fareRow}><Text style={styles.fareLabel}>Base Fare</Text><Text style={styles.fareVal}>₹{fareEstimate.baseFare}</Text></View>
            <View style={styles.fareRow}><Text style={styles.fareLabel}>Distance Fare</Text><Text style={styles.fareVal}>₹{fareEstimate.distanceFare?.toFixed(0)}</Text></View>
            {appliedPromo && (
              <View style={styles.fareRow}>
                <Text style={[styles.fareLabel, { color: COLORS.success }]}>Promo ({promoCode.toUpperCase()})</Text>
                <Text style={[styles.fareVal, { color: COLORS.success }]}>-₹{appliedPromo.discount}</Text>
              </View>
            )}
            <View style={[styles.fareRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal}>₹{finalTotal}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Estimated Fare</Text>
          <Text style={styles.footerFare}>{finalTotal != null ? `₹${finalTotal}` : '—'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, isLoading && styles.bookBtnDisabled]}
          onPress={handleBook} disabled={isLoading}
        >
          <Text style={styles.bookBtnText}>{isLoading ? 'Booking...' : 'Book Now'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:           { flex: 1, backgroundColor: COLORS.primary },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.primary },
  headerTitle:        { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.white },
  container:          { flex: 1, backgroundColor: COLORS.bgLight },
  locationCard:       { flexDirection: 'row', backgroundColor: COLORS.white, margin: 16, padding: 16, borderRadius: SIZES.radiusLg, elevation: 4 },
  routeLine:          { alignItems: 'center', marginRight: 12, paddingTop: 18 },
  dot:                { width: 12, height: 12, borderRadius: 6 },
  line:               { width: 2, flex: 1, backgroundColor: COLORS.grayLight, marginVertical: 4 },
  locationInputs:     { flex: 1 },
  divider:            { height: 1, backgroundColor: COLORS.grayLight, marginVertical: 4 },
  currentLocBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: -8, marginBottom: 8, padding: 8 },
  currentLocText:     { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  goodsInput:         { backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 16, padding: 14, borderRadius: SIZES.radius, fontSize: SIZES.sm, color: COLORS.textPrimary, elevation: 1 },
  sectionTitle:       { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  scheduleRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginBottom: 16 },
  scheduleChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.grayLight, backgroundColor: COLORS.white },
  scheduleChipActive: { borderColor: COLORS.accent, backgroundColor: '#FFF3E9' },
  scheduleChipText:   { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  scheduleChipTextActive: { color: COLORS.accent },
  promoCard:          { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: SIZES.radiusLg, elevation: 2 },
  promoInput:         { flex: 1, fontSize: SIZES.sm, color: COLORS.textPrimary },
  promoBtn:           { backgroundColor: COLORS.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusSm },
  promoBtnText:       { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '700' },
  vehicleRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: SIZES.radius, elevation: 2, borderWidth: 1.5, borderColor: 'transparent' },
  vehicleRowActive:   { borderColor: COLORS.accent, backgroundColor: '#FFF3E9' },
  vehicleIcon:        { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  vehicleIconActive:  { backgroundColor: '#FFE4CC' },
  vehicleEmoji:       { fontSize: 26 },
  vehicleName:        { fontSize: SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  vehicleCap:         { fontSize: SIZES.xs, color: COLORS.textSecondary },
  vehiclePrice:       { fontSize: SIZES.base, fontWeight: '700', color: COLORS.accent },
  fareCard:           { backgroundColor: COLORS.white, margin: 16, padding: 16, borderRadius: SIZES.radiusLg, elevation: 2 },
  fareTitle:          { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  fareRow:            { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fareLabel:          { fontSize: SIZES.sm, color: COLORS.textSecondary },
  fareVal:            { fontSize: SIZES.sm, color: COLORS.textPrimary, fontWeight: '500' },
  totalRow:           { borderTopWidth: 1, borderTopColor: COLORS.grayLight, paddingTop: 8, marginTop: 4 },
  totalLabel:         { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  totalVal:           { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.accent },
  footer:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, elevation: 8 },
  footerLabel:        { fontSize: SIZES.xs, color: COLORS.textSecondary },
  footerFare:         { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.accent },
  bookBtn:            { backgroundColor: COLORS.accent, paddingVertical: 14, paddingHorizontal: 32, borderRadius: SIZES.radiusLg },
  bookBtnDisabled:    { opacity: 0.6 },
  bookBtnText:        { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});

export default BookingScreen;

