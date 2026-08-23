import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from '../utils/theme';
import useDriverStore from '../store/useDriverStore';
import api from '../utils/api';

const PERIODS = [
  { key: 'daily',   label: 'Today'  },
  { key: 'weekly',  label: 'Week'   },
  { key: 'monthly', label: 'Month'  },
];

const EarningsScreen = () => {
  const { fetchEarnings } = useDriverStore();
  const [period,   setPeriod]   = useState('daily');
  const [earnings, setEarnings] = useState(null);
  const [trips,    setTrips]    = useState([]);

  useEffect(() => { loadData(); }, [period]);

  const loadData = async () => {
    const data = await fetchEarnings(period);
    setEarnings(data);
    const tripRes = await api.get('/driver/trips');
    setTrips(tripRes.data);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView style={styles.container}>
        {/* Period Tabs */}
        <View style={styles.tabs}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.tab, period === p.key && styles.tabActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Your Earnings</Text>
          <Text style={styles.summaryVal}>₹{earnings?.driverShare || 0}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemVal}>{earnings?.trips || 0}</Text>
              <Text style={styles.summaryItemLabel}>Trips</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemVal}>₹{earnings?.total || 0}</Text>
              <Text style={styles.summaryItemLabel}>Gross</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemVal}>₹{(earnings?.total || 0) - (earnings?.driverShare || 0)}</Text>
              <Text style={styles.summaryItemLabel}>Commission</Text>
            </View>
          </View>
        </View>

        {/* Withdraw */}
        <TouchableOpacity style={styles.withdrawBtn}>
          <Icon name="bank-transfer-out" size={20} color={COLORS.white} />
          <Text style={styles.withdrawText}>Withdraw Earnings</Text>
        </TouchableOpacity>

        {/* Trip History */}
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        {trips.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🚛</Text>
            <Text style={styles.emptyText}>No trips yet</Text>
          </View>
        )}
        {trips.map(trip => (
          <View key={trip._id} style={styles.tripCard}>
            <View style={styles.tripInfo}>
              <Text style={styles.tripId}>#{trip._id?.slice(-6)?.toUpperCase()}</Text>
              <Text style={styles.tripDate}>{new Date(trip.createdAt).toLocaleDateString('en-IN')}</Text>
            </View>
            <View style={styles.tripRoute}>
              <Icon name="circle-slice-8" size={10} color={COLORS.success} />
              <Text style={styles.tripAddr} numberOfLines={1}>{trip.pickup?.address}</Text>
            </View>
            <View style={styles.tripRoute}>
              <Icon name="map-marker" size={10} color={COLORS.error} />
              <Text style={styles.tripAddr} numberOfLines={1}>{trip.drop?.address}</Text>
            </View>
            <Text style={styles.tripFare}>+₹{Math.round((trip.fareBreakdown?.total || 0) * 0.8)}</Text>
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: COLORS.primary },
  header:           { backgroundColor: COLORS.primary, padding: 20 },
  headerTitle:      { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white },
  container:        { flex: 1, backgroundColor: COLORS.bgLight },
  tabs:             { flexDirection: 'row', backgroundColor: COLORS.white, margin: 16, borderRadius: SIZES.radiusLg, padding: 4 },
  tab:              { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: SIZES.radius },
  tabActive:        { backgroundColor: COLORS.primary },
  tabText:          { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive:    { color: COLORS.white },
  summaryCard:      { backgroundColor: COLORS.primary, marginHorizontal: 16, borderRadius: SIZES.radiusLg, padding: 24, alignItems: 'center' },
  summaryLabel:     { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)' },
  summaryVal:       { fontSize: 44, fontWeight: '700', color: COLORS.white, marginVertical: 8 },
  summaryRow:       { flexDirection: 'row', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: SIZES.radius, padding: 12, justifyContent: 'space-around' },
  summaryItem:      { alignItems: 'center' },
  summaryItemVal:   { fontSize: SIZES.base, fontWeight: '700', color: COLORS.white },
  summaryItemLabel: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  summaryDivider:   { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  withdrawBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.success, margin: 16, padding: 16, borderRadius: SIZES.radiusLg },
  withdrawText:     { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
  sectionTitle:     { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginHorizontal: 16, marginBottom: 8 },
  empty:            { alignItems: 'center', padding: 40 },
  emptyText:        { fontSize: SIZES.base, color: COLORS.textSecondary, marginTop: 12 },
  tripCard:         { backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: SIZES.radius, elevation: 1 },
  tripInfo:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tripId:           { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },
  tripDate:         { fontSize: SIZES.xs, color: COLORS.textSecondary },
  tripRoute:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  tripAddr:         { fontSize: SIZES.xs, color: COLORS.textSecondary, flex: 1 },
  tripFare:         { fontSize: SIZES.base, fontWeight: '700', color: COLORS.success, textAlign: 'right', marginTop: 6 },
});

export default EarningsScreen;
