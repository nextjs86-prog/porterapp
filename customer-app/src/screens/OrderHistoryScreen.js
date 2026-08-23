import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';
import useOrderStore from '../store/useOrderStore';

const STATUS_COLORS = {
  delivered:  { bg: '#DCFCE7', text: COLORS.success },
  cancelled:  { bg: '#FEE2E2', text: COLORS.error },
  in_transit: { bg: '#FEF3C7', text: COLORS.warning },
  accepted:   { bg: '#DBEAFE', text: COLORS.accent },
  searching:  { bg: '#F0F9FF', text: COLORS.accent },
};

const OrderCard = ({ order, navigation }) => {
  const sc = STATUS_COLORS[order.status] || { bg: COLORS.grayLight, text: COLORS.gray };
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>#{order._id?.slice(-8)?.toUpperCase()}</Text>
          <Text style={styles.date}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>{order.status?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.route}>
        <Icon name="circle-slice-8" size={12} color={COLORS.success} />
        <Text style={styles.routeText} numberOfLines={1}>{order.pickup?.address}</Text>
      </View>
      <View style={[styles.route, { marginTop: 4 }]}>
        <Icon name="map-marker" size={12} color={COLORS.error} />
        <Text style={styles.routeText} numberOfLines={1}>{order.drop?.address}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Icon name="truck" size={14} color={COLORS.textSecondary} />
          <Text style={styles.vehicleText}>{order.vehicleType?.replace('_', ' ')}</Text>
        </View>
        <Text style={styles.fareText}>₹{order.fareBreakdown?.total}</Text>
      </View>

      {order.status === 'delivered' && (
        <TouchableOpacity
          style={styles.rebookBtn}
          onPress={() => navigation.navigate('Booking')}
        >
          <Text style={styles.rebookText}>Rebook</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const OrderHistoryScreen = ({ navigation }) => {
  const { orderHistory, fetchOrderHistory } = useOrderStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchOrderHistory(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrderHistory();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      <FlatList
        data={orderHistory}
        keyExtractor={i => i._id}
        renderItem={({ item }) => <OrderCard order={item} navigation={navigation} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>Book your first vehicle to get started</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Booking')}>
              <Text style={styles.emptyBtnText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: COLORS.primary },
  header:      { backgroundColor: COLORS.primary, padding: 20 },
  headerTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white },
  card:        { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: 16, elevation: 2 },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId:     { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  date:        { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  badge:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText:   { fontSize: 10, fontWeight: '700' },
  route:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeText:   { fontSize: SIZES.sm, color: COLORS.textSecondary, flex: 1 },
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.grayLight },
  footerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vehicleText: { fontSize: SIZES.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  fareText:    { fontSize: SIZES.base, fontWeight: '700', color: COLORS.primary },
  rebookBtn:   { backgroundColor: '#EFF6FF', padding: 10, borderRadius: SIZES.radius, alignItems: 'center', marginTop: 12 },
  rebookText:  { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: '700' },
  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyTitle:  { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
  emptySub:    { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 8 },
  emptyBtn:    { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: SIZES.radiusLg, marginTop: 24 },
  emptyBtnText:{ color: COLORS.white, fontWeight: '700' },
});

export default OrderHistoryScreen;

