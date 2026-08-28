import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from '../utils/theme';
import useDriverStore from '../store/useDriverStore';

const DocStatus = ({ label, verified }) => (
  <View style={styles.docRow}>
    <Icon name={verified ? 'check-circle' : 'clock-outline'} size={18} color={verified ? COLORS.success : COLORS.warning} />
    <Text style={styles.docLabel}>{label}</Text>
    <View style={[styles.docBadge, { backgroundColor: verified ? '#DCFCE7' : '#FEF3C7' }]}>
      <Text style={[styles.docBadgeText, { color: verified ? COLORS.success : COLORS.warning }]}>
        {verified ? 'Verified' : 'Pending'}
      </Text>
    </View>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const { driver, logout } = useDriverStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          await logout();
          navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}><Text style={{ fontSize: 40 }}>👤</Text></View>
          <Text style={styles.name}>{driver?.name || 'Driver'}</Text>
          <Text style={styles.phone}>{driver?.phone}</Text>
          <View style={styles.ratingRow}>
            <Icon name="star" size={16} color={COLORS.warning} />
            <Text style={styles.rating}>{driver?.rating || 5} ({driver?.totalRatings || 0} ratings)</Text>
          </View>
          <View style={[styles.approvalBadge, driver?.isApproved ? styles.approvedBadge : styles.pendingBadge]}>
            <Text style={[styles.approvalText, driver?.isApproved ? styles.approvedText : styles.pendingText]}>
              {driver?.isApproved ? '✓ Approved Driver' : '⏳ Pending Approval'}
            </Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle Details</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Type</Text><Text style={styles.infoVal}>{driver?.vehicleType?.replace('_', ' ')}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Number</Text><Text style={styles.infoVal}>{driver?.vehicleNumber}</Text></View>
        </View>

        {/* Documents */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Document Status</Text>
          <DocStatus label="Driving License" verified={driver?.documents?.drivingLicense?.verified} />
          <DocStatus label="RC (Vehicle)"    verified={driver?.documents?.rc?.verified}             />
          <DocStatus label="Aadhar Card"     verified={driver?.documents?.aadhar?.verified}         />
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>₹{driver?.totalEarnings || 0}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>⭐ {driver?.rating || 5}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {[
            { icon: 'headset',        label: 'Help & Support' },
            { icon: 'information',    label: 'About'          },
            { icon: 'file-document',  label: 'Terms & Policy' },
          ].map(({ icon, label }) => (
            <TouchableOpacity key={label} style={styles.menuItem}>
              <Icon name={icon} size={20} color={COLORS.primary} />
              <Text style={styles.menuLabel}>{label}</Text>
              <Icon name="chevron-right" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Icon name="logout" size={20} color={COLORS.error} />
            <Text style={[styles.menuLabel, { color: COLORS.error }]}>Logout</Text>
            <Icon name="chevron-right" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: COLORS.primary },
  container:     { flex: 1, backgroundColor: COLORS.bgLight },
  header:        { backgroundColor: COLORS.primary, padding: 24, alignItems: 'center', paddingBottom: 32 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name:          { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.white },
  phone:         { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  rating:        { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  approvalBadge: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  approvedBadge: { backgroundColor: COLORS.success },
  pendingBadge:  { backgroundColor: COLORS.warning },
  approvalText:  { fontSize: SIZES.sm, fontWeight: '700' },
  approvedText:  { color: COLORS.white },
  pendingText:   { color: COLORS.white },
  card:          { backgroundColor: COLORS.white, margin: 16, marginBottom: 0, borderRadius: SIZES.radiusLg, padding: 16, elevation: 2 },
  cardTitle:     { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.bgLight },
  infoLabel:     { fontSize: SIZES.sm, color: COLORS.textSecondary },
  infoVal:       { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textPrimary, textTransform: 'capitalize' },
  docRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.bgLight },
  docLabel:      { flex: 1, fontSize: SIZES.sm, color: COLORS.textPrimary },
  docBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  docBadgeText:  { fontSize: SIZES.xs, fontWeight: '700' },
  statsCard:     { flexDirection: 'row', backgroundColor: COLORS.primary, margin: 16, borderRadius: SIZES.radiusLg, padding: 20 },
  statItem:      { flex: 1, alignItems: 'center' },
  statVal:       { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white },
  statLabel:     { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  statDivider:   { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  menuCard:      { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: SIZES.radiusLg, overflow: 'hidden', elevation: 2 },
  menuItem:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.bgLight },
  menuLabel:     { flex: 1, fontSize: SIZES.base, color: COLORS.textPrimary },
});

export default ProfileScreen;
