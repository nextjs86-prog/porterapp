import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';

const ConfirmationScreen = ({ navigation, route }) => {
  const { orderId } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Icon name="check-circle" size={80} color={COLORS.success} />
        </View>

        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.sub}>Your shipment has been successfully delivered.</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Order ID</Text>
            <Text style={styles.rowVal}>#{orderId?.slice(-8)?.toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>DELIVERED</Text></View>
          </View>
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.replace('Main')}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.replace('Main', { screen: 'Orders' })}
        >
          <Text style={styles.historyBtnText}>View Order History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bgLight, justifyContent: 'center' },
  content:      { alignItems: 'center', padding: 32 },
  successIcon:  { marginBottom: 24 },
  title:        { fontSize: SIZES.xxxl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  sub:          { fontSize: SIZES.base, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32 },
  card:         { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: 20, width: '100%', elevation: 2, marginBottom: 32 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rowLabel:     { fontSize: SIZES.sm, color: COLORS.textSecondary },
  rowVal:       { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary },
  badge:        { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText:    { fontSize: SIZES.xs, color: COLORS.success, fontWeight: '700' },
  homeBtn:      { backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 48, borderRadius: SIZES.radiusLg, width: '100%', alignItems: 'center', marginBottom: 12 },
  homeBtnText:  { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
  historyBtn:   { paddingVertical: 12 },
  historyBtnText:{ color: COLORS.primary, fontSize: SIZES.base, fontWeight: '600' },
});

export default ConfirmationScreen;

