import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, SafeAreaView,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES } from '../utils/theme';
import api from '../utils/api';

const VEHICLES = [
  { type: 'bike',        label: 'Bike',       icon: 'motorbike'     },
  { type: 'mini_truck',  label: '3-Wheeler',  icon: 'truck-outline' },
  { type: 'tempo',       label: 'Tata Ace',   icon: 'truck'         },
  { type: 'large_truck', label: 'Tata 407',   icon: 'truck-fast'    },
];

const Field = ({ label, ...props }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} placeholderTextColor={COLORS.gray} {...props} />
  </View>
);

const RegisterScreen = ({ navigation, route }) => {
  const [form, setForm] = useState({
    name: '', phone: route.params?.phone || '', email: '',
    vehicleType: 'mini_truck', vehicleNumber: '',
  });
  const [docs,    setDocs]    = useState({ drivingLicense: null, rc: null, aadhar: null, photo: null });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const pickDoc = async (docKey) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) {
      setDocs(d => ({ ...d, [docKey]: res.assets[0] }));
    }
  };

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.vehicleNumber) {
      return Alert.alert('Error', 'Fill all required fields');
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      Object.entries(docs).forEach(([k, v]) => {
        if (v) fd.append(k, { uri: v.uri, type: v.mimeType || 'image/jpeg', name: v.fileName || `${k}.jpg` });
      });
      const res = await api.post('/driver/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedDocs = res.data?.driver?.documents || {};
      const attempted = Object.entries(docs).filter(([k]) => k !== 'photo' && docs[k]);
      const confirmed = attempted.filter(([k]) => uploadedDocs[k]?.url);

      if (attempted.length > 0 && confirmed.length < attempted.length) {
        Alert.alert(
          'Registration submitted, but...',
          `Only ${confirmed.length}/${attempted.length} documents uploaded successfully. Please edit your profile later to re-upload the missing ones.`,
          [{ text: 'OK', onPress: () => navigation.replace('Login') }]
        );
      } else {
        Alert.alert('Success!', 'Registration submitted with all documents uploaded. Awaiting admin approval.', [
          { text: 'OK', onPress: () => navigation.replace('Login') },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const DocUpload = ({ docKey, label }) => (
    <TouchableOpacity style={[styles.docBtn, docs[docKey] && styles.docBtnDone]} onPress={() => pickDoc(docKey)}>
      <Icon name={docs[docKey] ? 'check-circle' : 'upload'} size={20} color={docs[docKey] ? COLORS.success : COLORS.primary} />
      <Text style={[styles.docLabel, docs[docKey] && { color: COLORS.success }]}>
        {docs[docKey] ? `${label} ✓` : `Upload ${label}`}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Registration</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Field label="Full Name *"      value={form.name}          onChangeText={v => set('name', v)}          placeholder="Enter your name" />
        <Field label="Phone Number *"   value={form.phone}         onChangeText={v => set('phone', v)}         placeholder="10-digit mobile" keyboardType="phone-pad" maxLength={10} />
        <Field label="Email"            value={form.email}         onChangeText={v => set('email', v)}         placeholder="email@example.com" keyboardType="email-address" />
        <Field label="Vehicle Number *" value={form.vehicleNumber} onChangeText={v => set('vehicleNumber', v.toUpperCase())} placeholder="KA01AB1234" autoCapitalize="characters" />

        <Text style={styles.sectionTitle}>Vehicle Type *</Text>
        <View style={styles.vehicleRow}>
          {VEHICLES.map(v => (
            <TouchableOpacity
              key={v.type}
              style={[styles.vehicleChip, form.vehicleType === v.type && styles.vehicleChipActive]}
              onPress={() => set('vehicleType', v.type)}
            >
              <Icon name={v.icon} size={18} color={form.vehicleType === v.type ? COLORS.white : COLORS.primary} />
              <Text style={[styles.vehicleChipText, form.vehicleType === v.type && { color: COLORS.white }]}>{v.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Documents</Text>
        <DocUpload docKey="drivingLicense" label="Driving License" />
        <DocUpload docKey="rc"             label="RC (Vehicle Registration)" />
        <DocUpload docKey="aadhar"         label="Aadhar Card" />
        <DocUpload docKey="photo"          label="Profile Photo" />

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleRegister} disabled={loading}
        >
          <Text style={styles.submitBtnText}>{loading ? 'Uploading documents...' : 'Submit Registration'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: COLORS.primary },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.primary },
  headerTitle:      { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.white },
  container:        { flex: 1, backgroundColor: COLORS.bgLight },
  field:            { marginBottom: 16 },
  label:            { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input:            { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.grayLight, borderRadius: SIZES.radius, padding: 14, fontSize: SIZES.base, color: COLORS.textPrimary },
  sectionTitle:     { fontSize: SIZES.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, marginTop: 8 },
  vehicleRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  vehicleChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  vehicleChipActive:{ backgroundColor: COLORS.primary },
  vehicleChipText:  { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  docBtn:           { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.grayLight, borderRadius: SIZES.radius, padding: 14, marginBottom: 10, borderStyle: 'dashed' },
  docBtnDone:       { borderColor: COLORS.success, borderStyle: 'solid', backgroundColor: '#F0FDF4' },
  docLabel:         { fontSize: SIZES.base, color: COLORS.primary, fontWeight: '500' },
  submitBtn:        { backgroundColor: COLORS.primary, padding: 18, borderRadius: SIZES.radiusLg, alignItems: 'center', marginTop: 24 },
  submitBtnText:    { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});

export default RegisterScreen;
