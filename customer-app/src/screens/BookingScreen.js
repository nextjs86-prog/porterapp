import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Platform, Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { COLORS, SIZES } from '../utils/theme';
import useOrderStore from '../store/useOrderStore';

const VEHICLES = [
  { type: 'bike',        label: 'Bike',        icon: 'motorbike',    price: '₹40+', capacity: 'Upto 20kg' },
  { type: 'mini_truck',  label: 'Mini Truck',  icon: 'truck-outline',price: '₹100+', capacity: 'Upto 1 ton' },
  { type: 'tempo',       label: 'Tempo',       icon: 'truck',        price: '₹150+', capacity: 'Upto 2 ton' },
  { type: 'large_truck', label: 'Large Truck', icon: 'truck-fast',   price: '₹250+', capacity: 'Upto 5 ton' },
];

const BookingScreen = ({ navigation }) => {
  const {
    pickup, drop, selectedVehicle, fareEstimate,
    setPickup, setDrop, setSelectedVehicle, getFareEstimate, createOrder, isLoading,
  } = useOrderStore();

  useEffect(() => {
    if (pickup && drop) getFareEstimate();
  }, [pickup, drop, selectedVehicle]);

  const handleBook = async () => {
    if (!pickup || !drop) return Alert.alert('Error', 'Select pickup and drop locations');
    try {
      const order = await createOrder({
        pickup, drop, vehicleType: selectedVehicle,
        paymentMethod: 'cod',
        promoDiscount: 0,
      });
      navigation.navigate('SearchDriver', { orderId: order._id });
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
            <LocationAutocomplete placeholder="Pickup location" onSelect={setPickup} />
            <View style={styles.divider} />
            <LocationAutocomplete placeholder="Drop location" onSelect={setDrop} />
          </View>
        </View>

        {/* Vehicle Selection */}
        <Text style={styles.sectionTitle}>Choose Vehicle</Text>
        {VEHICLES.map(v => (
          <TouchableOpacity
            key={v.type}
            style={[styles.vehicleRow, selectedVehicle === v.type && styles.vehicleRowActive]}
            onPress={() => setSelectedVehicle(v.type)}
          >
            <View style={styles.vehicleIcon}>
              <Icon name={v.icon} size={28} color={selectedVehicle === v.type ? COLORS.primary : COLORS.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName}>{v.label}</Text>
              <Text style={styles.vehicleCap}>{v.capacity}</Text>
            </View>
            <Text style={styles.vehiclePrice}>{v.price}</Text>
            {selectedVehicle === v.type && <Icon name="check-circle" size={20} color={COLORS.primary} style={{ marginLeft: 8 }} />}
          </TouchableOpacity>
        ))}

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
            <View style={[styles.fareRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal}>₹{fareEstimate.total}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Estimated Fare</Text>
          <Text style={styles.footerFare}>{fareEstimate ? `₹${fareEstimate.total}` : '—'}</Text>
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
  sectionTitle:       { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  vehicleRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: SIZES.radius, elevation: 1, borderWidth: 1.5, borderColor: 'transparent' },
  vehicleRowActive:   { borderColor: COLORS.primary, backgroundColor: '#EFF6FF' },
  vehicleIcon:        { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  vehicleName:        { fontSize: SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  vehicleCap:         { fontSize: SIZES.xs, color: COLORS.textSecondary },
  vehiclePrice:       { fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },
  fareCard:           { backgroundColor: COLORS.white, margin: 16, padding: 16, borderRadius: SIZES.radiusLg, elevation: 2 },
  fareTitle:          { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  fareRow:            { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fareLabel:          { fontSize: SIZES.sm, color: COLORS.textSecondary },
  fareVal:            { fontSize: SIZES.sm, color: COLORS.textPrimary, fontWeight: '500' },
  totalRow:           { borderTopWidth: 1, borderTopColor: COLORS.grayLight, paddingTop: 8, marginTop: 4 },
  totalLabel:         { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  totalVal:           { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.primary },
  footer:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, elevation: 8 },
  footerLabel:        { fontSize: SIZES.xs, color: COLORS.textSecondary },
  footerFare:         { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.primary },
  bookBtn:            { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: SIZES.radiusLg },
  bookBtnDisabled:    { opacity: 0.6 },
  bookBtnText:        { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});

export default BookingScreen;

