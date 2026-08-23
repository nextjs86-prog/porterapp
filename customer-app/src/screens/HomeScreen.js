import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';
import useAuthStore   from '../store/useAuthStore';
import useOrderStore  from '../store/useOrderStore';

const VEHICLES = [
  { type: 'bike',        label: 'Bike',       icon: 'motorbike',      desc: 'Small parcels' },
  { type: 'mini_truck',  label: 'Mini Truck',  icon: 'truck-outline',  desc: 'Small loads' },
  { type: 'tempo',       label: 'Tempo',       icon: 'truck',          desc: 'Medium loads' },
  { type: 'large_truck', label: 'Large Truck', icon: 'truck-fast',     desc: 'Heavy goods' },
];

const RECENT = [
  { id: 1, label: 'Home', address: '12 MG Road, Bangalore', icon: 'home' },
  { id: 2, label: 'Office', address: 'Prestige Tech Park, Whitefield', icon: 'office-building' },
];

const HomeScreen = ({ navigation }) => {
  const user            = useAuthStore(s => s.user);
  const { selectedVehicle, setSelectedVehicle, setPickup, setDrop } = useOrderStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'there'} 👋</Text>
            <Text style={styles.subGreeting}>Where are you shipping today?</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Icon name="bell-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Booking')}
          activeOpacity={0.8}
        >
          <Icon name="map-search" size={20} color={COLORS.gray} />
          <Text style={styles.searchPlaceholder}>Enter pickup location...</Text>
        </TouchableOpacity>

        {/* Vehicle Selector */}
        <Text style={styles.sectionTitle}>Select Vehicle</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
          {VEHICLES.map((v) => (
            <TouchableOpacity
              key={v.type}
              style={[styles.vehicleCard, selectedVehicle === v.type && styles.vehicleCardActive]}
              onPress={() => setSelectedVehicle(v.type)}
            >
              <Icon name={v.icon} size={32} color={selectedVehicle === v.type ? COLORS.white : COLORS.primary} />
              <Text style={[styles.vehicleLabel, selectedVehicle === v.type && styles.vehicleLabelActive]}>{v.label}</Text>
              <Text style={[styles.vehicleDesc, selectedVehicle === v.type && styles.vehicleDescActive]}>{v.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent Addresses */}
        <Text style={styles.sectionTitle}>Recent Addresses</Text>
        {RECENT.map(r => (
          <TouchableOpacity
            key={r.id}
            style={styles.recentCard}
            onPress={() => { setPickup({ address: r.address, lat: 0, lng: 0 }); navigation.navigate('Booking'); }}
          >
            <View style={styles.recentIcon}><Icon name={r.icon} size={20} color={COLORS.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentLabel}>{r.label}</Text>
              <Text style={styles.recentAddress} numberOfLines={1}>{r.address}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        ))}

        {/* Book Now CTA */}
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('Booking')}
        >
          <Icon name="truck-delivery" size={22} color={COLORS.white} />
          <Text style={styles.bookBtnText}>Book a Vehicle Now</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:          { flex: 1, backgroundColor: COLORS.primary },
  container:         { flex: 1, backgroundColor: COLORS.bgLight },
  header:            { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16 },
  greeting:          { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white },
  subGreeting:       { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  notifBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  searchBar:         { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 16, padding: 14, borderRadius: SIZES.radiusLg, elevation: 4, gap: 10 },
  searchPlaceholder: { color: COLORS.gray, fontSize: SIZES.base },
  sectionTitle:      { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  vehicleScroll:     { paddingLeft: 16 },
  vehicleCard:       { width: 100, backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 14, marginRight: 12, alignItems: 'center', elevation: 2, borderWidth: 2, borderColor: 'transparent' },
  vehicleCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.accent },
  vehicleLabel:      { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8 },
  vehicleLabelActive:{ color: COLORS.white },
  vehicleDesc:       { fontSize: SIZES.xs, color: COLORS.gray, marginTop: 2, textAlign: 'center' },
  vehicleDescActive: { color: 'rgba(255,255,255,0.8)' },
  recentCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: SIZES.radius, elevation: 1 },
  recentIcon:        { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recentLabel:       { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
  recentAddress:     { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  bookBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, margin: 16, padding: 18, borderRadius: SIZES.radiusLg, gap: 10, elevation: 4 },
  bookBtnText:       { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});

export default HomeScreen;

