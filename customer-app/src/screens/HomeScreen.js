import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';
import useAuthStore   from '../store/useAuthStore';
import useOrderStore  from '../store/useOrderStore';

const CATEGORIES = [
  { key: 'trucks',  label: 'Trucks',           emoji: '🚚', defaultVehicle: 'mini_truck' },
  { key: 'bike',    label: '2 Wheeler',        emoji: '🏍️', defaultVehicle: 'bike'        },
  { key: 'packers', label: 'Packers & Movers', emoji: '📦', comingSoon: true              },
];

const RECENT = [
  { id: 1, label: 'Home', address: '12 MG Road, Bangalore', icon: 'home' },
  { id: 2, label: 'Office', address: 'Prestige Tech Park, Whitefield', icon: 'office-building' },
];

const HomeScreen = ({ navigation }) => {
  const user            = useAuthStore(s => s.user);
  const { pickup, setSelectedVehicle, setPickup, setDrop } = useOrderStore();

  const handleCategoryPress = (cat) => {
    if (cat.comingSoon) {
      Alert.alert('Coming Soon', 'Packers & Movers service will be available on SAHARA soon!');
      return;
    }
    setSelectedVehicle(cat.defaultVehicle);
    navigation.navigate('Booking');
  };

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

        {/* Pick up from card */}
        <TouchableOpacity
          style={styles.pickupCard}
          onPress={() => navigation.navigate('Booking')}
          activeOpacity={0.8}
        >
          <View style={styles.pickupIconWrap}>
            <Icon name="arrow-up" size={18} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickupLabel}>Pick up from</Text>
            <Text style={styles.pickupAddress} numberOfLines={1}>
              {pickup?.address || 'Enter pickup location...'}
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={COLORS.gray} />
        </TouchableOpacity>

        {/* Category Grid */}
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryCard, cat.key === 'packers' && styles.categoryCardWide]}
              onPress={() => handleCategoryPress(cat)}
              activeOpacity={0.85}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <View style={styles.categoryLabelRow}>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Icon name="chevron-right" size={18} color={COLORS.textPrimary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rewards banner */}
        <TouchableOpacity
          style={styles.rewardsBanner}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 26 }}>🪙</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.rewardsTitle}>Explore SAHARA Rewards</Text>
            <Text style={styles.rewardsSub}>Refer friends & earn wallet cashback</Text>
          </View>
          <Icon name="chevron-right" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

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
  sectionTitle:      { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  pickupCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 16, padding: 16, borderRadius: SIZES.radiusLg, elevation: 4, gap: 12 },
  pickupIconWrap:    { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' },
  pickupLabel:       { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },
  pickupAddress:     { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  categoryGrid:      { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 12, gap: 12 },
  categoryCard:      { flexBasis: '46%', flexGrow: 1, backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: 18, elevation: 2, minHeight: 130, justifyContent: 'space-between' },
  categoryCardWide:  { flexBasis: '100%' },
  categoryEmoji:     { fontSize: 40 },
  categoryLabelRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  categoryLabel:     { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  rewardsBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', marginHorizontal: 16, marginTop: 20, padding: 16, borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: '#FED7AA' },
  rewardsTitle:      { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },
  rewardsSub:        { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  recentCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: SIZES.radius, elevation: 1 },
  recentIcon:        { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recentLabel:       { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
  recentAddress:     { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  bookBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, margin: 16, padding: 18, borderRadius: SIZES.radiusLg, gap: 10, elevation: 4 },
  bookBtnText:       { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});

export default HomeScreen;

