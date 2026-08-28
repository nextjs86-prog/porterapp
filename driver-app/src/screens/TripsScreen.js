import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from '../utils/theme';
import api from '../utils/api';

const TripCard = ({ trip }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View>
        <Text style={styles.tripId}>#{trip._id?.slice(-8)?.toUpperCase()}</Text>
        <Text style={styles.date}>
          {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <Text style={styles.earning}>+₹{Math.round((trip.fareBreakdown?.total || 0) * 0.8)}</Text>
    </View>

    <View style={styles.route}>
      <Icon name="circle-slice-8" size={12} color={COLORS.success} />
      <Text style={styles.routeText} numberOfLines={1}>{trip.pickup?.address}</Text>
    </View>
    <View style={[styles.route, { marginTop: 4 }]}>
      <Icon name="map-marker" size={12} color={COLORS.error} />
      <Text style={styles.routeText} numberOfLines={1}>{trip.drop?.address}</Text>
    </View>

    <View style={styles.cardFooter}>
      <View style={styles.footerLeft}>
        <Icon name="account" size={14} color={COLORS.textSecondary} />
        <Text style={styles.customerText}>{trip.customer?.name || trip.customer?.phone || 'Customer'}</Text>
      </View>
      <Text style={styles.vehicleText}>{trip.vehicleType?.replace('_', ' ')}</Text>
    </View>
  </View>
);

const TripsScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = async () => {
    try {
      const res = await api.get('/driver/trips');
      setTrips(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    (async () => { setLoading(true); await fetchTrips(); setLoading(false); })();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trips</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={trips}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => <TripCard trip={item} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🚛</Text>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptySub}>Completed deliveries will show up here</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: COLORS.primary },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, padding: 20 },
  headerTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white },
  card:        { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: 16, elevation: 2 },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  tripId:      { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  date:        { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  earning:     { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.success },
  route:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeText:   { fontSize: SIZES.sm, color: COLORS.textSecondary, flex: 1 },
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.grayLight },
  footerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  customerText:{ fontSize: SIZES.sm, color: COLORS.textSecondary },
  vehicleText: { fontSize: SIZES.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyTitle:  { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
  emptySub:    { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 8 },
});

export default TripsScreen;
