import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView, TextInput, Share } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';
import useAuthStore from '../store/useAuthStore';

const MenuItem = ({ icon, label, onPress, danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Icon name={icon} size={20} color={danger ? COLORS.error : COLORS.primary} />
    </View>
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    <Icon name="chevron-right" size={18} color={COLORS.gray} />
  </TouchableOpacity>
);

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState(user?.name || '');
  const [email,   setEmail]   = useState(user?.email || '');

  const handleSave = async () => {
    try {
      const api = require('../utils/api').default;
      const res = await api.put('/customer/profile', { name, email });
      updateUser(res.data);
      setEditing(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleShareReferral = () => {
    Share.share({
      message: `Use my referral code ${user?.referralCode} on Sahara Logistics and get a discount on your first delivery! Download the app to get started.`,
    });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
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
          <View style={styles.avatar}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
          {editing ? (
            <>
              <TextInput style={styles.nameInput} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={COLORS.gray} />
              <TextInput style={styles.emailInput} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={'rgba(255,255,255,0.6)'} keyboardType="email-address" />
              <View style={styles.editBtns}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.name}>{user?.name || 'Add your name'}</Text>
              <Text style={styles.phone}>{user?.phone}</Text>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Icon name="pencil" size={14} color={COLORS.white} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <Icon name="wallet" size={24} color={COLORS.accent} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.referralLabel}>Wallet Balance</Text>
            <Text style={styles.walletVal}>₹{user?.walletBalance || 0}</Text>
          </View>
        </View>

        {/* Referral Card */}
        {user?.referralCode && (
          <View style={styles.referralCard}>
            <Icon name="gift" size={24} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.referralLabel}>Your Referral Code</Text>
              <Text style={styles.referralCode}>{user.referralCode}</Text>
              <Text style={styles.referralHint}>Share it — you both get ₹50 wallet credit</Text>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareReferral}>
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu */}
        <View style={styles.menuSection}>
          <MenuItem icon="map-marker-multiple" label="Saved Addresses" onPress={() => {}} />
          <MenuItem icon="history"             label="Order History"   onPress={() => navigation.navigate('Orders')} />
          <MenuItem icon="headset"             label="Help & Support"  onPress={() => {}} />
          <MenuItem icon="translate"           label="Language"        onPress={() => {}} />
          <MenuItem icon="star-outline"        label="Rate the App"    onPress={() => {}} />
          <MenuItem icon="information-outline" label="About"           onPress={() => {}} />
          <MenuItem icon="logout"              label="Logout"          onPress={handleLogout} danger />
        </View>

        <Text style={styles.version}>QuickHaul v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: COLORS.primary },
  container:     { flex: 1, backgroundColor: COLORS.bgLight },
  header:        { backgroundColor: COLORS.primary, padding: 24, alignItems: 'center', paddingTop: 32, paddingBottom: 32 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name:          { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white },
  phone:         { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  editBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  editBtnText:   { color: COLORS.white, fontSize: SIZES.sm },
  nameInput:     { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.4)', paddingVertical: 4, textAlign: 'center', width: '80%' },
  emailInput:    { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.4)', paddingVertical: 4, textAlign: 'center', width: '80%' },
  editBtns:      { flexDirection: 'row', gap: 12, marginTop: 16 },
  saveBtn:       { backgroundColor: COLORS.white, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  saveBtnText:   { color: COLORS.primary, fontWeight: '700' },
  cancelBtn:     { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  cancelBtnText: { color: COLORS.white },
  walletCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: SIZES.radiusLg, elevation: 2 },
  walletVal:     { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.accent },
  referralCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 12, marginBottom: 16, padding: 16, borderRadius: SIZES.radiusLg, elevation: 2 },
  referralLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  referralCode:  { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.primary, letterSpacing: 2 },
  referralHint:  { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  shareBtn:      { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  shareBtnText:  { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '600' },
  menuSection:   { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: SIZES.radiusLg, overflow: 'hidden', elevation: 2 },
  menuItem:      { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.bgLight },
  menuIcon:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuIconDanger:{ backgroundColor: '#FEF2F2' },
  menuLabel:     { flex: 1, fontSize: SIZES.base, color: COLORS.textPrimary },
  menuLabelDanger:{ color: COLORS.error },
  version:       { textAlign: 'center', color: COLORS.gray, fontSize: SIZES.xs, padding: 24 },
});

export default ProfileScreen;

