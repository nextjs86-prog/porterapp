import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';
import useDriverStore from '../store/useDriverStore';

const LoginScreen = ({ navigation }) => {
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const sendOtp = useDriverStore(s => s.sendOtp);

  const handleSend = async () => {
    if (phone.length !== 10) return Alert.alert('Error', 'Enter valid 10-digit number');
    setLoading(true);
    try {
      await sendOtp(phone);
      navigation.navigate('OTP', { phone });
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg === 'Driver not registered') {
        navigation.navigate('Register', { phone });
      } else {
        Alert.alert('Error', msg || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.logo}>🚛</Text>
        <Text style={styles.title}>Driver Login</Text>
        <Text style={styles.sub}>Enter your registered mobile number</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.inputRow}>
          <View style={styles.flag}><Text style={styles.flagText}>🇮🇳 +91</Text></View>
          <TextInput
            style={styles.input}
            placeholder="9876543210"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
            placeholderTextColor={COLORS.gray}
          />
        </View>
        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSend} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register', { phone: '' })}>
          <Text style={styles.registerText}>New driver? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Register here</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bgLight },
  header:       { backgroundColor: COLORS.primary, padding: 40, paddingTop: 80, alignItems: 'center' },
  logo:         { fontSize: 52, marginBottom: 12 },
  title:        { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.white },
  sub:          { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  card:         { backgroundColor: COLORS.white, margin: 20, borderRadius: SIZES.radiusLg, padding: 24, elevation: 4 },
  label:        { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },
  inputRow:     { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.grayLight, borderRadius: SIZES.radius, overflow: 'hidden', marginBottom: 20 },
  flag:         { backgroundColor: COLORS.bgLight, padding: 14, borderRightWidth: 1, borderRightColor: COLORS.grayLight, justifyContent: 'center' },
  flagText:     { fontSize: SIZES.base },
  input:        { flex: 1, padding: 14, fontSize: SIZES.base, color: COLORS.textPrimary },
  btn:          { backgroundColor: COLORS.primary, padding: 16, borderRadius: SIZES.radius, alignItems: 'center' },
  btnText:      { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
});

export default LoginScreen;
